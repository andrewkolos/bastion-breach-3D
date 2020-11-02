import { InheritableEventEmitter } from '@akolos/event-emitter';
import THREE from 'three';

export interface Object3dMouseEventEmitterEvents<T extends THREE.Object3D> {
  objectsEntered: (objects: T[]) => void;
  objectsLeft: (objects: T[]) => void;
  objectsClicked: (objects: T[]) => void;
}

export class Object3dMouseEventEmitter<T extends THREE.Object3D = THREE.Object3D>
  extends InheritableEventEmitter<Object3dMouseEventEmitterEvents<T>> {

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
  }

  private getHoveredObjects(): T[] {
    if (!this.mousePos) return [];

    const rayToHoveredObjects = new THREE.Vector3(this.mousePos.x, this.mousePos.y);
    rayToHoveredObjects.unproject(this.camera);

    const intersections = new THREE.Raycaster().intersectObjects(this.objects as T[]);
    return intersections.map(i => i.object as T);
  }
}
