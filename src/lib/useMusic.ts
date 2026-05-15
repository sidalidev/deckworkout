import { useEffect, useRef } from 'react';

type UseMusicOptions = {
  src: string;
  playing: boolean;
  muted: boolean;
  volume?: number;
};

export function useMusic({ src, playing, muted, volume = 0.3 }: UseMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(src);
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing && !muted) {
      a.volume = volume;
      void a.play().catch(() => {
        // Autoplay blocked until user gesture — will retry on next state change
      });
    } else {
      a.pause();
    }
  }, [playing, muted, volume]);
}
