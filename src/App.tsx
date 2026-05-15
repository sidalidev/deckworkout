import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { buildDeck, shuffle, type PlayingCard } from './lib/deck';
import { DeckPile } from './components/DeckPile';
import { PlayingCardFace } from './components/PlayingCardFace';
import { clearState, loadState, saveState, type GamePhase } from './lib/persistence';
import { randomTip } from './lib/tips';
import { useSound } from './lib/useSound';
import { useMusic } from './lib/useMusic';

const TOTAL_CARDS = 52;

function App() {
  const [phase, setPhase] = useState<GamePhase>(() => loadState()?.phase ?? 'idle');
  const [deck, setDeck] = useState<PlayingCard[]>(() => loadState()?.deck ?? []);
  const [drawn, setDrawn] = useState<PlayingCard | null>(() => loadState()?.drawn ?? null);
  const [completed, setCompleted] = useState(() => loadState()?.completed ?? 0);
  const { play, muted, toggleMute } = useSound();
  useMusic({ src: '/sounds/beat.mp3', playing: phase === 'playing', muted, volume: 0.25 });

  useEffect(() => {
    saveState({ phase, deck, drawn, completed });
  }, [phase, deck, drawn, completed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.code !== 'Space' && e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      if (e.repeat) return;

      if (phase === 'idle') {
        start();
      } else if (phase === 'playing') {
        if (drawn) markDone();
        else if (deck.length > 0) draw();
      } else if (phase === 'done') {
        start();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, drawn, deck.length]);

  const start = () => {
    play('start');
    setDeck(shuffle(buildDeck()));
    setDrawn(null);
    setCompleted(0);
    setPhase('playing');
  };

  const draw = () => {
    if (drawn || deck.length === 0) return;
    play('draw');
    const [next, ...rest] = deck;
    setDrawn(next);
    setDeck(rest);
  };

  const markDone = () => {
    if (!drawn) return;
    const newCompleted = completed + 1;
    setDrawn(null);
    setCompleted(newCompleted);
    if (deck.length === 0) {
      play('finish');
      setPhase('done');
    } else {
      play('done');
    }
  };

  const reset = () => {
    setPhase('idle');
    setDeck([]);
    setDrawn(null);
    setCompleted(0);
    clearState();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-6 overflow-hidden">
      <MuteToggle muted={muted} onToggle={toggleMute} />
      {phase === 'idle' && <IdleScreen onStart={start} />}
      {phase === 'playing' && (
        <PlayingScreen
          deckCount={deck.length}
          completed={completed}
          drawn={drawn}
          onDraw={draw}
          onDone={markDone}
          onReset={reset}
        />
      )}
      {phase === 'done' && <DoneScreen onRestart={start} onHome={reset} />}
    </div>
  );
}

function IdleScreen({ onStart }: { onStart: () => void }) {
  const tip = useMemo(() => randomTip(), []);
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1
          className="text-6xl md:text-8xl font-black tracking-tight ink-text display"
          style={{ fontWeight: 900 }}
        >
          Deck
        </h1>
        <h2
          className="text-3xl md:text-5xl font-bold -mt-2 ink-text display"
        >
          Workout
        </h2>
        <p className="mt-5 text-ink-700 max-w-xs mx-auto text-sm font-bold uppercase tracking-[0.18em]">
          One deck · 52 challenges
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 text-ink-700 text-sm">
        <Legend glyph="♠" label="Push-ups" />
        <Legend glyph="♥" label="Sit-ups" red />
        <Legend glyph="♦" label="Squats" red />
        <Legend glyph="♣" label="Burpees" />
      </div>

      <TipCard tip={tip} />

      <CelButton onClick={onStart} variant="sea">
        Start
      </CelButton>
    </motion.div>
  );
}

function TipCard({ tip }: { tip: string }) {
  return (
    <div
      className="cel-shelf-sm rounded-xl px-4 py-3 max-w-xs text-left"
      style={{ background: '#f7ecd0' }}
    >
      <div
        className="text-[0.65rem] uppercase tracking-[0.22em] font-extrabold mb-1"
        style={{ color: '#9a5e15' }}
      >
        Did you know?
      </div>
      <p className="text-[0.875rem] leading-snug" style={{ color: '#4a3624' }}>
        {tip}
      </p>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="w-full h-2.5 rounded-full overflow-hidden"
      style={{ background: '#ddcfa6', border: '2px solid #2b1d10' }}
    >
      <motion.div
        className="h-full"
        style={{ background: '#2f7fa8' }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      />
    </div>
  );
}

function MuteToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      className="fixed bottom-3 left-3 z-50 cel-shelf-sm rounded-full w-10 h-10 flex items-center justify-center text-base"
      style={{ background: '#fdf6e3', color: '#2b1d10' }}
    >
      {muted ? '🔇' : '🔈'}
    </button>
  );
}

function Legend({ glyph, label, red }: { glyph: string; label: string; red?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-2xl leading-none"
        style={{ color: red ? '#c34a2c' : '#2b1d10' }}
      >
        {glyph}
      </span>
      <span className="uppercase tracking-[0.18em] text-xs font-bold text-ink-700">
        {label}
      </span>
    </div>
  );
}

type PlayingScreenProps = {
  deckCount: number;
  completed: number;
  drawn: PlayingCard | null;
  onDraw: () => void;
  onDone: () => void;
  onReset: () => void;
};

function PlayingScreen({
  deckCount,
  completed,
  drawn,
  onDraw,
  onDone,
  onReset,
}: PlayingScreenProps) {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-between py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md flex flex-col gap-2 px-2">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onReset}
            className="text-ink-500 text-xs uppercase tracking-[0.18em] font-bold hover:text-ink-900"
          >
            Quit
          </button>
          <div className="text-ink-700 text-sm uppercase tracking-[0.18em] font-bold">
            <span
              className="text-ink-900 font-black text-lg display mr-1"
              style={{ color: '#2f7fa8' }}
            >
              {completed}
            </span>
            <span className="text-ink-300">/ {TOTAL_CARDS}</span>
          </div>
        </div>
        <ProgressBar value={completed} max={TOTAL_CARDS} />
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center">
        <DeckPile
          remaining={deckCount}
          total={TOTAL_CARDS}
          onDraw={onDraw}
          disabled={!!drawn}
        />

        <AnimatePresence>
          {drawn && (
            <motion.button
              key={drawn.id}
              type="button"
              onClick={onDone}
              aria-label="Done — next card"
              className="absolute inset-0 m-auto aspect-[5/7] h-[60vmin] max-h-[640px] cursor-pointer focus:outline-none"
              style={{ transformPerspective: 1200 }}
              initial={{ rotateY: 180, scale: 0.6, y: -30, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, y: 0, opacity: 1 }}
              exit={{ x: '120%', rotate: 25, opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            >
              <PlayingCardFace card={drawn} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md flex justify-center pb-2">
        {drawn ? (
          <CelButton onClick={onDone} variant="sea" size="md">
            Done
          </CelButton>
        ) : (
          <div className="text-ink-500 text-xs uppercase tracking-[0.18em] font-bold py-5">
            Tap the deck or press space
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DoneScreen({ onRestart, onHome }: { onRestart: () => void; onHome: () => void }) {
  const tip = useMemo(() => randomTip(), []);
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div>
        <div className="text-7xl md:text-8xl leading-none" style={{ filter: 'drop-shadow(0 4px 0 #2b1d10)' }}>
          🏆
        </div>
        <h1
          className="mt-6 text-5xl md:text-7xl font-black ink-text display"
          style={{ fontWeight: 900 }}
        >
          Finished
        </h1>
        <p className="mt-3 text-ink-700 uppercase tracking-[0.18em] text-sm font-bold">
          52 cards crushed
        </p>
      </div>

      <TipCard tip={tip} />

      <div className="flex flex-col gap-4 items-center">
        <CelButton onClick={onRestart} variant="leaf">
          Play again
        </CelButton>
        <button
          type="button"
          onClick={onHome}
          className="text-ink-500 text-xs uppercase tracking-[0.18em] font-bold hover:text-ink-900"
        >
          Home
        </button>
      </div>
    </motion.div>
  );
}

type CelButtonVariant = 'sea' | 'leaf' | 'sun' | 'coral';
type CelButtonSize = 'md' | 'lg';

function CelButton({
  children,
  onClick,
  variant = 'sea',
  size = 'lg',
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: CelButtonVariant;
  size?: CelButtonSize;
}) {
  const palette: Record<CelButtonVariant, { bg: string; fg: string }> = {
    sea: { bg: '#2f7fa8', fg: '#fdf6e3' },
    leaf: { bg: '#4f8a35', fg: '#fdf6e3' },
    sun: { bg: '#f5c84a', fg: '#2b1d10' },
    coral: { bg: '#c34a2c', fg: '#fdf6e3' },
  };
  const v = palette[variant];
  const sizing = size === 'lg' ? 'px-12 py-4 text-lg rounded-2xl' : 'px-10 py-3 text-base rounded-xl';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cel-shelf cel-shelf-press ${sizing} font-extrabold uppercase tracking-[0.12em]`}
      style={{
        background: v.bg,
        color: v.fg,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </button>
  );
}

export default App;
