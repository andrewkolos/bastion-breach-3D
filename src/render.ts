import {ResourceManager} from "./resources";
import * as THREE from 'three';
import { OrbitControls } from "three-orbitcontrols-ts";
import "./physijs.js";

export class Stage {

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    resources: ResourceManager;

    constructor() {
        this.resources = new ResourceManager(); // get resources ready
    }

    init(): Promise<any> {
        return new Promise(resolve => {

            this.resources.loadResources().then(() => {
                /* this.scene = new Physijs.Scene();
                 this.scene.setGravity(new THREE.Vector3(0, -30, 0));*/
                this.scene = new THREE.Scene();
                this.initGameBoard();
                this.initLights();
                this.initCamera();
                this.initRenderer();
                new OrbitControls(this.camera, this.renderer.domElement);

                resolve();
            })
        });
    }

    start = () => {
        requestAnimationFrame(() => this.render());
    };

    render = () => {
        requestAnimationFrame(() => this.render());
        this.renderer.render(this.scene, this.camera);
    };

   /* start() {
        this.scene = new THREE.Scene();
        this.initGameBoard();
        this.initLights();
        this.initCamera();
        this.initRenderer();
        console.log(this.camera);
        new OrbitControls(this.camera, this.renderer.domElement);


        requestAnimationFrame(() => this.render());
    }*/



    private initGameBoard() {
        let boardTexture = this.resources.boardTexture;

        let boardGeometry = new THREE.PlaneGeometry(1792 * 0.01, 1350 * 0.01);
        let boardMaterial = new THREE.MeshPhongMaterial();
        boardMaterial.map = this.resources.boardTexture;
        boardMaterial.map.wrapS = boardMaterial.map.wrapT = THREE.RepeatWrapping;

        let boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
        boardMesh.rotation.x = - Math.PI / 2;
        boardMesh.position.set(-10, 0, 0);
        this.scene.add(boardMesh);

       /* let wireGeometry = new THREE.WireframeGeometry(new THREE.PlaneGeometry(100, 100, 1000, 1000));
        let wireMaterial = new THREE.MeshBasicMaterial({color: 'green'});
        let wire = new THREE.Mesh(wireGeometry, wireMaterial);
        wire.position.set(0, 0, -10);
        this.scene.add(wire);*/

        this.scene.add(new THREE.AxisHelper(5));
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
        this.camera.position.set(0, 15, 0);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
    }

    private initRenderer() {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setClearColor(0x000000, 1.0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;


        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight)
        });

        document.body.appendChild(this.renderer.domElement);
    }

}
