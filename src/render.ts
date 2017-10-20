import {ResourceManager} from "./resources";
import * as THREE from 'three';
import "./physijs.js";
import {OrbitControls} from "three-orbitcontrols-ts"
import {Card, Deck, FACE, NUMERICAL, ROYALTY, SUIT} from "./deck";
import {AxisHelper, Intersection, Object3D} from "three";
import $ = require('jquery');
import {Sound} from "./sounds";
import {TweenGroup} from "./TweenGroup";

declare let TWEEN: any;


export class Stage {

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    resources: ResourceManager;
    rendering: boolean = false;
    mouseVector = new THREE.Vector3();
    raycaster = new THREE.Raycaster();
    selectedCard: THREE.Object3D;

    playerHand: PhysicalDeck;
    playerBoard: PhysicalDeck;
    neutralBoard: PhysicalDeck;
    computerHand: PhysicalDeck;
    computerBoard: PhysicalDeck;
    indicators = new Array<THREE.Object3D>();

    playerScore = 0;
    computerScore = 0;
    nextScore = 1;

    cardFlipSound = new Sound(new Audio('sound/cardflip.mp3'), 0.9, 10);
    drawCardSound = new Sound(new Audio('sound/drawcard.mp3'), 0.6, 10);
    musicSound = new Sound(new Audio('sound/quadproquo.mp3'), 0.3, 1);

    firstClickFlag = true;
    indicatorTimeouts = [];

    playing = false; // player can play cards

    constructor(resources: ResourceManager) {
        this.resources = resources;
        this.musicSound.addEventListener('timeupdate', () => {
            let buffer = .20;
            if (this.musicSound.currentTime > this.musicSound.duration - buffer) {
                this.musicSound.currentTime = 0;
                this.musicSound.play();
            }
        });
    }

    public resetGame() {
        let disposeDeck = (deck: PhysicalDeck) => {
            deck.objects().forEach((o) => {
                o.children.forEach((c) => {
                    if (c instanceof THREE.Mesh) {
                        let m = <any>c;
                        m.material.dispose();
                        m.geometry.dispose();
                    }
                    this.scene.remove(o);
                })
            });
            deck.clear();
        };

        disposeDeck(this.playerHand);
        disposeDeck(this.computerHand);
        disposeDeck(this.neutralBoard);
        disposeDeck(this.playerBoard);
        disposeDeck(this.computerBoard);

        this.indicators.forEach(i => this.scene.remove(i));

        this.playerScore = 0;
        this.computerScore = 0;
        this.nextScore = 1;

        this.firstClickFlag = true;
        this.indicatorTimeouts.forEach(t => clearTimeout(t));

        this.createCards(SUIT.SPADES, SUIT.DIAMONDS, SUIT.HEARTS);
    }

    init() {
        /* this.scene = new Physijs.Scene();
         this.scene.setGravity(new THREE.Vector3(0, -30, 0));*/
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xffffff, 0.1, 50);
        this.initLights();
        this.initCamera();
        this.initRenderer();
        this.createCards(SUIT.SPADES, SUIT.DIAMONDS, SUIT.HEARTS);
        //new OrbitControls(this.camera, this.renderer.domElement);
        /*this.scene.add(new AxisHelper(3));*/
        this.initTableObject();
        this.initGround();

        window.addEventListener('mousemove', this.mousemove, false);
        window.addEventListener('mouseup', this.mouseup, false);

    }

    private mousemove = (e) => {
        this.mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
        this.mouseVector.y = 2 * -(e.clientY / window.innerHeight) + 1;
    };


    private mouseup = (e) => {
        let determineWinner = (player: Card, computer: Card, neutral: Card) => {
            // handle someone having ace
            if (player.face === FACE.ACE) {
                if (NUMERICAL.indexOf(neutral.face) > -1) {
                    if (NUMERICAL.indexOf(computer.face) > -1) {
                        if (computer.face > neutral.face)
                            return computer;
                        else return neutral;
                    }
                    if (ROYALTY.indexOf(computer.face) > -1)
                        return neutral;
                }
                if (ROYALTY.indexOf(neutral.face) > -1) {
                    if (NUMERICAL.indexOf(computer.face) > -1)
                        return neutral;
                    if (ROYALTY.indexOf(computer.face) > -1)
                        return player;
                    return neutral;
                }
                if (computer.face == FACE.ACE)
                    return neutral;
            }

            if (computer.face === FACE.ACE) {
                if (NUMERICAL.indexOf(neutral.face) > -1) {
                    if (NUMERICAL.indexOf(player.face) > -1) {
                        if (player.face > neutral.face)
                            return player;
                        else return neutral;
                    }
                    if (ROYALTY.indexOf(player.face) > -1)
                        return neutral;
                }
                if (ROYALTY.indexOf(neutral.face) > -1) {
                    if (NUMERICAL.indexOf(player.face) > -1)
                        return neutral;
                    if (ROYALTY.indexOf(player.face) > -1)
                        return computer;
                    return neutral;
                }
                if (player.face == FACE.ACE)
                    return neutral;
            }

            if (neutral.face === FACE.ACE) {
                if (NUMERICAL.indexOf(player.face) > -1) {
                    if (NUMERICAL.indexOf(computer.face) > -1) {
                        if (player.face > computer.face)
                            return player;
                        else if (computer.face > player.face)
                            return computer;
                        return neutral;
                    }
                    if (ROYALTY.indexOf(computer.face) > -1) {
                        return neutral;
                    }
                }
                if (ROYALTY.indexOf(player.face) > -1) {
                    if (NUMERICAL.indexOf(computer.face) > -1)
                        return neutral;
                    if (ROYALTY.indexOf(computer.face) > -1)
                        return neutral;
                }

                if (player.face == FACE.ACE)
                    return neutral;
            }

            if (player.face > computer.face && player.face > neutral.face) {
                return player;
            }
            if (computer.face > player.face && computer.face > neutral.face) {
                return computer;
            }
            return neutral;
        };

        if (this.firstClickFlag) {
            this.firstClickFlag = false;
            return;
        }

        let playerObject = this.selectedCard;
        if (this.playing && playerObject) {

            this.drawCardSound.play();

            let neutralEntries = this.neutralBoard.objects();
            let currentNeutralObject = neutralEntries[this.playerBoard.size()];

            new TweenGroup(this.moveCard(playerObject, playerObject.position.clone().add(new THREE.Vector3(0, 0.7, -1)), playerObject.rotation, 200, 0), () => {
                new TweenGroup(this.moveCard(playerObject, currentNeutralObject.position.clone().add(new THREE.Vector3(0, 0, (726 / 500) + 0.02)), new THREE.Euler(Math.PI / 2, 0, 0), 600, 300), () => {
                    new TweenGroup(this.moveCard(playerObject, playerObject.position.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Euler(-Math.PI / 2), 200, 200), () => {
                        new TweenGroup(this.moveCard(playerObject, playerObject.position.clone().add(new THREE.Vector3(0, -1, 0)), playerObject.rotation, 100, 0), () => {
                        }).start();
                    }).start();
                }).start();
            }).start();

            let playerCard = this.playerHand.getCard(playerObject);
            this.playerHand.deleteByObject(playerObject);
            this.playerBoard.set(playerCard, playerObject);
            new TweenGroup(this.dealCards(Array.from(this.playerHand.objects()), new THREE.Vector3(0, 0.4, 3), new THREE.Vector3(-.2, .01, 0), new THREE.Euler(-Math.PI / 2.8, 0, 0), 300, 1)).start();

            ///

            let opponentObject = this.computerHand.objects()[Math.floor(Math.random() * this.computerHand.size())]; // get random opponent card

            new TweenGroup(this.moveCard(opponentObject, opponentObject.position.clone().add(new THREE.Vector3(0, 0.5, 0)), new THREE.Euler(Math.PI / 2, 0, 0), 200, 0), () => {
               new TweenGroup(this.moveCard(opponentObject, currentNeutralObject.position.clone().add(new THREE.Vector3(0, 0, -(726 / 500) - 0.02)), new THREE.Euler(Math.PI / 2, 0, 0), 600, 600), () => {
                   this.cardFlipSound.play();
                   new TweenGroup(this.moveCard(opponentObject, opponentObject.position.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Euler(-Math.PI / 2), 200, 200), () => {
                       new TweenGroup(this.moveCard(opponentObject, opponentObject.position.clone().add(new THREE.Vector3(0, -1, 0)), opponentObject.rotation, 200, 0), () => {

                       }).start();
                   }).start();
               }).start();
            }).start();
            let opponentCard = this.computerHand.getCard(opponentObject);
            this.computerHand.deleteByObject(opponentObject);
            this.computerBoard.set(opponentCard, opponentObject);
            new TweenGroup(this.dealCards(Array.from(this.computerHand.objects()), new THREE.Vector3(0, 0, -3), new THREE.Vector3(0.1, 0, 0), new THREE.Euler(Math.PI / 2, 0, 0), 1000, 1)).start();

            ///

            ///

            let currentNeutralCard = this.neutralBoard.getCard(currentNeutralObject);

            let winner = determineWinner(playerCard, opponentCard, currentNeutralCard);
            let placeIndicator = (object: THREE.Object3D, op: number) => {
                object.position.copy(currentNeutralObject.position.clone().add(new THREE.Vector3(0, 0.02, 0)));
                object.rotation.set(-Math.PI / 2, 0, 0);
                this.scene.add(object);
                let opacity = {value: 0};
                new TWEEN.Tween(opacity).to({value: op}, 700)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .onUpdate(function () {
                        if (object instanceof THREE.Mesh) { // circle
                            (<any>object).material.opacity = opacity.value;
                        }
                        object.children.forEach((c) => { // square or cross
                            (<any>c).material.opacity = opacity.value;
                        })
                    }).start();
            };
            if (winner === playerCard) {
                this.indicatorTimeouts.push(setTimeout(() => {
                    placeIndicator(this.createOObject(), 0.9);
                }, 1240));
                this.playerScore += this.nextScore;
                this.nextScore = 1;
            }
            else if (winner === opponentCard) {
                this.indicatorTimeouts.push(setTimeout(() => {
                    placeIndicator(this.createXObject(), 0.9);
                }, 1240));
                this.computerScore += this.nextScore;
                this.nextScore = 1;
            }
            else {
                this.indicatorTimeouts.push(setTimeout(() => {
                    placeIndicator(this.createSquareObject(), 0.75);
                }, 1240));
                this.nextScore += 1;
            }

            setTimeout(() => {
                $('#score').html('Player: ' + this.playerScore + ' &nbsp; Computer: ' + this.computerScore);
            }, 1240);

            if (this.playerHand.size() === 0) {
                let winnerString = "";
                if (this.computerScore > this.playerScore)
                    winnerString = "Computer wins.";
                else if (this.playerScore > this.computerScore)
                    winnerString = "Player wins!";
                else {
                    winnerString = "Draw!";
                }

                let messageElement = $('#message');
                let opacity = {value: 0};
                messageElement.html(winnerString + " " + this.playerScore + " – " + this.computerScore);
                setTimeout(() => {
                    new TWEEN.Tween(opacity).to({value: 0.9}, 500)
                        .easing(TWEEN.Easing.Cubic.Out)
                        .onUpdate( () => {
                            if (this.playerHand.size() === 0)
                                messageElement.css('opacity', opacity.value);
                        }).start()
                }, 1300);


            }
        }
    };

    start = () => {
        this.rendering = true;
        requestAnimationFrame(() => this.render());
        this.musicSound.play();
    };

    render = () => {
        if (this.rendering) {
            requestAnimationFrame(() => this.render());
            TWEEN.update();
            this.handleRaycasting();
            this.renderer.render(this.scene, this.camera);
        }
    };

    handleRaycasting = () => {
        let vector = new THREE.Vector3(this.mouseVector.x, this.mouseVector.y, 1);
        vector.unproject(this.camera);
        this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());

        let intersections = this.raycaster.intersectObjects(this.playerHand.objects(), true);

        this.selectedCard = null;

        if (intersections.length > 0) {
            let card = intersections[0].object.parent;
            this.selectedCard = card;
            $('body').css('cursor', 'pointer');
        } else {
            $('body').css('cursor', 'default');
        }
    };

    stop() {
        this.rendering = false;
    }

    private initLights() {
        let dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight1.position.set(-7, 30, 15);
        dirLight1.castShadow = true; // expensive
        dirLight1.shadow.camera.near = 10;
        dirLight1.shadow.camera.far = 50;
        dirLight1.shadow.camera.left = -9;
        dirLight1.shadow.camera.right = 9;
        dirLight1.shadow.camera.top = 6;
        dirLight1.shadow.camera.bottom = -6;
        dirLight1.shadow.mapSize.width = 1024;
        dirLight1.shadow.mapSize.height = 1024;
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
        dirLight2.shadow.mapSize.width = 1024;
        dirLight2.shadow.mapSize.height = 1024;
        this.scene.add(dirLight2);
        /*this.scene.add(new THREE.CameraHelper(dirLight2.shadow.camera));
        this.scene.add(new THREE.DirectionalLightHelper(dirLight2));*/

        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 10, 0);
        this.scene.add(hemiLight);

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        /*this.scene.add(new THREE.DirectionalLightHelper(dirLight1));

        this.scene.add(new THREE.CameraHelper(dirLight1.shadow.camera));*/

    }

    private initCamera() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 40);
        this.camera.position.set(0, 5.6, 4);
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
                (<THREE.MeshPhongMaterial>obj.material).map = this.resources.woodTexture;
            }
            if (obj instanceof THREE.Object3D)
                obj.children.forEach(c => applyTexture(c));
        };
        applyTexture(object.children[0]);
        object.scale.set(4, 1, 3.2);
        object.position.set(0, -1.65, 0);
        object.receiveShadow = true;
        object.name = 'table';
        this.scene.add(object);
    }

    private initGround() {
        let geometry = new THREE.PlaneGeometry(70, 70);
        let material = new THREE.MeshPhongMaterial({map: this.resources.grassTexture});
        let mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(-Math.PI / 2);
        mesh.position.set(0, -1.65, 0);
        mesh.receiveShadow = true;
        mesh.name = 'ground';

        this.scene.add(mesh);
    }

    private createCards(boardSuit: SUIT, playerSuit: SUIT, computerSuit: SUIT) {
        let buildHand = (suit: SUIT, shuffle?: boolean) => {
            let hand = new PhysicalDeck();
            let deck = new Deck();

            deck.cards = deck.cards.filter(c => c.suit === suit);
            deck.cards.forEach((c: Card) => {
                let object = createCardObject(this.resources, c);
                hand.set(c, object);
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

        Array.from(this.playerHand.objects()).forEach(v => this.scene.add(v));
        Array.from(this.neutralBoard.objects()).forEach(v => this.scene.add(v));
        Array.from(this.computerHand.objects()).forEach(v => this.scene.add(v));

        this.playing = false;
        new TweenGroup(this.dealCards(Array.from(this.playerHand.objects()), new THREE.Vector3(0, 0.4, 3), new THREE.Vector3(-.2, .01, 0), new THREE.Euler(-Math.PI / 2.8, 0, 0), 1000, 1000)).start();
        new TweenGroup(this.dealCards(Array.from(this.neutralBoard.objects()), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0, 0), new THREE.Euler(-Math.PI / 2, 0, 0), 1000, 1), () => {
            this.playing = true;
        }).start();
        new TweenGroup(this.dealCards(Array.from(this.computerHand.objects()), new THREE.Vector3(0, 0, -3), new THREE.Vector3(0.1, 0, 0), new THREE.Euler(Math.PI / 2, 0, 0), 1000, 1)).start();
    }

    private dealCards(cards: THREE.Object3D[], pos: THREE.Vector3, padding: THREE.Vector3, rot: THREE.Euler, posDuration: number, rotDuration: number) {

        let start = new THREE.Vector3(-(cards.length + (cards.length * padding.x)) / 2.0 + 0.6, pos.y, pos.z);

        let currentPosition = start;
        let tweens = [];
        cards.forEach(card => {
            let targetPosition = new THREE.Vector3(pos.x + currentPosition.x, currentPosition.y, currentPosition.z);
            tweens = tweens.concat(this.moveCard(card, targetPosition, rot, posDuration, rotDuration));
            currentPosition = currentPosition.add(new THREE.Vector3(1 + padding.x, padding.y, padding.z));
        });
        return tweens;
    }

    private moveCard(object: THREE.Object3D, pos: THREE.Vector3, rot: THREE.Euler, posDuration: number, rotDuration: number) {
        let position = {x: object.position.x, y: object.position.y, z: object.position.z};
        let targetPosition = {x: pos.x, y: pos.y, z: pos.z};

        let tween1 = new TWEEN.Tween(position).to(targetPosition, posDuration)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(function () {
                object.position.set(position.x, position.y, position.z);
            });
        let rotation = {x: object.rotation.x, y: object.rotation.y, z: object.rotation.y};
        let targetRotation = {x: rot.x, y: rot.y, z: rot.z};
        let tween2 = new TWEEN.Tween(rotation).to(targetRotation, rotDuration)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(function () {
                object.rotation.set(rotation.x, rotation.y, rotation.z);
            });
        return [tween1, tween2];
    }

    private createOObject(): THREE.Object3D {
        let geometry = new THREE.RingGeometry(0.25, 0.5, 32, 32);
        let material = new THREE.MeshPhongMaterial({
            color: 'green',
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.name = "O";
        mesh.lookAt(this.camera.position);
        this.indicators.push(mesh);
        return mesh;
    }

    private createXObject(): THREE.Object3D {
        let geometry = new THREE.PlaneGeometry(0.2, 1);
        let material = new THREE.MeshPhongMaterial({
            color: 'red',
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.set(0, 0, Math.PI / 4);
        let otherHalf = mesh.clone();
        otherHalf.rotation.set(0, 0, -Math.PI / 4);

        let obj = new THREE.Object3D();
        obj.add(mesh);
        obj.add(otherHalf);
        obj.name = "X";
        obj.lookAt(this.camera.position);
        this.indicators.push(obj);
        return obj;
    }

    private createSquareObject(): THREE.Object3D {
        let geometry = new THREE.PlaneGeometry(0.2, 0.6);
        let material = new THREE.MeshPhongMaterial({
            color: 'blue',
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        let left = new THREE.Mesh(geometry, material);
        left.position.set(-0.4, 0, 0);
        let top = left.clone();
        top.position.set(0, 0.4, 0);
        top.rotation.set(0, 0, Math.PI / 2);
        let right = left.clone();
        right.position.set(0.4, 0, 0);
        let bottom = left.clone();
        bottom.rotation.set(0, 0, Math.PI / 2);
        bottom.position.set(0, -0.4, 0);

        let cornerGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        let topLeft = new THREE.Mesh(cornerGeometry, material);
        topLeft.position.set(-0.4, 0.4, 0);
        let topRight = topLeft.clone();
        topRight.position.set(0.4, 0.4, 0);
        let bottomRight = topLeft.clone();
        bottomRight.position.set(0.4, -0.4, 0);
        let bottomLeft = topLeft.clone();
        bottomLeft.position.set(-0.4, -0.4, 0);


        let obj = new THREE.Object3D();
        obj.add(left);
        obj.add(bottom);
        obj.add(right);
        obj.add(top);
        obj.add(topLeft);
        obj.add(topRight);
        obj.add(bottomRight);
        obj.add(bottomLeft);
        obj.name = "square";
        obj.lookAt(this.camera.position);
        obj.scale.set(0.9, 0.9, 0.9);
        this.indicators.push(obj);

        return obj;
    }

    setVolume(volume: number) {
        this.cardFlipSound.setVolume(volume);
        this.drawCardSound.setVolume(volume);
        this.musicSound.setVolume(volume);
    }
}

class PhysicalDeck {

    private map: Map<Card, Object3D>;
    private imap: Map<Object3D, Card>;

    constructor() {
        this.map = new Map();
        this.imap = new Map();
    }

    addCard(card: Card, object: Object3D) {
        this.map.set(card, object);
        this.imap.set(object, card);
    }

    clear() {
        this.map.clear();
        this.imap.clear();
    }

    cards(): Card[] {
        return Array.from(this.map.keys());
    }

    objects(): Object3D[] {
        return Array.from(this.map.values());
    }

    size() {
        return this.map.size;
    }

    set (card: Card, object: Object3D) {
        this.map.set(card, object);
        this.imap.set(object, card);
    }

    hasByCard(card: Card) {
        return this.map.has(card);
    }

    hasByObject(object: Object3D) {
        return this.imap.has(object);
    }

    deleteByCard(card: Card) {
        let obj = this.map.get(card);
        this.map.delete(card);
        this.imap.delete(obj);
    }

    deleteByObject(object: Object3D) {
        let card = this.imap.get(object);
        this.imap.delete(object);
        this.map.delete(card);
    }

    getObject(card: Card): Object3D {
        return this.map.get(card);
    }

    getCard(object: Object3D): Card {
        return this.imap.get(object);
    }

    shuffle() {
        let newMap = new Map<Card, Object3D>();
        let newIMap = new Map<Object3D, Card>();
        let keys = <Card[]>[];
        this.map.forEach((value: THREE.Object3D, key: Card) => {
            keys.push(key);
        });
        this.shuffleArray(keys);
        keys.forEach(key => {
            newMap.set(key, this.map.get(key));
            newIMap.set(this.map.get(key), key);
        });
        this.map.clear();
        newMap.forEach((value: THREE.Object3D, key: Card) => {
            this.map.set(key, value);
        });
        this.imap.clear();
        newIMap.forEach((value: Card, key: THREE.Object3D) => {
            this.imap.set(key, value);
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

    object.name = imageName;
    object.add(frontMesh);
    object.add(backMesh);
    object.castShadow = true;
    object.receiveShadow = true;
    object.rotation.x = -Math.PI / 2;
    return object;
}
