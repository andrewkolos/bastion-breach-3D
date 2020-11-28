import THREE, { Box3, Euler, Vector3 } from 'three';
import { CardObject3d } from '../card-object3d/card-object3d';
import { CARD_WIDTH } from '../card-object3d/card-object3d-factory';
import { Animation } from './animation';
import { DeepPartial, Easings, Timeline, Tween } from '@akolos/ts-tween';
import { EventEmitter } from '@akolos/event-emitter';
import { AnimationEvents } from './animation-events';

const CARD_DEALING_ANIMATION_DURATION = 1000;
const CARD_FLIPPING_ANIMATION_DURATION = 200;
const CARD_LIFT_ANIMATION_DURATION = 200;
const CARD_FACEDOWN_ROTATION = new THREE.Euler(Math.PI / 2, 0, 0);

export interface HandLayout {
  centerAt: Vector3;
  spaceBetweenCardCenters: Vector3;
  rotation: Euler;
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

    const cardWidth = new Box3().setFromObject(cards[0]).getSize(new Vector3()).x;
    const firstCardLocX = centerAt.x - ((cardWidth + spaceBetweenCardCenters.x) / 2) * (cards.length - 1);

    const cardXPositions = range(cards.length).map(
      (index) => firstCardLocX + (cardWidth + spaceBetweenCardCenters.x) * index,
    );

    const cardTweens = cards.map((card, index) => {
      const target = {
        position: new Vector3(
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

  private _animate(card: CardObject3d, props: DeepPartial<CardObject3d>, durationMs: number): Tween<CardObject3d> {
    return Tween.start(card, props, { easing: Easings.easeOutQuad, length: durationMs });
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
