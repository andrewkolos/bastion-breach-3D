import { Game } from '../game';
import { AudioService as Audio } from './audio/audio-service';
import { SoundId } from './audio/sound-id';
import { Renderer } from './renderer/renderer';
import { SuitAssignments } from './renderer/suit-assignments';
import { loadResources } from './resources';
import { Ui } from './ui';
import { AudioService as audio } from './audio/audio-service';

export class Client {
  private acceptGameInputs = false;
  private readonly ui = Ui.init();

  private constructor(renderer: Renderer, private game: Game, suitAssignments: SuitAssignments) {
    renderer.on('cardHitTable', () => Audio.playSound(SoundId.CardFlip))
      .on('dealingCards', () => this.acceptGameInputs = false)
      .on('cardsDelt', () => this.acceptGameInputs = true)
      .on('cardEntered', card => {
        if (this.acceptGameInputs && card.suit === suitAssignments.player1 && game.cards.inHand.p1.includes(card.rank)) {
          document.body.style.cursor = 'pointer';
        }
      })
      .on('cardLeft', (_card, otherCardsBeingHovered) => {
        if (!otherCardsBeingHovered) {
          document.body.style.cursor = 'default';
        }
      })
      .on('cardClicked', clickedCard => {
        if (clickedCard.suit === suitAssignments.player1) {
          const p2CardsInHand = game.cards.inHand.p2;
          const randomP2Card = p2CardsInHand[Math.floor(Math.random() * p2CardsInHand.length)];
          this.game.advance({
            p1Card: clickedCard.rank,
            p2Card: randomP2Card,
          });
        }
      });

    this.ui.on('playButtonClicked', () => {
      this.acceptGameInputs = true;
    })
      .on('rulesButtonClicked', () => {
        this.acceptGameInputs = false;
      })
      .on('resetButtonClicked', () => {
        this.game = new Game();
        renderer.setGameToRender(game);
      })
      .on('volumeChanged', (value: number) => {
        audio.soundVolume = audio.musicVolume = value;
      });
    this.ui.enablePlaybutton();
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
