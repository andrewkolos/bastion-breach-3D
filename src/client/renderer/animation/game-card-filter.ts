import { CardLike } from 'card/card-like';
import { GameCardCollection } from 'game/game-card-collection';
import { Rank } from 'card';

export function filterCardsByGameState<T extends CardLike>(cards: T[], gameCards: GameCardCollection<CardLike>): GameCardCollection<T> {
    return {
      inHand: {
        p1: filterMatchingCards(cards, gameCards.inHand.p1),
        p2: filterMatchingCards(cards, gameCards.inHand.p2),
      },
      onBoard: {
        p1: filterMatchingCards(cards, gameCards.onBoard.p1),
        p2: filterMatchingCards(cards, gameCards.onBoard.p2),
        neutral: filterMatchingCards(cards, gameCards.onBoard.neutral),
      }
    }
}

function filterMatchingCards<T extends CardLike>(cards: T[], toMatch: CardLike[]): T[] {
  return cards.filter(c => Rank.arrayFromCards(toMatch).includes(c.rank));
}