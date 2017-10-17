import THREE = require('three');
import $ = require('jquery');

export class ResourceManager {

    private textureLoader: THREE.TextureLoader;
    loaded: boolean = false;

    boardTexture: THREE.Texture;
    cardTextures: Object;
    cardBackTexture: THREE.Texture;
    frontSideAlpha: THREE.Texture;
    backSideAlpha: THREE.Texture;
    woodTexture: THREE.Texture;
    grassTexture: THREE.Texture;
    table: THREE.Object3D;

    constructor() {
        this.textureLoader = new THREE.TextureLoader();
    }

    loadResources = () => {
        return new Promise((resolve => {
            //console.log(ResourceManager.promisifyLoadingTexture(this.textureLoader,'images/board.png'));
            let promises = [promisifyLoadingTexture(this.textureLoader, 'images/board.png'), this.cardPromise(), this.cardBackPromise(),
                promisifyLoadingTexture(this.textureLoader, 'images/card/frontside_alpha.png'),
                promisifyLoadingTexture(this.textureLoader, 'images/card/backside_alpha.png'),
                promisifyLoadingTexture(this.textureLoader, 'images/wood.png'),
                promisifyLoadingTexture(this.textureLoader, 'images/grass.png'),
                this.tableModelPromise()];
            Promise.all(promises).then((values: any[]) => {
                this.boardTexture = values[0][1];
                this.cardTextures = values[1];
                this.cardBackTexture = values[2];
                this.frontSideAlpha = values[3][1];
                this.backSideAlpha = values[4][1];
                this.woodTexture = values[5][1];
                this.woodTexture.offset.set(0, 0);
                this.woodTexture.repeat.set(24, 24);
                this.woodTexture.wrapS = this.woodTexture.wrapT = THREE.RepeatWrapping;
                this.grassTexture = values[6][1];
                this.grassTexture.offset.set(0, 0);
                this.grassTexture.repeat.set(48, 48);
                this.grassTexture.wrapS = this.grassTexture.wrapT = THREE.RepeatWrapping;
                this.table = values[7];
                this.loaded = true;
                resolve();
            })
        }));
    };

    cardPromise = () => {
        let loader = this.textureLoader;
        return new Promise<Object>(resolve => {
            let mapping = {};
            let promises = new Array<Promise<any>>();
            let dir = '/images/card';
            $.ajax({
                url: dir,
                success: function (data) {
                    $(data).find("a:contains(.png)").each((index, element) => {
                        let filename = (<HTMLAnchorElement>element).href.replace(window.location.host, "").replace("http:///", "");
                        promises.push(promisifyLoadingTexture(loader, filename));
                    });
                    Promise.all(promises).then((values: any[]) => {
                        values.forEach((value: [string, THREE.Texture]) => {
                            let regex = /[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g;
                            value[0] = regex.exec(value[0])[0];
                            mapping[value[0]] = value[1];
                        });
                        resolve(mapping);
                    });
                }
            });
        });
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
    }
}

function promisifyLoadingTexture(loader, url: string) {
    return new Promise(resolve => {
        loader.load(url, texture => {
            resolve([url, texture]);
        });
    });
}