import { useEffect, useRef } from 'react';

type UseMusicOptions = {
  src: string;
  playing: boolean;
  muted: boolean;
  volume?: number;
};

// Gapless looping background music via Web Audio API.
// AudioBufferSourceNode with loop=true is sample-accurate (unlike HTML5 audio.loop
// which has a ~5-15ms gap on Chrome/Safari). Adds linear fade in/out via GainNode.
export function useMusic({ src, playing, muted, volume = 0.3 }: UseMusicOptions) {
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadingRef = useRef<Promise<AudioBuffer | null> | null>(null);

  // One-time: AudioContext + GainNode + fetch & decode buffer
  useEffect(() => {
    type AnyWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as AnyWindow).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    ctxRef.current = ctx;
    gainRef.current = gain;

    loadingRef.current = (async () => {
      try {
        const res = await fetch(src);
        const ab = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(ab);
        bufferRef.current = buf;
        return buf;
      } catch {
        return null;
      }
    })();

    return () => {
      try { sourceRef.current?.stop(); } catch { /* already stopped */ }
      sourceRef.current = null;
      void ctx.close();
      ctxRef.current = null;
      bufferRef.current = null;
      gainRef.current = null;
    };
  }, [src]);

  // React to playing + muted + volume changes
  useEffect(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    let cancelled = false;
    let stopTimer: number | undefined;

    (async () => {
      const buf = bufferRef.current ?? (await loadingRef.current);
      if (cancelled || !buf) return;

      const shouldPlay = playing && !muted;

      if (shouldPlay) {
        if (ctx.state === 'suspended') {
          try { await ctx.resume(); } catch { /* user gesture not yet given */ }
          if (cancelled) return;
        }
        if (!sourceRef.current) {
          const node = ctx.createBufferSource();
          node.buffer = buf;
          node.loop = true;
          node.connect(gain);
          node.start(0);
          sourceRef.current = node;
        }
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.4);
      } else {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        stopTimer = window.setTimeout(() => {
          if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch { /* already stopped */ }
            sourceRef.current.disconnect();
            sourceRef.current = null;
          }
        }, 500);
      }
    })();

    return () => {
      cancelled = true;
      if (stopTimer !== undefined) clearTimeout(stopTimer);
    };
  }, [playing, muted, volume]);
}
