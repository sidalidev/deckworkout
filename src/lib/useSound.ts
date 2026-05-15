import { useCallback, useEffect, useRef, useState } from 'react';

const SOUNDS = ['draw', 'done', 'start', 'finish'] as const;
export type SoundName = (typeof SOUNDS)[number];

const STORAGE_KEY = 'deckworkout:muted:v1';

function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // storage unavailable, ignore
  }
}

export function useSound() {
  const audioMap = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const [muted, setMuted] = useState<boolean>(() => loadMuted());

  useEffect(() => {
    for (const name of SOUNDS) {
      const a = new Audio(`/sounds/${name}.mp3`);
      a.preload = 'auto';
      audioMap.current.set(name, a);
    }
    const map = audioMap.current;
    return () => {
      map.clear();
    };
  }, []);

  const play = useCallback(
    (name: SoundName, volume = 0.4) => {
      if (muted) return;
      const a = audioMap.current.get(name);
      if (!a) return;
      // Clone so overlapping plays don't interrupt each other
      const clone = a.cloneNode(true) as HTMLAudioElement;
      clone.volume = volume;
      void clone.play().catch(() => {
        // Most likely autoplay blocked before first user gesture — ignore
      });
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      saveMuted(next);
      return next;
    });
  }, []);

  return { play, muted, toggleMute };
}
