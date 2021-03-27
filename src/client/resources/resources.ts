import { Object3D, Texture } from 'three';
import { Rank } from '../../card';
import { Card } from '../../card/card';
import { Suit } from '../../card/suit';

export interface CardFaceTextureData {
  rank: Rank;
  suit: Suit;
  texture: Texture;
}

export interface CardTextureResources {
  backSideAlpha: Texture;
  backSide: Texture;
  frontSideAlpha: Texture;
  getFront(card: Card): THREE.Texture;
}

export interface CardTextures {
  backSideAlpha: Texture;
  backSide: Texture;
  frontSideAlpha: Texture;
  frontSide: Texture;
}

export interface Resources {
  table: Object3D;
  cards: CardTextureResources;
  grassTexture: THREE.Texture;
}
