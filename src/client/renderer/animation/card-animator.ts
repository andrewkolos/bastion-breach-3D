import * as THREE from 'three';
import { CardObject3d } from '../card-object3d/card-object3d';
import { CARD_WIDTH } from '../card-object3d/card-object3d-factory';
import { Animation } from './animation';
import { Easings, Timeline, Tween } from '@akolos/ts-tween';
import { EventEmitter } from '@akolos/event-emitter';
import { AnimationEvents } from './animation-events';

const CARD_DEALING_ANIMATION_DURATION = 1000;
const CARD_FLIPPING_ANIMATION_DURATION = 200;
const CARD_LIFT_ANIMATION_DURATION = 200;
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

function extractCoordinate(coordinate: Coordinate): Coordinate {
  const { x, y, z } = coordinate;
  return { x, y, z };
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

  return animation;
}

export class CardAnimator {
  private readonly inProgressAnimationsByCard = new Map<CardObject3d, Animation>();

  public animateIntoDeck(cards: CardObject3d[], bottomCardPosition: THREE.Vector3): void {
    cards.forEach((c, index) => this.animateCard(c, {
      position: bottomCardPosition.clone().setY(bottomCardPosition.y + (index * 0.01)),
      rotation: CARD_FACEDOWN_ROTATION,
    }, CARD_DEALING_ANIMATION_DURATION));
  }

  public completeAllAnimations() {
    [...this.inProgressAnimationsByCard.values()].forEach(a => a.complete());
  }

  public animateHand(cards: CardObject3d[], to: HandLayout): Animation {
    const { centerAt, spaceBetweenCardCenters, rotation } = to;
    if (cards.length === 0) throw Error("No cards were given to animate.");

    const cardWidth = new THREE.Box3().setFromObject(cards[0]).getSize(new THREE.Vector3()).x;
    const firstCardLocX = centerAt.x - ((cardWidth + spaceBetweenCardCenters.x) / 2) * (cards.length - 1);

    const cardXPositions = range(cards.length).map(
      (index) => firstCardLocX + (cardWidth + spaceBetweenCardCenters.x) * index,
    );

    const cardTweens = cards.map((card, index) => {
      const target = {
        position: new THREE.Vector3(
          cardXPositions[index],
          centerAt.y + spaceBetweenCardCenters.y,
          centerAt.z + spaceBetweenCardCenters.z,
        ),
        rotation: rotation.clone(),
      };
      return this._animate(card, target, CARD_DEALING_ANIMATION_DURATION);
    });

    return asAnimation(Tween.group(cardTweens));
  }

  public playCard(card: CardObject3d, position: THREE.Vector3): Animation {
    const startPos = card.position.clone();

    const liftCard = this._animate(card, {
      position: position.clone().add(new THREE.Vector3(0, 0.7, -1)),
    }, CARD_LIFT_ANIMATION_DURATION)

    const flipUp = this._animate(card, {
      position: { y: startPos.y + CARD_WIDTH } // Not sufficient to avoid clipping with table if card is not flat.
    }, CARD_FLIPPING_ANIMATION_DURATION / 2);

    const layDown = this._animate(card, { position: startPos }, CARD_FLIPPING_ANIMATION_DURATION / 2);

    const sequence = Tween.sequence()
      .append(liftCard)
      .append(flipUp)
      .append(layDown)
      .start();
    const sequenceAsAnimation = asAnimation(sequence);

    this.registerNewAnimation(card, sequenceAsAnimation);
    return sequenceAsAnimation;
  }

  public animateCard(
    card: CardObject3d,
    to: { position: THREE.Vector3; rotation: THREE.Euler },
    animationDuration: number,
  ): Animation {
    return asAnimation(this._animate(card, to, animationDuration));
  }

  private _animate(card: CardObject3d, props: AnimatableCardProps, durationMs: number): Tween<AnimatableCardProps> {
    return Tween.get({
      position: extractCoordinate(card.position),
      rotation: extractCoordinate(card.rotation),
    })
      .to({
        position: props.position ? extractCoordinate(props.position) : undefined,
        rotation: props.rotation ? extractCoordinate(props.rotation) : undefined,
      })
      .with({
        easing: Easings.outQuad,
        length: durationMs
      })
      .on('updated', ({ value }) => {
        const { position, rotation } = value;
        card.position.set(position.x ?? card.position.x,
          position.y ?? card.position.y,
          position.z ?? card.position.z);
        card.rotation.set(rotation.x ?? card.rotation.x,
          rotation.y ?? card.rotation.y,
          rotation.z ?? card.rotation.z);
      });
  }

  private registerNewAnimation(card: CardObject3d, animation: Animation) {
    const currentAnim = this.inProgressAnimationsByCard.get(card);
    currentAnim?.stop();
    this.inProgressAnimationsByCard.set(card, animation);
  }
}

function range(n: number): number[] {
  return [...Array(n).keys()];
}
