import { Card, CardAbbreviation } from '../../../card/card';
import THREE, { Box3, Euler, Vector3 } from 'three';
import { CardObject3d } from '../card-object3d/card-object3d';
import TWEEN, { Easing, Tween } from '@tweenjs/tween.js';
import { CARD_WIDTH } from '../card-object3d/card-object3d-factory';
import { Animation } from './animation';
import { CompositeAnimation } from './composite-animation';
import { TweenJsAnimation } from './tween-animation';

const CARD_DEALING_ANIMATION_DURATION = 1000;
const CARD_FLIPPING_ANIMATION_DURATION = 200;
const CARD_FACEDOWN_ROTATION = new THREE.Euler(Math.PI / 2, 0, 0);

export interface HandLayout {
  centerAt: Vector3;
  spaceBetweenCardCenters: Vector3;
  rotation: Euler;
}

export class CardAnimator {
  private objectsByCardAbbreviation = new Map<CardAbbreviation, CardObject3d>();
  private tweenGroup = new TWEEN.Group();
  private animationByCard = new Map<CardObject3d, Tween<any>>();

  public constructor(cardObjects: CardObject3d[]) {
    cardObjects.forEach((co) => this.objectsByCardAbbreviation.set(new Card(co).toString(), co));
  }

  public animateIntoDeck(bottomCardPosition: THREE.Vector3): void {
    const cards = Array.from(this.objectsByCardAbbreviation.values());

    cards.forEach((c, index) => this.animateCard(c, {
      position: bottomCardPosition.clone().setY(bottomCardPosition.y + (index * 0.01)),
      rotation: CARD_FACEDOWN_ROTATION,
    }, CARD_DEALING_ANIMATION_DURATION));
  }

  public completeAllAnimations() {
    this.tweenGroup.getAll().forEach((tween) => tween.end());
  }

  public animateHand(cards: CardObject3d[], to: HandLayout): Animation {
    const { centerAt, spaceBetweenCardCenters, rotation } = to;
    if (cards.length === 0) throw Error("No cards were given to animate.");

    const cardWidth = new Box3().setFromObject(cards[0]).getSize(new Vector3()).x;
    const firstCardLocX = centerAt.x - ((cardWidth + spaceBetweenCardCenters.x) / 2) * (cards.length - 1);

    const cardXPositions = range(cards.length).map(
      (index) => firstCardLocX + (cardWidth + spaceBetweenCardCenters.x) * index,
    );

    const cardAnimations = cards.map((card, index) => {
      const target = {
        position: new Vector3(
          cardXPositions[index],
          centerAt.y + spaceBetweenCardCenters.y,
          centerAt.z + spaceBetweenCardCenters.z,
        ),
        rotation: rotation.clone(),
      };
      return this.animateCard(card, target, CARD_DEALING_ANIMATION_DURATION);
    });

    return new CompositeAnimation(cardAnimations);
  }

  public flipCard(card: CardObject3d) {
    const startPos = card.position.clone();
    const flipUp = new Tween(card, this.tweenGroup)
      .to({
        position: { y: startPos.y + CARD_WIDTH } // Not sufficient to avoid clipping with table if card is not flat.
      })
      .duration(CARD_FLIPPING_ANIMATION_DURATION / 2);
    const layDown = new Tween(card, this.tweenGroup)
      .to({
        position: startPos
      })
      .duration(CARD_FLIPPING_ANIMATION_DURATION / 2);

    flipUp.chain(layDown).start(); // Note: this does not create a new tween as of library version 18.
    this.registerAnimation(card, flipUp);
  }

  public updateInProgressAnimations() {
    this.tweenGroup.update();
  }

  public animateCard(
    card: CardObject3d,
    to: { position: THREE.Vector3; rotation: THREE.Euler },
    animationDuration: number,
  ): Animation {
    const tween = new Tween(card, this.tweenGroup)
      .to(to, animationDuration)
      .easing(Easing.Quadratic.Out)
      .onUpdate((value: { position: THREE.Vector3, rotation: THREE.Euler }) => {
        card.position.copy(value.position);
        card.rotation.copy(value.rotation);
      })
      .start();

    this.registerAnimation(card, tween);
    return new TweenJsAnimation(tween);
  }

  private registerAnimation(target: CardObject3d, tween: Tween<any>) {
    stopCardsCurrentAnimation(this);
    this.animationByCard.set(target, tween);

    function stopCardsCurrentAnimation(self: CardAnimator) {
      const currentTween = self.animationByCard.get(target);
      if (currentTween != null) {
        currentTween.stop();
        currentTween.stopChainedTweens();
      }
    }
  }
}

function range(n: number): number[] {
  return [...Array(n).keys()];
}
