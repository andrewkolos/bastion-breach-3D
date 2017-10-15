import {ResourceManager} from "./resources";
import * as THREE from 'three';
import {OrbitControls} from "three-orbitcontrols-ts";
import "./physijs.js";
import {createTickWrapper} from "./util/tickwrapper";
import {Card, Deck, FACE, SUIT} from "./deck";
import {AxisHelper, Object3D} from "three";

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
        this.initLights();
        this.initCamera();
        this.initRenderer();
        this.createCards(SUIT.CLUBS, SUIT.DIAMONDS, SUIT.HEARTS);
        new OrbitControls(this.camera, this.renderer.domElement);
        this.scene.add(new AxisHelper(3));
    }

    start = () => {
        this.rendering = true;
        requestAnimationFrame(() => this.render());
    };

    render = () => {
        if (this.rendering) {
            console.log('rendering');
            requestAnimationFrame(() => this.render());
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
        let dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(0, 10, -15);
        dirLight.castShadow = true; // expensive
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 60;
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 16;
        dirLight.shadow.camera.bottom = -16;
        dirLight.shadow.mapSize.width = 1024 * 2;
        dirLight.shadow.mapSize.height = 1024 * 2;
        this.scene.add(dirLight);

        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 100, 0);
        this.scene.add(hemiLight);

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        this.scene.add(new THREE.DirectionalLightHelper(dirLight));
        this.scene.add(new THREE.CameraHelper(dirLight.shadow.camera));
    }

    private initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 15, -10);
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

        // MAKE SURE THIS WORKS
        /*const allDecks = {...this.playerHand, ...this.computerHand, ...this.neutralBoard};
        allDecks.map.forEach((value: THREE.Object3D, key: Card) => {
            this.scene.add(value);
        });*/
        Array.from(this.playerHand.map.values()).forEach(v=> this.scene.add(v));

        // make this manual later on
        this.dealCards(Array.from(this.playerHand.map.values()), new THREE.Vector3(0,0,0), new THREE.Euler(0,0,0));
    }

    private dealCards(cards: THREE.Object3D[], pos: THREE.Vector3, rotation: THREE.Euler) {
        let padding = 0.1;
        let start = -(cards.length + (cards.length * padding)) / 2;

        let currentPosition = start;
        cards.forEach(card => {
            card.position.set(pos.x + currentPosition, pos.y, pos.z);
            currentPosition += 1 + padding;
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
            .replace('five', '5').replace('six', '6').replace('seven','7').replace('eight','8').replace('nine','9').replace('ten','10');
    };

    let imageName = replaceStringWithNumber(FACE[card.face].toLowerCase()) + "_of_" + SUIT[card.suit].toLowerCase();
    let frontGeometry = new THREE.PlaneGeometry(500 / 500, 726 / 500);
    let backGeometry = frontGeometry.clone();
    let frontTexture = resources.cardTextures[imageName];

    console.log(resources.frontSideAlpha);

    let frontMaterial = new THREE.MeshPhongMaterial({alphaMap: resources.frontSideAlpha, alphaTest: 0.9, map: frontTexture, side:THREE.FrontSide});
    let backMaterial = new THREE.MeshPhongMaterial({alphaMap: resources.backSideAlpha, alphaTest: 0.9, map: resources.cardBackTexture, side:THREE.BackSide});

    let object = new THREE.Object3D();
    let frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
    object.add(frontMesh);
    object.add(new THREE.Mesh(backGeometry, backMaterial));

    return object;
}
