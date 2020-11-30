import { Suit } from './card/suit';
import { Client } from './client/client';
import { SuitAssignments } from './client/renderer/suit-assignments';
import 'regenerator-runtime/runtime';

const suitAssignments: SuitAssignments = {
  neutral: Suit.Spades,
  player1: Suit.Diamonds,
  player2: Suit.Hearts,
};

document.body.onload = () => {
  Client.start(suitAssignments);
};
