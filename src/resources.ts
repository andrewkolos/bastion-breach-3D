import THREE = require('three');
import $ = require('jquery');

export class ResourceManager {

    private textureLoader: THREE.TextureLoader;
    loaded: boolean = false;

    boardTexture: THREE.Texture;
    cardTextures: Object;

    constructor() {
        this.textureLoader = new THREE.TextureLoader();
    }

    loadResources = () => {
        return new Promise((resolve => {
            //console.log(ResourceManager.promisifyLoadingTexture(this.textureLoader,'images/board.png'));
            let promises = [promisifyLoadingTexture(this.textureLoader, 'images/board.png'), this.cardPromise()];
            Promise.all(promises).then((values: any[]) => {
                this.boardTexture = values[0][1];
                //this.cardTextures = values[1];
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
                        promises.push(promisifyLoadingTexture(loader,dir + '/' + filename));
                    });
                    Promise.all(promises).then((values: any[]) => {
                        console.log(values);
                        values.forEach((value: [string, THREE.Texture]) => {
                            mapping[value[0]] = value[1];
                        });
                        this.cardTextures = mapping;
                        resolve(mapping);
                    });
                }
            });
        });
    };
}

function promisifyLoadingTexture(loader, url: string) {
    return new Promise(resolve => {
        loader.load(url, texture => {
            resolve([url, texture]);
        });
    });
}