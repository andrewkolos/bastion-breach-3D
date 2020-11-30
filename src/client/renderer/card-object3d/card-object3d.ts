import { Object3D } from 'three';
import { Rank } from 'card';
import { Suit } from 'card/suit';
import * as THREE from 'three';
import { Card } from 'card/card';

const MARKER_OPACITY = 0.5;

export enum MatchupOutcomeMarker {
  Win,
  Loss,
  Stalemate,
  None,
}

export class CardObject3d extends Object3D {
  public readonly rank: Rank;
  public readonly suit: Suit;
  private matchupOutcomeMarker?: Object3D;

  /**
   * @internal 
   */
  public constructor(baseObject3d: Object3D, card: Card) {
    super();
    this.copy(baseObject3d as any);
    this.rank = card.rank;
    this.suit = card.suit;
  }

  public setMatchupOutcomeMarker(matchupOutcome: MatchupOutcomeMarker) {
    this.clearMatchupOutcomeMarker();

    const marker = createMatchupMarker(matchupOutcome);
    marker.position.set(0, 0.02, 0);
    this.add(marker);
    this.matchupOutcomeMarker = marker;
  }

  public clearMatchupOutcomeMarker() {
    if (this.matchupOutcomeMarker == null) return;
    this.remove(this.matchupOutcomeMarker);
  }
}

export function isObject3dCardObject3d(object3d: Object3D): object3d is CardObject3d {
  return (object3d as CardObject3d).rank != null && (object3d as CardObject3d).suit != null;
}

function createMatchupMarker(matchupOutcome: MatchupOutcomeMarker) {
  switch (matchupOutcome) {
    case MatchupOutcomeMarker.Win:
      return createWinMarker();
    case MatchupOutcomeMarker.Loss:
      return createLossMarker();
    case MatchupOutcomeMarker.Stalemate:
      return createStalemateMarker();
    case MatchupOutcomeMarker.None:
      return new THREE.Object3D();
    default:
      throw Error(`Unhandled matchup outcome value: ${matchupOutcome}`);
  }
}

function createWinMarker(): THREE.Object3D {
  const geometry = new THREE.RingGeometry(0.25, 0.5, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color: 'green',
    transparent: true,
    opacity: MARKER_OPACITY,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  //mesh.lookAt(this.camera.position);
  return mesh;
}

function createStalemateMarker(): THREE.Object3D {
  const geometry = new THREE.PlaneGeometry(0.2, 0.6);
  const material = new THREE.MeshPhongMaterial({
    color: 'blue',
    transparent: true,
    opacity: MARKER_OPACITY,
    side: THREE.DoubleSide,
  });
  const left = new THREE.Mesh(geometry, material);
  left.position.set(-0.4, 0, 0);
  const top = left.clone();
  top.position.set(0, 0, 0.4);
  //top.rotation.set(0, 0, Math.PI / 2);
  const right = left.clone();
  right.position.set(0.4, 0, 0);
  const bottom = left.clone();
  //bottom.rotation.set(0, 0, Math.PI / 2);
  bottom.position.set(0, 0, -0.4);

  const cornerGeometry = new THREE.PlaneGeometry(0.2, 0.2);
  const topLeft = new THREE.Mesh(cornerGeometry, material);
  topLeft.position.set(-0.4, 0, 0.4);
  const topRight = topLeft.clone();
  topRight.position.set(0.4, 0, 0.4);
  const bottomRight = topLeft.clone();
  bottomRight.position.set(0.4, 0, -0.4);
  const bottomLeft = topLeft.clone();
  bottomLeft.position.set(-0.4, 0, -0.4);

  const obj = new THREE.Object3D();
  obj.add(left);
  obj.add(bottom);
  obj.add(right);
  obj.add(top);
  obj.add(topLeft);
  obj.add(topRight);
  obj.add(bottomRight);
  obj.add(bottomLeft);
  // obj.lookAt(this.camera.position);
  obj.scale.set(0.9, 0.9, 0.9);

  return obj;
}

function createLossMarker(): THREE.Object3D {
  const geometry = new THREE.PlaneGeometry(0.2, 1);
  const material = new THREE.MeshPhongMaterial({
    color: 'red',
    transparent: true,
    opacity: MARKER_OPACITY,
    side: THREE.DoubleSide,
  });
  const backslashMesh = new THREE.Mesh(geometry, material);
  backslashMesh.rotation.set(0, 0, Math.PI / 4);
  const forwardslashMesh = backslashMesh.clone();
  forwardslashMesh.rotation.set(0, 0, -Math.PI / 4);

  const obj = new THREE.Object3D();
  obj.add(backslashMesh);
  obj.add(forwardslashMesh);
  return obj;
}
