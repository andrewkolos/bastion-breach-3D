import * as THREE from 'three';
import { CardObject3d } from '../card-object3d/card-object3d';
import { Animation } from './animation';
import { Easings, Group, Timeline, Tween } from '@akolos/ts-tween';
import { EventEmitter, InheritableEventEmitter } from '@akolos/event-emitter';
import { AnimationEvents } from './animation-events';

const CARD_DEALING_ANIMATION_DURATION = 500;
const CARD_SETTING_ANIMATION_DURATION = 300;
const CARD_FLIPPING_ANIMATION_DURATION = 200;
const CARD_LIFT_ANIMATION_DURATION = 250;
const CARD_FACEDOWN_ROTATION = new THREE.Euler(Math.PI / 2, 0, 0);

interface Coordinate {
  x?: number,
  y?: number,
  z?: number,
}

interface AnimatableCardProps {
  position?: Coordinate;
  rotation?: Coordinate;
}

export interface HandLayout {
  centerAt: THREE.Vector3;
  spaceBetweenCardCenters: THREE.Vector3;
  rotation: THREE.Euler;
}

function asAnimation(timeline: Timeline): Animation {
  const ee = new EventEmitter<AnimationEvents>();

  const animation: Animation = {
    get on() { return on; },
    get off() { return off; },
    complete: () => timeline.complete(),
    length: timeline.length,
    get localTime() { return timeline.localTime },
    stop: () => timeline.stop(),
    chain(o: Animation) {
      const seq = Tween.sequence()
        .append(this._underylingTimeline)
        .append(o._underylingTimeline)
        .start();
      if (this.localTime > 0) {
        seq.seek(this.localTime);
      }
      return asAnimation(seq);
    },
    _underylingTimeline: timeline,
  };

  const on = ee.makeDelegate('on', animation);
  const off = ee.makeDelegate('off', animation);

  timeline.on('completed', () => {
    ee.emit('completed');
  });
  timeline.on('updated', () => ee.emit('updated'));
  timeline.on('stopped', () => ee.emit('stopped'))

  return animation;
}

export interface CardAnimatorEvents {
  cardFlippedUp: () => void;
  cardHitTable: () => void;
}

export class CardAnimator extends InheritableEventEmitter<CardAnimatorEvents> {
  private readonly inProgressAnimationsByCard = new Map<CardObject3d, Animation>();

  public animateIntoDeck(cards: CardObject3d[], bottomCardPosition: THREE.Vector3): Animation {
    const tweens = cards.map((c, index) => {
      const tween = this._animate(c, {
        position: bottomCardPosition.clone().setY(bottomCardPosition.y + (index * 0.001)),
        rotation: CARD_FACEDOWN_ROTATION,
      }, CARD_DEALING_ANIMATION_DURATION);

      this.registerNewAnimation(c, asAnimation(tween));
      return tween;
    });
    return asAnimation(Tween.group(tweens));
  }

  public completeAllAnimations() {
    [...this.inProgressAnimationsByCard.values()].forEach(a => a.complete());
  }

  public animateHand(cards: CardObject3d[], to: HandLayout): Animation {
    const { centerAt, spaceBetweenCardCenters, rotation } = to;
    if (cards.length === 0) return asAnimation(Tween.get(0).to(0).with({ easing: Easings.linear, length: 0 }));

    const cardWidth = new THREE.Box3().setFromObject(cards[0]).getSize(new THREE.Vector3()).x;
    const firstCardLocX = centerAt.x - ((cardWidth + spaceBetweenCardCenters.x) / 2) * (cards.length - 1);

    const cardXPositions = range(cards.length).map(
      (index) => firstCardLocX + (cardWidth + spaceBetweenCardCenters.x) * index,
    );

    const cardTweens = cards.map((card, index) => {
      const target = {
        position: new THREE.Vector3(
          cardXPositions[index],
          centerAt.y + spaceBetweenCardCenters.y * index,
          centerAt.z + spaceBetweenCardCenters.z * index,
        ),
        rotation: rotation.clone(),
      };
      const anim = this._animate(card, target, CARD_DEALING_ANIMATION_DURATION);
      this.registerNewAnimation(card, asAnimation(anim));
      return anim;
    });

    return asAnimation(Tween.group(cardTweens));
  }

  public playCard(card: CardObject3d, position: THREE.Vector3): Animation {

    const liftCard = this._animate(card, {
      position: {y: card.position.y + 0.7, z: card.position.z - 1},
    }, CARD_LIFT_ANIMATION_DURATION);

    const setCard = this._animate(card, {
      position,
      rotation: {
        x: Math.PI / 2
      }
    }, CARD_SETTING_ANIMATION_DURATION)

    const flipUp = this._animate(card, {
      position: { y: position.y + 1 },
      rotation: {
        x: - Math.PI / 2
      }
    }, CARD_FLIPPING_ANIMATION_DURATION);
    flipUp.on('started', () => {
      this.emit('cardFlippedUp');
    });

    const layDown = this._animate(card, { position }, CARD_FLIPPING_ANIMATION_DURATION);
    layDown.on('completed', () => this.emit('cardHitTable'));

    const sequence = Tween.sequence()
      .append(liftCard)
      .append(setCard)
      .append(flipUp, 100)
      .append(layDown)
      .start();
    const sequenceAsAnimation = asAnimation(sequence);

    this.registerNewAnimation(card, sequenceAsAnimation);
    return sequenceAsAnimation;
  }

  private _animate(card: CardObject3d, props: AnimatableCardProps, durationMs: number): Group<Tween<unknown>> {

    const tweens: Array<Tween<unknown>> = [];

    if (props.rotation)
    {
      tweens.push(Tween.get(card)
        .to({ rotation: extractCoordinate(props.rotation) })
        .with({
          easing: Easings.outQuad,
          length: durationMs * 0.8,
        }));
    }
    if (props.position)
    {
      const tween = Tween.get(card)
      .to({position: extractCoordinate(props.position)})
      .with({
        easing: Easings.outQuad,
        length: durationMs,
      });
      tweens.push(tween);
    }
    return Tween.group(tweens);
  }

  private registerNewAnimation(card: CardObject3d, animation: Animation) {
    animation.on('completed', () => this.inProgressAnimationsByCard.delete(card));
    const currentAnim = this.inProgressAnimationsByCard.get(card);
    currentAnim?.stop();
    this.inProgressAnimationsByCard.set(card, animation);
  }
}

function extractCoordinate(coordinate: Coordinate): Coordinate {
  const { x, y, z } = coordinate;
  const obj = { x, y, z } as any;
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key])
  return obj;
}

function range(n: number): number[] {
  return [...Array(n).keys()];
}
