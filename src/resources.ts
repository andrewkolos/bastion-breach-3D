import THREE = require('three');

export class ResourceManager {

    private textureLoader: THREE.TextureLoader;

    boardTexture: THREE.Texture;

    constructor() {
        this.textureLoader = new THREE.TextureLoader();
    }

    loadResources(): Promise<null> {
        return new Promise((resolve => {
            let promises = [this.loadBoardTexture()];
            Promise.all(promises).then((values: any[]) => {
                console.log(values);
                this.boardTexture = values[0];
                resolve();
            })
        }));
    }

    loadBoardTexture(): Promise<THREE.Texture> {
        return new Promise((resolve => {
            this.textureLoader.load('images/board.png', (texture: THREE.Texture) => {
                resolve(texture);
            });
        }));
    }
}