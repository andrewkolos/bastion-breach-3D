import {ResourceManager} from "./resources";
import * as THREE from 'three';
import {OrbitControls} from "three-orbitcontrols-ts";
import "./physijs.js";
import {createTickWrapper} from "./util/tickwrapper";
import {Card, Deck, FACE, SUIT} from "./deck";
import {AxisHelper, Object3D} from "three";

declare let TWEEN: any;


export class Stage {

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    resources: ResourceManager;
    rendering: boolean = false;

    playerHand: PhysicalDeck;
    playerBoard: PhysicalDeck;
    neutralBoard: PhysicalDeck;
    computerHand: PhysicalDeck;
    computerBoard: PhysicalDeck;

    constructor(resources: ResourceManager) {
        this.resources = resources;
    }

    init() {
        /* this.scene = new Physijs.Scene();
         this.scene.setGravity(new THREE.Vector3(0, -30, 0));*/
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xffffff, 0.1, 50);
        this.initLights();
        this.initCamera();
        this.initRenderer();
        this.createCards(SUIT.CLUBS, SUIT.DIAMONDS, SUIT.HEARTS);
        new OrbitControls(this.camera, this.renderer.domElement);
        this.scene.add(new AxisHelper(3));


        this.initTableObject();


        this.initGround();
    }

    start = () => {
        this.rendering = true;
        requestAnimationFrame((time) => this.render(time));
    };

    render = (time) => {
        if (this.rendering) {
            requestAnimationFrame((time) => this.render(time));
            TWEEN.update(time);
            this.update();
            this.renderer.render(this.scene, this.camera);
        }
    };

    private update = createTickWrapper(60, () => {

    });

    stop() {
        this.rendering = false;
    }

    private initLights() {
        let dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight1.position.set(-7, 30, 15);
        dirLight1.castShadow = true; // expensive
        dirLight1.shadow.camera.near = 10;
        dirLight1.shadow.camera.far = 70;
        dirLight1.shadow.camera.left = -9;
        dirLight1.shadow.camera.right = 9;
        dirLight1.shadow.camera.top = 6;
        dirLight1.shadow.camera.bottom = -6;
        dirLight1.shadow.mapSize.width = 1024 * 2;
        dirLight1.shadow.mapSize.height = 1024 * 2;
        this.scene.add(dirLight1);

        let dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(7, 30, -15);
        dirLight2.castShadow = true; // expensive
        dirLight2.shadow.camera.near = 10;
        dirLight2.shadow.camera.far = 70;
        dirLight2.shadow.camera.left = -9;
        dirLight2.shadow.camera.right = 9;
        dirLight2.shadow.camera.top = 6;
        dirLight2.shadow.camera.bottom = -6;
        dirLight2.shadow.mapSize.width = 1024 * 2;
        dirLight2.shadow.mapSize.height = 1024 * 2;
        this.scene.add(dirLight2);
        this.scene.add(new THREE.CameraHelper(dirLight2.shadow.camera));
        this.scene.add(new THREE.DirectionalLightHelper(dirLight2));

        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 10, 0);
        this.scene.add(hemiLight);

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        this.scene.add(new THREE.DirectionalLightHelper(dirLight1));

        this.scene.add(new THREE.CameraHelper(dirLight1.shadow.camera));

    }

    private initCamera() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 5.5, 5);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    private initRenderer() {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setClearColor(0x111111, 1.0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;


        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight)
        });

        document.body.appendChild(this.renderer.domElement);
    }

    private initTableObject() {
        let object = this.resources.table;
        let applyTexture = (obj) => {
            obj.receiveShadow = true;
            if (obj instanceof THREE.Mesh) {
                console.log('jojjing');
                (<THREE.MeshPhongMaterial>obj.material).map = this.resources.woodTexture;
            }
            if (obj instanceof THREE.Object3D)
                obj.children.forEach(c => applyTexture(c));
        };
        console.log(this.resources.woodTexture);
        console.log(object);
        applyTexture(object.children[0]);
        object.scale.set(4, 1, 3.2);
        object.position.set(0, -1.65, 0);
        object.receiveShadow = true;
        this.scene.add(object);
    }

    private initGround() {
        let geometry = new THREE.PlaneGeometry(100, 100);
        let material = new THREE.MeshPhongMaterial({map: this.resources.grassTexture});
        let mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(-Math.PI/2);
        mesh.position.set(0, -1.65, 0);
        mesh.receiveShadow = true;

        this.scene.add(mesh);
    }

    private createCards(boardSuit: SUIT, playerSuit: SUIT, computerSuit: SUIT) {
        let buildHand = (suit: SUIT, shuffle?: boolean) => {
            let hand = new PhysicalDeck();
            let deck = new Deck();

            deck.cards = deck.cards.filter(c => c.suit === suit);
            deck.cards.forEach((c: Card) => {
                let object = createCardObject(this.resources, c);
                hand.map.set(c, object);
            });

            if (shuffle)
                hand.shuffle();

            return hand;
        };

        // create cards
        this.playerHand = buildHand(playerSuit);
        this.playerBoard = new PhysicalDeck();
        this.neutralBoard = buildHand(boardSuit, true);
        this.computerHand = buildHand(computerSuit);
        this.computerBoard = new PhysicalDeck();

        Array.from(this.playerHand.map.values()).forEach(v => this.scene.add(v));
        Array.from(this.neutralBoard.map.values()).forEach(v => this.scene.add(v));
        Array.from(this.computerHand.map.values()).forEach(v => this.scene.add(v));

        setTimeout(() => {// make this manual later on
            this.dealCards(Array.from(this.playerHand.map.values()), new THREE.Vector3(0, 0.4, 3), new THREE.Vector3(-.2, .01, 0), new THREE.Euler(-Math.PI / 3, 0, 0));
            this.dealCards(Array.from(this.neutralBoard.map.values()), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
            this.dealCards(Array.from(this.computerHand.map.values()), new THREE.Vector3(0, 0, -3), new THREE.Vector3(0.1, 0, 0), new THREE.Euler(Math.PI / 2, 0, 0));
        }, 1);

    }

    private dealCards(cards: THREE.Object3D[], pos: THREE.Vector3, padding: THREE.Vector3, rotation: THREE.Euler) {

        let start = new THREE.Vector3(-(cards.length + (cards.length * padding.x)) /2.0 + 0.6, pos.y, pos.z);

        let currentPosition = start;
        cards.forEach(card => {
            let position = {x: card.position.x, y: card.position.y, z: card.position.z};
            let target = {x: pos.x + currentPosition.x, y: currentPosition.y, z: currentPosition.z};
            let tween = new TWEEN.Tween(position).to(target, 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(function () {
                    card.position.set(position.x, position.y, position.z);
                }).start();
            card.rotation.set(rotation.x, rotation.y, rotation.z);
            currentPosition = currentPosition.add(new THREE.Vector3(1 + padding.x, padding.y, padding.z));
        });
    }
}

// really wanted to make this an extension of Map<Card, Object3D< but had to make it a wrapper
// see here https://github.com/Microsoft/TypeScript/issues/10853
class PhysicalDeck {

    public map: Map<Card, Object3D>;

    constructor() {
        this.map = new Map();
    }

    shuffle() {
        let newMap = new Map<Card, Object3D>();
        let keys = <Card[]>[];
        this.map.forEach((value: THREE.Object3D, key: Card) => {
            keys.push(key);
        });
        this.shuffleArray(keys);
        keys.forEach(key => {
            newMap.set(key, this.map.get(key));
        });
        this.map.clear();
        newMap.forEach((value: THREE.Object3D, key: Card) => {
            this.map.set(key, value);
        });
    }

    private shuffleArray(arr: Array<any>) {
        let collection = arr, len = arr.length, temp;

        while (len) {
            let random = Math.floor(Math.random() * len);
            len--;
            temp = collection[len];
            collection[len] = collection[random];
            collection[random] = temp;
        }

        return collection;
    }
}

function createCardObject(resources: ResourceManager, card: Card): THREE.Object3D {
    let replaceStringWithNumber = (str: string) => {
        // not exactly efficiently but nice and short
        return str.replace('one', '1').replace('two', '2').replace('three', '3').replace('four', '4')
            .replace('five', '5').replace('six', '6').replace('seven', '7').replace('eight', '8').replace('nine', '9').replace('ten', '10');
    };

    let imageName = replaceStringWithNumber(FACE[card.face].toLowerCase()) + "_of_" + SUIT[card.suit].toLowerCase();
    let frontGeometry = new THREE.PlaneGeometry(500 / 500, 726 / 500);
    let backGeometry = frontGeometry.clone();
    let frontTexture = resources.cardTextures[imageName];
    frontTexture.minFilter = THREE.LinearFilter;
    frontTexture.magFilter = THREE.LinearFilter;

    console.log(resources.frontSideAlpha);

    let frontMaterial = new THREE.MeshPhongMaterial({
        alphaMap: resources.frontSideAlpha,
        alphaTest: 0.9,
        map: frontTexture,
        side: THREE.FrontSide
    });
    let backMaterial = new THREE.MeshPhongMaterial({
        alphaMap: resources.backSideAlpha,
        alphaTest: 0.9,
        map: resources.cardBackTexture,
        side: THREE.BackSide
    });

    let object = new THREE.Object3D();
    let frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
    frontMesh.castShadow = true;
    let backMesh = new THREE.Mesh(backGeometry, backMaterial);
    backMesh.castShadow = true;
    object.add(frontMesh);
    object.add(backMesh);
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
}
