import { InheritableEventEmitter } from '@akolos/event-emitter';
import * as THREE from 'three';
import { Rank } from '../../card';
import { Card} from '../../card/card';
import { Suit } from '../../card/suit';
import { CardAnimator } from '../../client/renderer/animation/card-animator';
import { Game, MatchupWinner } from '../../game';
import { Matchup } from '../../game/matchup';
import { CardTextureResources, Resources } from '../resources';
import { CardObject3d, MatchupOutcomeMarker } from './card-object3d/card-object3d';
import { createCardObject3dFactory } from './card-object3d/card-object3d-factory';
import { createScene } from './create-scene';
import { createThreeRenderer } from './create-three-renderer';
import { Object3dMouseProjector } from './object-3d-mouse-projector';
import { SuitAssignments } from './suit-assignments';

export interface RendererEvents {
  dealingCards: [];
  cardsDelt: [];
  cardEntered: [card: Card];
  cardLeft: [left: Card, currentlyHovered: Card[]];
  cardClicked: [card: Card];
  cardFlipping: [];
  cardHitTable: [];
}

const CAMERA_FOV = 70;

export class Renderer extends InheritableEventEmitter<RendererEvents> {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly scene: THREE.Scene;
  private readonly webGlRenderer: THREE.WebGLRenderer;

  private gameStateRendered: Matchup[] = [];

  private readonly cards = {
    player1: [] as CardObject3d[],
    player2: [] as CardObject3d[],
    neutral: [] as CardObject3d[],
    all: [] as CardObject3d[],
  };

  private cardAnimator: CardAnimator = new CardAnimator();

  private game: Game;
  private readonly cardMouseProjector: Object3dMouseProjector<CardObject3d>;

  public constructor(resources: Resources, game: Game, private readonly suitAssignments: SuitAssignments) {
    super();

    this.game = game;

    this.scene = createScene(resources.table, resources.grassTexture);
    this.cards = createCardObjects(resources.cards, suitAssignments);
    this.cards.all.forEach(c => this.scene.add(c));

    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 40);
    // TODO: Calculate a good position to place camera instead of using magic numbers.
    this.camera.position.set(0, 5.6, 4);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.webGlRenderer = createThreeRenderer(this.camera);

    const cardMouseProjector = new Object3dMouseProjector(this.camera, this.cards.all);
    cardMouseProjector.on('objectsClicked', objects => {
      const cardClosestToCamera = objects[0];
      this.emit('cardClicked', new Card(cardClosestToCamera));
    });
    cardMouseProjector.on('objectsEntered', objects => {
      this.emit('cardEntered', new Card(objects[0]));
    });
    cardMouseProjector.on('objectsLeft', objects => {
      cardMouseProjector
      this.emit('cardLeft', new Card(objects[0]), cardMouseProjector.getHoveredObjects().map((cobj => new Card(cobj))));
    });
    this.cardMouseProjector = cardMouseProjector;

    this.cardAnimator
      .on('cardFlippedUp', () => this.emit('cardFlipping'))
      .on('cardHitTable', () => this.emit('cardHitTable'));

    this.setGameToRender(game);

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
    this.game = game;
    this.gameStateRendered = [];
    this.cards.all.forEach(c => c.clearMatchupOutcomeMarker());
    this.dealCards();
  }

  public stop() {
    this._running = false;
  }

  private update() {
    if (!this.running) return;

    if (!isCaughtUpWithGame(this, this.game)) {
      this.catchUpWithGame();
    }

    this.webGlRenderer.render(this.scene, this.camera);
    this.cardMouseProjector.update();

    requestAnimationFrame(() => this.update());

    function isCaughtUpWithGame(self: Renderer, game: Game): boolean {
      return self.gameStateRendered.length === game.matchups.length;
    }
  }

  private catchUpWithGame() {

    for (let i = this.gameStateRendered.length; i < this.game.matchups.length; i++) {
      const matchup = this.game.matchups[i];
      const p1CardObj = this.cards.player1.find(c => matchup.p1Card === c.rank)!;
      const p2CardObj = this.cards.player2.find(c => matchup.p2Card === c.rank)!;
      const neutralCardObj = this.cards.neutral.find(c => matchup.neutralCard === c.rank)!;

      this.cardAnimator.playCard(p1CardObj, neutralCardObj.position.clone().add(new THREE.Vector3(0, 0, 726 / 500 + 0.02)));
      this.cardAnimator.playCard(p2CardObj, neutralCardObj.position.clone().sub(new THREE.Vector3(0, 0, 726 / 500 + 0.02)))
        .on('completed', () => {
          switch (matchup.winner) {
            case MatchupWinner.P1:
              neutralCardObj.setMatchupOutcomeMarker(MatchupOutcomeMarker.Win);
              break;
            case MatchupWinner.P2:
              neutralCardObj.setMatchupOutcomeMarker(MatchupOutcomeMarker.Loss);
              break;
            case MatchupWinner.None:
              neutralCardObj.setMatchupOutcomeMarker(MatchupOutcomeMarker.Stalemate);
              break;
          }
        });
    }

    this.animatePlayerHands();
    this.gameStateRendered = this.game.matchups;
  }

  private animatePlayerHands() {
    const player1Hand = this.game.cards.inHand.p1
      .map(rank => this.getObjForCard(rank, this.suitAssignments.player1));
    const player2Hand = this.game.cards.inHand.p2
      .map(rank => this.getObjForCard(rank, this.suitAssignments.player2));

    this.cardAnimator.animateHand(player1Hand, {
      centerAt: new THREE.Vector3(0, 0.4, 3),
      spaceBetweenCardCenters: new THREE.Vector3(-0.2, 0.01, 0),
      rotation: new THREE.Euler(-Math.PI / 2.8, 0, 0),
    });
    this.cardAnimator.animateHand(player2Hand, {
      centerAt: new THREE.Vector3(0, 0, -3),
      spaceBetweenCardCenters: new THREE.Vector3(0.1, 0, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
    });
  }

  private dealCards() {
    const anim = this.cardAnimator.animateIntoDeck(this.cards.all, new THREE.Vector3(0, 2));

    anim.on('completed', () => {
      this.animatePlayerHands();

      const neutralCards = this.game.cards.onBoard.neutral
        .map(rank => this.getObjForCard(rank, this.suitAssignments.neutral));
      this.cardAnimator.animateHand(neutralCards, {
        centerAt: new THREE.Vector3(0, 0, 0),
        spaceBetweenCardCenters: new THREE.Vector3(0.1, 0, 0),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
      });
    })
  }

  private getObjForCard(rank: Rank, suit: Suit) {
    const card = this.cards.all.find(c => new Card(rank, suit).equals(c));
    if (!card) throw Error(`Card object is missing for ${new Card(rank, suit)}`);
    return card;
  }
}

function createCardObjects(cardTextures: CardTextureResources, suits: SuitAssignments) {
  const factory = createCardObject3dFactory(cardTextures);
  const ranks = Rank.all();

  const neutral = ranks.map(r => factory(new Card(r, suits.neutral)));
  const player1 = ranks.map(r => factory(new Card(r, suits.player1)));
  const player2 = ranks.map(r => factory(new Card(r, suits.player2)));

  return {
    player1,
    player2,
    neutral,
    all: [player1, player2, neutral].flat(),
  };
}

