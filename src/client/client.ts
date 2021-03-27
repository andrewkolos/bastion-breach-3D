import { Game } from '../game';
import { SoundId } from './audio/sound-id';
import { Renderer } from './renderer/renderer';
import { SuitAssignments } from './renderer/suit-assignments';
import { Ui } from './ui';
import { AudioService as audio } from './audio/audio-service';
import { CardLike } from 'card/card-like';
import { RendererLoader } from './renderer/renderer-loader';

export class Client {
  private acceptGameInputs = false;
  private readonly ui = Ui.init();
  private lastCardSoundTime = new Date().getTime();
  private rendererPromise: Promise<Renderer>;

  private constructor(private game: Game, private readonly suitAssignments: SuitAssignments) {
    this.rendererPromise = RendererLoader.load(this.game, suitAssignments);
    this.rendererPromise.then((renderer) => {
      this.setUpRenderer(renderer);
      this.enableUi(renderer);
    });

    RendererLoader.on('progressed', (progress, status) => {
      this.ui.updateLoadingStatus(progress, status);
    })
      .on('completed', () => {
        this.ui.updateLoadingStatus(1);
        this.ui.enablePlaybutton();
      });
  }

  public async getDomElement(): Promise<HTMLElement> {
    const renderer = await this.rendererPromise;
    return renderer.domElement;
  }

  private setUpRenderer(renderer: Renderer) {
    const suitAssignments = this.suitAssignments;

    renderer
      .on('dealingCards', () => this.acceptGameInputs = false)
      .on('cardsDelt', () => this.acceptGameInputs = true)
      .on('cardEntered', card => {
        if (this.acceptGameInputs && isCardInP1Hand(card, this.game)) {
          document.body.style.cursor = 'pointer';
        }
      })
      .on('cardLeft', (_card, otherCardsBeingHovered) => {
        if (!otherCardsBeingHovered.some(c => isCardInP1Hand(c, this.game))) {
          document.body.style.cursor = 'default';
        }
      })
      .on('cardClicked', clickedCard => {
        if (!this.ui.isRulesDialogShowing() && isCardInP1Hand(clickedCard, this.game)) {
          const p2CardsInHand = this.game.cards.inHand.p2;
          const randomP2Card = p2CardsInHand[Math.floor(Math.random() * p2CardsInHand.length)];
          this.game.advance({
            p1Card: clickedCard.rank,
            p2Card: randomP2Card,
          });
          audio.playSound(SoundId.CardPlay);
        }
      })
      .on('cardFlipping', () => this.playCardSound(SoundId.CardFlip))
      .on('cardHitTable', () => {
        const { game } = this;

        this.playCardSound(SoundId.CardHitTable);

        this.ui.updateScore(game.score.p1, game.score.p2);
        if (game.isComplete()) {
          this.ui.showResultsToast(game.score.p1, game.score.p2);
        }
      });

    renderer.start();

    function isCardInP1Hand(card: CardLike, game: Game) {
      return card.suit === suitAssignments.player1 && game.cards.inHand.p1.includes(card.rank);
    }
  }

  private enableUi(renderer: Renderer) {
    this.ui.on('playButtonClicked', () => {
      this.acceptGameInputs = true;
      if (!audio.isMusicPlaying) audio.playMusic();
    })
      .on('rulesButtonClicked', () => {
        this.acceptGameInputs = false;
      })
      .on('resetButtonClicked', () => {
        this.game = new Game();
        renderer.setGameToRender(this.game);
        this.ui.hideResultsToast();
        this.ui.updateScore(0, 0);
      })
      .on('volumeChanged', (value: number) => {
        audio.soundVolume = audio.musicVolume = value;
      });
  }

  private playCardSound(soundId: SoundId.CardFlip | SoundId.CardHitTable) {
    const now = new Date().getTime();

    if (now - this.lastCardSoundTime < 10) {
      audio.playSound(soundId);
    }

    this.lastCardSoundTime = now;
  }

  public static async start(suitAssignments: SuitAssignments): Promise<Client> {
    const game = new Game();
    const client = new Client(game, suitAssignments);
    const domElement = await client.getDomElement();
    document.body.appendChild(domElement);
    return client;
  }
}
