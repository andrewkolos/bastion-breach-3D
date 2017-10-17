// Provides a card type as well as a collection for them that simply wraps an array of them

export enum SUIT {SPADES=0, CLUBS, HEARTS, DIAMONDS}

export enum FACE {ACE=0, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING}

export let NUMERICAL: Array<FACE> = [FACE.TWO, FACE.THREE, FACE.FOUR, FACE.FIVE, FACE.SIX, FACE.SEVEN, FACE.EIGHT, FACE.NINE, FACE.TEN];
export let ROYALTY: Array<FACE> = [FACE.JACK, FACE.QUEEN, FACE.KING];

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
                if (!isNaN(Number(s)) && !isNaN(Number(f)))
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