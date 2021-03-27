import * as THREE from 'three';
import { CardTextureResources } from '../../resources/resources';
import { Card, CardAbbreviation } from '../../../card/card';
import { CardObject3d } from './card-object3d';

export const CARD_WIDTH = 500;
export const CARD_HEIGHT = 726;

export type CardObject3dFactory = (card: Card) => CardObject3d;

export function createCardObject3dFactory(cardTextures: CardTextureResources): CardObject3dFactory {
  const frontTextureMap = new Map<CardAbbreviation, THREE.Texture>();
  Card.makeDeckOf().map(c => {
    const texture = cardTextures.getFront(c);
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    return {
      card: c,
      texture: cardTextures.getFront(c),
    }
  }).forEach(({ card, texture }) => {
    frontTextureMap.set(card.abbreviation, texture);
  });

  return (card: Card) => {
    const result = new THREE.Object3D();
    result.add(createCardFront(card));
    result.add(createCardBack());
    result.castShadow = true;
    result.receiveShadow = true;
    result.rotation.x = - Math.PI / 2;
    result.name = card.name;

    return new CardObject3d(result, card);
  };

  function createCardFront(card: Card): THREE.Mesh {
    const geometry = createCardGeometry();
    const material = new THREE.MeshPhongMaterial({
      alphaMap: cardTextures.frontSideAlpha,
      alphaTest: 0.9,
      map: getFrontTexture(card),
      side: THREE.FrontSide,
    });
    const frontMesh = new THREE.Mesh(geometry, material);
    frontMesh.castShadow = true;
    return frontMesh;

    function getFrontTexture(card: Card) {
      const texture = frontTextureMap.get(card.abbreviation);
      if (texture == null) {
        throw Error(`Failed to find card face texture for card: ${card.name}`);
      }
      return texture;
    }
  }

  function createCardBack(): THREE.Mesh {
    const geometry = createCardGeometry();
    const material = new THREE.MeshPhongMaterial({
      alphaMap: cardTextures.backSideAlpha,
      alphaTest: 0.5,
      map: cardTextures.backSide,
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    return mesh;
  }

  function createCardGeometry(): THREE.PlaneGeometry {
    // TODO: see if image dimensions can be extracted from Texture
    return new THREE.PlaneGeometry(1, CARD_HEIGHT / CARD_WIDTH);
  }
}
