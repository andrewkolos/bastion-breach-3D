import * as Three from 'three';
import { CardTextureResources } from 'client/resources';
import { Card, CardAbbreviation } from 'card/card';
import { CardObject3d } from './card-object3d';

export const CARD_WIDTH = 500;
export const CARD_HEIGHT = 726;

export type CardObject3dFactory = (card: Card) => CardObject3d;

export function createCardObject3dFactory(cardTextures: CardTextureResources): CardObject3dFactory {
  const frontTextureMap = new Map<CardAbbreviation, Three.Texture>();
  Card.makeDeckOf().map(c => ({
    card: c,
    texture: cardTextures.getFront(c),
  })).forEach(({card, texture}) => {
    frontTextureMap.set(card.abbreviation, texture);
  });

  return (card: Card) => {
    const result = new Three.Object3D();
    result.add(createCardFront(card));
    result.add(createCardBack());
    result.castShadow = true;
    result.receiveShadow = true;
    result.rotation.x = - Math.PI / 2;

    return new CardObject3d(result, card);
  };

  function createCardFront(card: Card): Three.Mesh {
    const geometry = createCardGeometry();
    const material = new Three.MeshPhongMaterial({
      alphaMap: cardTextures.frontSideAlpha,
      alphaTest: 0.9,
      map: getFrontTexture(card),
      side: Three.FrontSide,
    });
    const frontMesh = new Three.Mesh(geometry, material);
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

  function createCardBack(): Three.Mesh {
    const geometry = createCardGeometry();
    const material = new Three.MeshPhongMaterial({
      alphaMap: cardTextures.backSideAlpha,
      alphaTest: 0.5,
      map: cardTextures.backSide,
      side: Three.BackSide,
    });

    const mesh = new Three.Mesh(geometry, material);
    mesh.castShadow = true;

    return mesh;
  }

  function createCardGeometry(): Three.PlaneGeometry {
    // TODO: see if image dimensions can be extracted from Texture
    return new Three.PlaneGeometry(1, CARD_HEIGHT / CARD_WIDTH);
  }
}
