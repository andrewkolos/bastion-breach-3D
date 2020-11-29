import { Game } from 'game';
import { AudioService as Audio } from './audio/audio-service';
import { SoundId } from './audio/sound-id';
import { Renderer } from './renderer/renderer';
import { SuitAssignments } from './renderer/suit-assignments';
import { loadResources } from './resources';

export class Client {
  private acceptGameInputs = false;
  private gameIsReady = false;

  private constructor(private readonly renderer: Renderer, private readonly game: Game, private readonly suitAssignments: SuitAssignments) {
    renderer
      .on('cardHitTable', () => Audio.playSound(SoundId.CardFlip))
      .on('dealingCards', () => this.acceptGameInputs = false)
      .on('cardsDelt', () => this.acceptGameInputs = true)
      .on('cardEntered', () => document.body.style.cursor = 'pointer')
      .on('cardLeft', (_card, otherCardsBeingHovered) => {
        if (!otherCardsBeingHovered) document.body.style.cursor = 'default';
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
  }

  public static async start(suitAssignments: SuitAssignments): Promise<Client> {
    const game = new Game();
    const resources = await loadResources();
    const renderer = new Renderer(resources, game, suitAssignments);
    return new Client(renderer, game, suitAssignments);
  }

  public setVolume(value: number): void {
    Audio.
  }

}