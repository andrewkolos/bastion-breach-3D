import * as Three from 'three';
import { Card, CardAbbreviation } from 'card/card';
import { Object3D } from 'three';

export class CardObject3dCollection {
  private cardToObj = new Map<CardAbbreviation, Three.Object3D>();
  private objToCard = new Map<Three.Object3D, Card>();

  public get cards(): Card[] {
    return Array.from(this.cardToObj.keys()).map(cardStr => Card.parse(cardStr));
  }

  public get object3ds(): Object3D[] {
    return Array.from(this.objToCard.keys());
  }

  public get size(): number {
    return this.cardToObj.size;
  }

  public add(card: Card, object: Three.Object3D) {
    this.cardToObj.set(card.toString(), object);
    this.objToCard.set(object, card);
  }

  public has(card: Card): boolean;
  public has(object: Object3D): boolean;
  public has(cardOrObject: Card | Object3D): boolean {
    if (isCard(cardOrObject)) {
      return this.cardToObj.has(cardOrObject.toString());
    } else {
      return this.objToCard.has(cardOrObject);
    }
  }

  public remove(card: Card): boolean;
  public remove(object: Object3D): boolean;
  public remove(cardOrObject: Card | Object3D): boolean {
    if (isCard(cardOrObject)) {
      return this.cardToObj.delete(cardOrObject.toString());
    } else {
      return this.objToCard.delete(cardOrObject);
    }
  }

  public getObject(card: Card): Object3D {
    const result = this.cardToObj.get(card.toString());
    if (result == null) {
      throw Error(`Did not find card: ${card}`);
    }
    return result;
  }

  public getCard(object: Object3D): Card {
    const result = this.objToCard.get(object);
    if (result == null) {
      throw Error(`Did not find card object: ${object}`);
    }
    return result;
  }
}

function isCard(card: any): card is Card {
  return (card as Card).rank != null && (card as Card).suit != null;
}
