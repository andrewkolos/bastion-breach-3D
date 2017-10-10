import THREE = require('three');

export class ResourceManager {

    private textureLoader: THREE.TextureLoader;

    boardTexture: THREE.Texture;

    constructor() {

        this.textureLoader = new THREE.TextureLoader();

        this.textureLoader.load('images/board.png', (texture: THREE.Texture) => {
            this.boardTexture = texture;
        });
    }
}