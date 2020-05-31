export enum Rank {
  Ace = 0,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
}

export function isNumerical(value: Rank): boolean {
  return isValid(value) && !isFace(value) && value !== Rank.Ace;
}
export function isFace(value: Rank): boolean {
  return (isValid(value) && value === Rank.Jack) || value === Rank.Queen || value === Rank.King;
}
export function validate(value: Rank): void | never {
  if (!isValid(value)) {
    throw Error(`Received invalid value for card rank: ${value}`);
  }
}

export function isValid(value: Rank) {
  return Rank[value] != null;
}