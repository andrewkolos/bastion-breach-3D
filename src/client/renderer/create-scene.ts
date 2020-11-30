import * as THREE from 'three';

export function createScene(tableModel: THREE.Object3D, grassTexture: THREE.Texture): THREE.Scene {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdddddd, 0.1, 50);
  createLights().forEach((light) => scene.add(light));
  scene.add(createTable(tableModel));
  scene.add(createGround(grassTexture));
  return scene;
}

function createLights(): THREE.Light[] {
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
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
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
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
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 10, 0);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  return [dirLight1, dirLight2, hemiLight, ambientLight];
}

function createTable(tableModel: THREE.Object3D) {
  tableModel.scale.set(4, 1, 3.2);
  tableModel.position.set(0, -1.65, 0);
  tableModel.receiveShadow = true;
  return tableModel;
}

function createGround(grassTexture: THREE.Texture) {
  grassTexture.offset.set(0, 0);
  grassTexture.repeat.set(24, 24);
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;

  const geometry = new THREE.PlaneGeometry(70, 70);
  const material = new THREE.MeshPhongMaterial({ map: grassTexture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateX(-Math.PI / 2);
  mesh.position.set(0, -1.65, 0);
  mesh.receiveShadow = true;
  return mesh;
}
