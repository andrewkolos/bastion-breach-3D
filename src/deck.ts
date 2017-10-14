// Provides a card type as well as a collection for them that simply wraps an array of them

export enum SUIT {SPADES, CLUBS, HEARTS, DIAMONDS}

export enum FACE {ACE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NIN, TEN, JACK, QUEEN, KING}

export class Card {
    constructor(public suit: SUIT, public face: FACE) {
    }
}

export class Deck {
    cards: Array<Card>;

    constructor() {
        this.cards = new Array<Card>();

        for (let s in SUIT)
            for (let f in FACE)
                if (Number(s) && Number(f))
                    this.cards.push(new Card(parseInt(s), parseInt(f)));
    }

    shuffle() {
        let m = this.cards.length, t, i;

        while (m) {
            i = Math.floor(Math.random() * m--);

            t = this.cards[m];
            this.cards[m] = this.cards[i];
            this.cards[i] = t;
        }
    }
}