import type { Rank, Suit } from './deck';

export type CardLore = {
  name: string;
  tagline: string;
};

const LORE: Partial<Record<`${Rank}-${Suit}`, CardLore>> = {
  // Spades — dark warriors, shadow heroes
  'A-spades': { name: 'Ashen Gate', tagline: 'Realm of the Fallen' },
  'J-spades': { name: 'Hector', tagline: 'The Twin Blades' },
  'Q-spades': { name: 'Penthesilea', tagline: 'Amazon Warlord' },
  'K-spades': { name: 'Achilles', tagline: 'The Bronze Warrior' },

  // Hearts — noble, warm, divine
  'A-hearts': { name: 'Eternal Flame', tagline: 'Heart of the Gods' },
  'J-hearts': { name: 'Orpheus', tagline: 'Bard of Olympus' },
  'Q-hearts': { name: 'Aphrodite', tagline: 'Goddess of Beauty' },
  'K-hearts': { name: 'Apollo', tagline: 'The Sun Champion' },

  // Diamonds — wealth, prestige, cunning
  'A-diamonds': { name: 'Golden Aegis', tagline: 'Treasure of the Realm' },
  'J-diamonds': { name: 'Hermes', tagline: 'The Swift Trickster' },
  'Q-diamonds': { name: 'Hera', tagline: 'Queen of Heaven' },
  'K-diamonds': { name: 'Midas', tagline: 'The Gilded King' },

  // Clubs — nature, druidic, wild
  'A-clubs': { name: 'Sacred Oak', tagline: 'Pulse of the Forest' },
  'J-clubs': { name: 'Atalanta', tagline: 'The Forest Hunter' },
  'Q-clubs': { name: 'Artemis', tagline: 'The Wild Huntress' },
  'K-clubs': { name: 'Pan', tagline: 'Lord of the Wild' },
};

export function loreFor(rank: Rank, suit: Suit): CardLore | null {
  return LORE[`${rank}-${suit}`] ?? null;
}
