import { Suit } from 'card/suit';
import { randomNaturalUpToInc } from 'random';

export interface SuitAssignments {
  player1: Suit;
  player2: Suit;
  neutral: Suit;
}

export namespace SuitAssignments {
  export function random() {
    const suits = pickRandomFrom(Suit.all(), 3);
    return {
      player1: suits[0],
      player2: suits[1],
      neutral: suits[2],
    };
  }

  export function validate(assignments: SuitAssignments) {
    return assignments.player1 !== assignments.player2 && assignments.player2 !== assignments.neutral
      && assignments.player1 !== assignments.player2;
  }
}

function pickRandomFrom<T>(arr: T[], n: number) {
  const shuffled = arr.slice(); // Copy.
  for (let i = arr.length - 1; i > 0; i--) { // Fisher-Yates shuffle.
    const toSwap = randomNaturalUpToInc(i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[toSwap];
    shuffled[toSwap] = temp;
  }
  return shuffled.slice(0, n);
}
