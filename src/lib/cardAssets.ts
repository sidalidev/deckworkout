import type { PlayingCard, Rank, Suit } from './deck';

const SUIT_SLUG: Record<Suit, string> = {
  spades: 'spades',
  hearts: 'hearts',
  diamonds: 'diamonds',
  clubs: 'clubs',
};

const RANK_SLUG: Partial<Record<Rank, string>> = {
  A: 'ace',
  J: 'jack',
  Q: 'queen',
  K: 'king',
};

export function customFaceUrl(card: PlayingCard): string | null {
  const rankSlug = RANK_SLUG[card.rank];
  if (!rankSlug) return null;
  return `/cards/${rankSlug}-${SUIT_SLUG[card.suit]}.png`;
}

export const BACK_IMAGE_URL = '/cards/back.png';

export function allCustomCardUrls(): string[] {
  const urls: string[] = [BACK_IMAGE_URL];
  for (const suit of Object.values(SUIT_SLUG)) {
    for (const rank of Object.values(RANK_SLUG)) {
      urls.push(`/cards/${rank}-${suit}.png`);
    }
  }
  return urls;
}

export function preloadCustomCards(): void {
  for (const url of allCustomCardUrls()) {
    const img = new Image();
    img.src = url;
  }
}
