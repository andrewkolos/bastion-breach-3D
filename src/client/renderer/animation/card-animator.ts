import { Card, CardAbbreviation } from '../../../card/card';
import THREE, { Box3, Euler, Vector3 } from 'three';
import { CardObject3d } from '../card-object3d/card-object3d';
import TWEEN, { Easing, Tween } from '@tweenjs/tween.js';
import { CARD_WIDTH } from '../card-object3d/card-object3d-factory';
import { Animation } from './animation';
import { DeepPartialNoFunc } from './deep-partial-no-func';

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
  private tweenByCard = new Map<CardObject3d, Tween<any>>();

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

  public animateHand(cards: CardObject3d[], to: HandLayout) {
    const { centerAt, spaceBetweenCardCenters, rotation } = to;
    if (cards.length === 0) return;

    const cardWidth = new Box3().setFromObject(cards[0]).getSize(new Vector3()).x;
    const firstCardLocX = centerAt.x - ((cardWidth + spaceBetweenCardCenters.x) / 2) * (cards.length - 1);

    const cardXPositions = range(cards.length).map(
      (index) => firstCardLocX + (cardWidth + spaceBetweenCardCenters.x) * index,
    );

    cards.forEach((card, index) => {
      const target = {
        position: new Vector3(
          cardXPositions[index],
          centerAt.y + spaceBetweenCardCenters.y,
          centerAt.z + spaceBetweenCardCenters.z,
        ),
        rotation: rotation.clone(),
      };
      this._animateCard(card, target, CARD_DEALING_ANIMATION_DURATION);
    });
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
    this.registerTween(card, flipUp);
  }

  public animateCard(
    card: CardObject3d,
    to: { position: THREE.Vector3; rotation: THREE.Euler },
    animationDuration: number,
  ) {
    this._animateCard(card, to, animationDuration);
  }

  public updateInProgressAnimations() {
    this.tweenGroup.update();
  }

  private _animateCard(
    card: CardObject3d,
    to: { position: THREE.Vector3; rotation: THREE.Euler },
    animationDuration: number,
  ): Tween<CardObject3d> {
    const tween = new Tween(card, this.tweenGroup)
      .to(to, animationDuration)
      .easing(Easing.Quadratic.Out)
      .onUpdate((value: { position: THREE.Vector3, rotation: THREE.Euler }) => {
        card.position.copy(value.position);
        card.rotation.copy(value.rotation);
      })
      .start();

    this.registerTween(card, tween);
    return tween;
  }

  private registerTween(target: CardObject3d, tween: Tween<any>) {
    stopCardsCurrentAnimation(this);
    this.tweenByCard.set(target, tween);

    function stopCardsCurrentAnimation(self: CardAnimator) {
      const currentTween = self.tweenByCard.get(target);
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
