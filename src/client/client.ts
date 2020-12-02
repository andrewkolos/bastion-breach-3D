import { Game } from '../game';
import { SoundId } from './audio/sound-id';
import { Renderer } from './renderer/renderer';
import { SuitAssignments } from './renderer/suit-assignments';
import { loadResources } from './resources';
import { Ui } from './ui';
import { AudioService as audio } from './audio/audio-service';
import { CardLike } from 'card/card-like';

export class Client {
  private acceptGameInputs = false;
  private readonly ui = Ui.init();
  private lastCardSoundTime = new Date().getTime();

  private constructor(private readonly renderer: Renderer, private game: Game, private readonly suitAssignments: SuitAssignments) {
    this.init();
  }

  private init() {
    const suitAssignments = this.suitAssignments;

    this.renderer
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

    this.ui.on('playButtonClicked', () => {
      this.acceptGameInputs = true;
      if (!audio.isMusicPlaying) audio.playMusic();
    })
      .on('rulesButtonClicked', () => {
        this.acceptGameInputs = false;
      })
      .on('resetButtonClicked', () => {
        this.game = new Game();
        this.renderer.setGameToRender(this.game);
        this.ui.hideResultsToast();
        this.ui.updateScore(0, 0);
      })
      .on('volumeChanged', (value: number) => {
        audio.soundVolume = audio.musicVolume = value;
      });
    this.ui.enablePlaybutton();

    function isCardInP1Hand(card: CardLike, game: Game) {
      return card.suit === suitAssignments.player1 && game.cards.inHand.p1.includes(card.rank);
    }
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
    const resources = await loadResources();
    const renderer = new Renderer(resources, game, suitAssignments);
    document.body.appendChild(renderer.domElement);
    renderer.start();
    return new Client(renderer, game, suitAssignments);
  }
}
