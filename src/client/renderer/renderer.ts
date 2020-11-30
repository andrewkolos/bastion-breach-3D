import { Handler, InheritableEventEmitter } from '@akolos/event-emitter';
import { Rank } from '../../card';
import { Card, CardAbbreviation } from '../../card/card';
import { Suit } from '../../card/suit';
import { CardAnimator } from '../../client/renderer/animation/card-animator';
import { Game, GameAdvancementOutcome, GameEvents, MatchupWinner } from '../../game';
import { Matchup } from '../../game/matchup';
import * as THREE from 'three';
import { CardTextureResources, Resources } from '../resources';
import { CardObject3d, MatchupOutcomeMarker } from './card-object3d/card-object3d';
import { createCardObject3dFactory } from './card-object3d/card-object3d-factory';
import { createScene } from './create-scene';
import { createThreeRenderer } from './create-three-renderer';
import { Object3dMouseProjector } from './object-3d-mouse-projector';
import { SuitAssignments } from './suit-assignments';
import { Animation } from './animation/animation';

export interface RendererEvents {
  dealingCards: [];
  cardsDelt: [];
  cardEntered: [card: Card];
  cardLeft: [card: Card, otherCardsBeingHovered: boolean];
  cardClicked: [card: Card];
  cardHitTable: [];
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

  private gameStateRendered: Matchup[] = [];

  private readonly cards = new Map<CardAbbreviation, CardObject3d>();
  private cardAnimator: CardAnimator = new CardAnimator();

  private unhandledGameAdvancements: GameAdvancement[] = [];

  private game: Game;
  private _gameAdvancedListener!: Handler<GameEvents, 'advanced'>;
  private suitAssignments: SuitAssignments;

  public constructor(resources: Resources, game: Game, suitAssignments: SuitAssignments) {

    super();

    this.game = game;
    this.suitAssignments = suitAssignments;

    this.scene = createScene(resources.table, resources.grassTexture);
    const cards = createCardObjects(resources.cards, suitAssignments);
    cards.forEach(c => {
      this.cards.set(new Card(c.rank, c.suit).abbreviation, c);
      this.scene.add(c);
    });

    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 40);
    // TODO: Calculate a good position to place camera instead of using magic numbers.
    this.camera.position.set(0, 5.6, 4);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.webGlRenderer = createThreeRenderer(this.camera);

    const cardMouseProjector = new Object3dMouseProjector(this.camera, [...this.cards.values()]);
    cardMouseProjector.on('objectsClicked', objects => {
      const cardClosestToCamera = objects[0];
      this.emit('cardClicked', new Card(cardClosestToCamera));
    });
    cardMouseProjector.on('objectsEntered', objects => {
      this.emit('cardEntered', new Card(objects[0]));
    });
    cardMouseProjector.off('objectsLeft', objects => {
      cardMouseProjector
      this.emit('cardLeft', new Card(objects[0]), cardMouseProjector.getHoveredObjects().length > 0);
    });

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
    if (this._gameAdvancedListener) {
      this.game.off('advanced', this._gameAdvancedListener);
    }

    this._gameAdvancedListener = (p1CardRank, p2CardRank, outcome) =>
      this.unhandledGameAdvancements.push({ p1CardRank, p2CardRank, outcome });

    game.on('advanced', this._gameAdvancedListener);
    this.game = game;

    this.dealCards();
  }

  public stop() {
    this._running = false;
  }

  private update() {
    if (!this.running) return;

    if (!isCaughtUpWithGame(this, this.game)) {
      this.catchUpWithGame();
      this.gameStateRendered = this.game.matchups;
    }

    requestAnimationFrame(() => this.update());

    function isCaughtUpWithGame(self: Renderer, game: Game): boolean {
      return self.gameStateRendered.length != game.matchups.length;
    }
  }

  private catchUpWithGame() {
    let playCardAnimation: Animation | undefined = undefined;

    for (let i = this.gameStateRendered.length; i < this.game.matchups.length; i++) {
      const matchup = this.game.matchups[i];
      const p1CardObj = this.getObjForCard(matchup.p1Card, this.suitAssignments.player1);
      const p2CardObj = this.getObjForCard(matchup.p2Card, this.suitAssignments.player2);
      const neutralCardObj = this.getObjForCard(matchup.neutralCard, this.suitAssignments.neutral);

      playCardAnimation = this.cardAnimator.playCard(p1CardObj, neutralCardObj.position.clone().add(new THREE.Vector3(0, 0, 726 / 500 + 0.02)));
      this.cardAnimator.playCard(p2CardObj, neutralCardObj.position.clone().sub(new THREE.Vector3(0, 0, 726 / 500 + 0.02)));

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
    }

    playCardAnimation?.on('complete', () => this.emit('cardHitTable'));

    this.animatePlayerHands();
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
      centerAt: new THREE.Vector3(0, 0.4, 3),
      spaceBetweenCardCenters: new THREE.Vector3(0.1, 0, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
    });
  }

  private dealCards() {
    this.animatePlayerHands();

    const neutralCards = this.game.cards.onBoard.neutral
      .map(r => this.getObjForCard(r, this.suitAssignments.neutral));
    this.cardAnimator.animateHand(neutralCards, {
      centerAt: new THREE.Vector3(0, 0, 0),
      spaceBetweenCardCenters: new THREE.Vector3(0.1, 0, 0),
      rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
    });
  }

  private getObjForCard(rank: Rank, suit: Suit): CardObject3d {
    const cardObj = this.cards.get(new Card(rank, suit).abbreviation);
    if (!cardObj) throw Error(`Card object is missing for ${new Card(rank, suit)}`);
    return cardObj;
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

