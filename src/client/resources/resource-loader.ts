import { EventEmitter } from '@akolos/event-emitter';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Card, CardAbbreviation } from '../../card/card';
import { objectPromiseAll } from '../../util/object-promise-all';
import { Resources } from './resources';

export interface ResourceLoaderEvents {
  starting: [];
  completed: [];
  loadingFile: [url: string, itemsLoaded: number, totalItems: number];
}

const IMAGE_DIR_PATH = 'images/';
const CARD_DIR_PATH = IMAGE_DIR_PATH + 'card/';
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

export class ResourceLoader {
  private static readonly ee = new EventEmitter<ResourceLoaderEvents>();
  public static readonly on = ResourceLoader.ee.makeDelegate('on', ResourceLoader.ee.asProtected());
  public static readonly off = ResourceLoader.ee.makeDelegate('off', ResourceLoader.ee.asProtected());

  private static resources?: Promise<Resources>;

  public static load(): Promise<Resources> {
    if (this.resources) return this.resources;

    loadingManager.onProgress = (url, loaded, total) => {
      console.log('starting a load!', url, loaded, total);
      this.ee.emit('loadingFile', url, loaded, total);
    };
    loadingManager.onLoad = () => {
      console.log('loaded!');
      this.ee.emit('completed');
    };
    
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

    ResourceLoader.ee.emit('starting');
    this.resources = objectPromiseAll(resourcesPromiseObj);
    return this.resources;
  }

  private constructor() {}
}

function loadTable(): Promise<THREE.Object3D> {
  const loadModel: Promise<THREE.Object3D> = new Promise((resolve) => {
    new OBJLoader(loadingManager).load('models/lowtable.obj', (obj) => {
      resolve(obj);
    });
  });

  return new Promise((resolve) => {
    Promise.all([loadModel, loadTexture(IMAGE_DIR_PATH + 'wood.png')]).then((value) => {
      const object = value[0];
      const texture = value[1];
      texture.offset.set(0, 0);
      texture.repeat.set(24, 24);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      applyTexture(object.children[0], texture);
      object.receiveShadow = true;
      resolve(object);
    });
  });

  function applyTexture(obj: THREE.Object3D, texture: THREE.Texture) {
    obj.receiveShadow = true;
    if (obj instanceof THREE.Mesh) {
      (obj.material as THREE.MeshPhongMaterial).map = texture;
    }
    if (obj instanceof THREE.Object3D) {
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

function loadTexture(path: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    textureLoader.load(path, (texture) => resolve(texture));
  });
}
