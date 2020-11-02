import { InheritableEventEmitter } from '@akolos/event-emitter';
import { Rank } from 'card';
import { Card } from 'card/card';
import { Suit } from 'card/suit';
import { CardAnimator } from 'client/renderer/animation/card-animator';
import { Game, GameAdvancementOutcome, GameEvents } from 'game';
import { Matchup } from 'game/matchup';
import * as THREE from 'three';
import { CardTextureResources, Resources } from '../resources';
import { CardObject3d } from './card-object3d/card-object3d';
import { createCardObject3dFactory } from './card-object3d/card-object3d-factory';
import { createScene } from './create-scene';
import { createThreeRenderer } from './create-three-renderer';
import { Object3dMouseEventEmitter } from './object-3d-mouse-event-emitter';
import { SuitAssignments } from './suit-assignments';

export interface RendererEvents {
  cardEnter: (card: Card) => void;
  cardLeave: (card: Card) => void;
  cardSelected: (card: Card) => void;
}

interface GameAdvancement {
  readonly p1CardRank: Rank;
  readonly p2CardRank: Rank; 
  readonly outcome: GameAdvancementOutcome;
}

const CAMERA_FOV = 70;

export class Renderer extends InheritableEventEmitter<RendererEvents> {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly scene: THREE.Scene;
  private readonly webGlRenderer: THREE.WebGLRenderer;
  private readonly cardMouseEventEmitter: Object3dMouseEventEmitter;

  private readonly gameStateRendered: Matchup[];
  
  private readonly cards: CardObject3d[];
  private cardAnimator: CardAnimator;

  private unhandledGameAdvancements: GameAdvancement[] = [];

  private _game?: Game;
  private _gameAdvancedListener?: (...params: Parameters<GameEvents['advanced']>) => void;

  public constructor(resources: Resources, private readonly suitAssignments: SuitAssignments) {

    super();

    this.cards = createCardObjects(resources.cards, suitAssignments);
    this.cardAnimator = new CardAnimator(this.cards);

    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 40);
    // TODO: Calculate a good position to place camera instead of using magic numbers.
    this.camera.position.set(0, 5.6, 4);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.webGlRenderer = createThreeRenderer(this.camera);

    this.cardMouseEventEmitter = new Object3dMouseEventEmitter(this.camera, this.cards);
    this.scene = createScene(resources.table, resources.grassTexture);
  }

  public get domElement(): HTMLCanvasElement {
    return this.webGlRenderer.domElement;
  }

  public get running() {
    return this._running;
  }

  private _running = false;

  public start() {
    this._running = true;
    requestAnimationFrame(() => this.update());
  }

  public setGameToRender(game: Game) {
    if (this._game) {
      if (!this._gameAdvancedListener) {
        throw Error('Game changed listener is missing.');
      }
      this._game.off('advanced', this._gameAdvancedListener);
    }

    this._gameAdvancedListener = (p1CardRank, p2CardRank, outcome) =>
      this.unhandledGameAdvancements.push({ p1CardRank, p2CardRank, outcome });
    game.on('advanced', this._gameAdvancedListener);
    
    this._game = game;
  }

  public stop() {
    this._running = false;
  }

  private update() {
    if (!this.running) return;

    if (this._game == null) {
      throw Error('Cannot render when no game has been given to render.');
    }

    if (!isCaughtUpWithGame(this, this._game)) {
      // Animate player hands
      // Animate played cards      
    }
    
    this.cardAnimator.updateInProgressAnimations();
    
    requestAnimationFrame(() => this.update());

    function isCaughtUpWithGame(self: Renderer, game: Game): boolean {
      return self.gameStateRendered.length != game.matchups.length;
    }
  }

}

function createCardObjects(cardTextures: CardTextureResources, suits: SuitAssignments): CardObject3d[] {
  const factory = createCardObject3dFactory(cardTextures);
  return [suits.neutral, suits.player1, suits.player2]
    .map((suit: Suit) => {
      return Rank.all().map((rank) => factory(new Card(rank, suit)));
    })
    .flat();
}

