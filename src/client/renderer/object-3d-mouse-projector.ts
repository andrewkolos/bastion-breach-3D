import { InheritableEventEmitter } from '@akolos/event-emitter';
import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
export interface Object3dMouseProjectorEvents<T extends THREE.Object3D> {
  objectsEntered: [objects: T[]];
  objectsLeft: [objects: T[]];
  objectsClicked: [objects: T[]];
}

export class Object3dMouseProjector<T extends THREE.Object3D = THREE.Object3D>
  extends InheritableEventEmitter<Object3dMouseProjectorEvents<T>> {

  private mousePos?: THREE.Vector2;
  private mouseDownedObjects: T[] = [];
  private clickedObjects: T[] = [];
  private currentlyHoveredObjects: T[] = [];

  public constructor(private readonly camera: THREE.Camera, private readonly objects: ReadonlyArray<T>) {
    super();
    window.addEventListener('mousemove', (e: MouseEvent) => {
      this.mousePos = new THREE.Vector2(e.clientX, e.clientY);
    });
    window.addEventListener('mousedown', () => this.mouseDownedObjects = this.getHoveredObjects());
    window.addEventListener('mouseup', () => {
      const mousedUpObjects = this.getHoveredObjects();
      this.clickedObjects = mousedUpObjects.filter(muo => this.mouseDownedObjects.includes(muo));
      this.mouseDownedObjects = [];
    });
  }

  public update() {
    const nextHoveredObjects = this.getHoveredObjects();
    const previouslyHoveredObjects = this.currentlyHoveredObjects;

    const objectsEntered = nextHoveredObjects.filter(nho => !previouslyHoveredObjects.includes(nho));
    if (objectsEntered.length > 0) {
      this.emit('objectsEntered', objectsEntered);
    }

    const objectsLeft = previouslyHoveredObjects.filter(pho => !nextHoveredObjects.includes(pho));
    if (objectsLeft.length > 0) {
      this.emit('objectsLeft', objectsLeft);
    }

    if (this.clickedObjects.length > 0) {
      this.emit('objectsClicked', this.clickedObjects);
      this.clickedObjects = [];
    }
    this.currentlyHoveredObjects = nextHoveredObjects;
  }

  public getHoveredObjects(): T[] {
    if (!this.mousePos) return [];  
    
    const normalized = new THREE.Vector2(
      (this.mousePos.x / window.innerWidth) * 2 - 1,
      -(this.mousePos.y / window.innerHeight) * 2 + 1,
    );

    raycaster.setFromCamera(normalized, this.camera);

    const intersections = raycaster.intersectObjects(this.objects as T[], true).reverse();
    return intersections.map(i => {
      const obj = i.object;
      if (this.objects.includes(obj as T)) return obj as unknown as  T;
      let parent = obj.parent;
      while (parent != null) {
        if (this.objects.includes(parent as T)) return obj.parent as unknown as T;
        parent = parent.parent;
      }
      throw Error();
    });
  }
}
