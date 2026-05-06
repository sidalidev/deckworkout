import type { Rank, Suit } from './deck';

export type CardLore = {
  name: string;
  tagline: string;
};

const RANK_NAME: Partial<Record<Rank, string>> = {
  A: 'Ace',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
};

const SUIT_NAME: Record<Suit, string> = {
  spades: 'Spades',
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
};

export function loreFor(rank: Rank, suit: Suit): CardLore | null {
  const rankName = RANK_NAME[rank];
  if (!rankName) return null;
  return {
    name: rankName.toUpperCase(),
    tagline: `of ${SUIT_NAME[suit]}`,
  };
}
