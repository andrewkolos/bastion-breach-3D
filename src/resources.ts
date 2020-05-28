import THREE = require('three');

export class ResourceManager {

    private cardFilenames = ["images/card/10_of_diamonds.png", "images/card/10_of_hearts.png", "images/card/10_of_spades.png",
        "images/card/2_of_clubs.png", "images/card/2_of_diamonds.png", "images/card/2_of_hearts.png", "images/card/2_of_spades.png",
        "images/card/3_of_diamonds.png", "images/card/3_of_hearts.png", "images/card/3_of_spades.png", "images/card/4_of_diamonds.png",
        "images/card/4_of_hearts.png", "images/card/4_of_spades.png", "images/card/5_of_diamonds.png", "images/card/5_of_hearts.png",
        "images/card/5_of_spades.png", "images/card/6_of_diamonds.png", "images/card/6_of_hearts.png", "images/card/6_of_spades.png",
        "images/card/7_of_diamonds.png", "images/card/7_of_hearts.png", "images/card/7_of_spades.png", "images/card/8_of_diamonds.png",
        "images/card/8_of_hearts.png", "images/card/8_of_spades.png", "images/card/9_of_diamonds.png", "images/card/9_of_hearts.png",
        "images/card/9_of_spades.png", "images/card/ace_of_diamonds.png", "images/card/ace_of_hearts.png", "images/card/ace_of_spades.png",
        "images/card/backside.png", "images/card/backside_alpha.png", "images/card/frontside_alpha.png", "images/card/jack_of_diamonds.png",
        "images/card/jack_of_hearts.png", "images/card/jack_of_spades.png", "images/card/king_of_diamonds.png", "images/card/king_of_hearts.png",
        "images/card/king_of_spades.png", "images/card/queen_of_diamonds.png", "images/card/queen_of_hearts.png", "images/card/queen_of_spades.png"];

    private textureLoader: THREE.TextureLoader;
    loaded: boolean = false;

    cardTextures: Object;
    cardBackTexture: THREE.Texture;
    frontSideAlpha: THREE.Texture;
    backSideAlpha: THREE.Texture;
    woodTexture: THREE.Texture;
    grassTexture: THREE.Texture;
    table: THREE.Object3D;


    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.cardTextures = {};
    }

    loadResources = () => {
        return new Promise((resolve => {
            //console.log(ResourceManager.this.promisifyLoadingTexture(this.textureLoader,'images/board.png'));
            let promises = [this.cardBackPromise(),
                this.promisifyLoadingTexture(this.textureLoader, 'images/card/frontside_alpha.png'),
                this.promisifyLoadingTexture(this.textureLoader, 'images/card/backside_alpha.png'),
                this.promisifyLoadingTexture(this.textureLoader, 'images/wood.png'),
                this.promisifyLoadingTexture(this.textureLoader, 'images/grass.png'),
                this.tableModelPromise(), this.promisifyLoadingCardTexture()];
            Promise.all(promises).then((values: any[]) => {
                this.cardBackTexture = values[0];
                this.frontSideAlpha = values[1][1];
                this.backSideAlpha = values[2][1];
                this.woodTexture = values[3][1];
                this.woodTexture.offset.set(0, 0);
                this.woodTexture.repeat.set(24, 24);
                this.woodTexture.wrapS = this.woodTexture.wrapT = THREE.RepeatWrapping;
                this.grassTexture = values[4][1];
                this.grassTexture.offset.set(0, 0);
                this.grassTexture.repeat.set(24, 24);
                this.grassTexture.wrapS = this.grassTexture.wrapT = THREE.RepeatWrapping;
                this.table = values[5];
                this.cardTextures = values[6];
                this.loaded = true;

                resolve();
            })
        }));
    };

    cardBackPromise = () => {
        let loader = this.textureLoader;
        return new Promise<THREE.Texture>(resolve => {
            loader.load('images/card/backside.png', texture => {
                resolve(texture);
            })
        })
    };

    tableModelPromise = () => {
        return new Promise<THREE.Object3D>(resolve => {
            (new THREE.ObjectLoader()).load('models/lowtable.json', object => {
                resolve(object);
            });
        });
    };

    promisifyLoadingCardTexture = () => {
        return new Promise<Object>(resolve => {
            let mapping = {};
            let promises = this.cardFilenames.map(s => this.promisifyLoadingTexture(this.textureLoader, s));

            Promise.all(promises).then((values: any[]) => {
                values.forEach((value: [string, THREE.Texture]) => {
                    let regex = /[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g;
                    value[0] = regex.exec(value[0])[0];
                    mapping[value[0]] = value[1];
                });
                resolve(mapping);
            });
        });

    };

    promisifyLoadingTexture(loader, url: string) {
        return new Promise(resolve => {
            loader.load(url, texture => {
                resolve([url, texture]);
            });
        });
    }
}

