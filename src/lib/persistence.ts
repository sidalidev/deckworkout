import type { PlayingCard } from './deck';

const STORAGE_KEY = 'deckworkout:state:v1';
const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4h — covers long workouts with breaks

export type GamePhase = 'idle' | 'playing' | 'done';

export type PersistedState = {
  phase: GamePhase;
  deck: PlayingCard[];
  drawn: PlayingCard | null;
  completed: number;
  startedAt: number | null;
};

type StoredState = PersistedState & { savedAt: number };

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredState;
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (data.phase === 'idle') return null;
    return {
      phase: data.phase,
      deck: data.deck,
      drawn: data.drawn,
      completed: data.completed,
      startedAt: data.startedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  try {
    if (state.phase === 'idle') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const stored: StoredState = { ...state, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // storage unavailable, fail silently
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
