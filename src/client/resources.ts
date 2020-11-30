import { Object3D, Texture, TextureLoader, Mesh, MeshPhongMaterial } from 'three';
import { Suit } from '../card/suit';
import { objectPromiseAll } from '../util/object-promise-all';
import { Rank } from '../card';
import { Card, CardAbbreviation } from '../card/card';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

const IMAGE_DIR_PATH = 'images/';
const CARD_DIR_PATH = IMAGE_DIR_PATH + 'card/';

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

export async function loadResources(): Promise<Resources> {
  const resourcesPromiseObj = {
    table: loadTable(),
    grassTexture: loadTexture(IMAGE_DIR_PATH + 'grass.png'),
      
      cards: {
        backSideAlpha: loadTexture(CARD_DIR_PATH + 'backside_alpha.png'),
        backSide: loadTexture(CARD_DIR_PATH + 'backside.png'),
        frontSideAlpha: loadTexture(CARD_DIR_PATH + 'frontside_alpha.png'),
        getFront: loadCardFrontTextures(),
      },
  };

  return objectPromiseAll(resourcesPromiseObj);
}

function loadTable(): Promise<Object3D> {
  const loadModel: Promise<Object3D> = new Promise((resolve) => {
    new OBJLoader().load('models/lowtable.obj', (obj) => {
      resolve(obj);
    });
  });

  return new Promise((resolve) => {
    Promise.all([loadModel, loadTexture(IMAGE_DIR_PATH + 'wood.png')]).then((value) => {
      const object = value[0];
      const texture = value[1];
      applyTexture(object.children[0], texture);
      resolve(object);
    });
  });

  function applyTexture(obj: THREE.Object3D, texture: Texture) {
    obj.receiveShadow = true;
    if (obj instanceof Mesh) {
      (obj.material as MeshPhongMaterial).map = texture;
    }
    if (obj instanceof Object3D) {
      obj.children.forEach((c) => applyTexture(c, texture));
    }
  }
}

const loadCardFrontTextures = async () => {
  const cardFilepaths = Card.makeDeckOf().map(c => ({ cardAbbreviation: c.abbreviation, imagePath: getImagePathForCard(c) }));
  const texturePromises = cardFilepaths.map((cfp) => loadTexture(cfp.imagePath).then(texture => [cfp.cardAbbreviation, texture] as [CardAbbreviation, THREE.Texture]));
  const textures: Array<[CardAbbreviation, THREE.Texture]> = await Promise.all(texturePromises);
  const abbrevToTextureMap = new Map(textures);

  return (card: Card) => abbrevToTextureMap.get(card.abbreviation)!;
};

function getImagePathForCard(card: Card): string {
  return `${CARD_DIR_PATH}${card.rank.name}_of_${card.suit.name}.png`;
}

const textureLoader = new TextureLoader();
function loadTexture(path: string): Promise<Texture> {
  return new Promise((resolve) => {
    textureLoader.load(path, (texture) => resolve(texture));
  });
}
