import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { buildDeck, shuffle, type PlayingCard } from './lib/deck';
import { DeckPile } from './components/DeckPile';
import { PlayingCardFace } from './components/PlayingCardFace';

type Phase = 'idle' | 'playing' | 'done';

const TOTAL_CARDS = 52;

function App() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [drawn, setDrawn] = useState<PlayingCard | null>(null);
  const [completed, setCompleted] = useState(0);

  const start = () => {
    setDeck(shuffle(buildDeck()));
    setDrawn(null);
    setCompleted(0);
    setPhase('playing');
  };

  const draw = () => {
    if (drawn || deck.length === 0) return;
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
      setPhase('done');
    }
  };

  const reset = () => {
    setPhase('idle');
    setDeck([]);
    setDrawn(null);
    setCompleted(0);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'idle' && <IdleScreen key="idle" onStart={start} />}
        {phase === 'playing' && (
          <PlayingScreen
            key="playing"
            deckCount={deck.length}
            completed={completed}
            drawn={drawn}
            onDraw={draw}
            onDone={markDone}
            onReset={reset}
          />
        )}
        {phase === 'done' && <DoneScreen key="done" onRestart={start} onHome={reset} />}
      </AnimatePresence>
    </div>
  );
}

function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1
          className="text-6xl md:text-8xl font-black gold-text tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Deck
        </h1>
        <h2
          className="text-3xl md:text-5xl font-bold gold-text -mt-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Workout
        </h2>
        <p className="mt-6 text-gold-300/70 max-w-xs mx-auto text-sm uppercase tracking-[0.3em]">
          Un paquet · 52 défis
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 text-gold-200/80 text-sm">
        <Legend glyph="♠" label="Pompes" />
        <Legend glyph="♥" label="Abdos" red />
        <Legend glyph="♦" label="Squats" red />
        <Legend glyph="♣" label="Burpees" />
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="holographic holographic-shimmer px-12 py-5 rounded-full text-xl font-bold uppercase tracking-[0.3em] card-shadow"
        style={{ color: '#3d2d04', fontFamily: 'var(--font-display)' }}
      >
        Démarrer
      </motion.button>
    </motion.div>
  );
}

function Legend({ glyph, label, red }: { glyph: string; label: string; red?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-2xl"
        style={{ color: red ? '#e57373' : '#f5cf4f' }}
      >
        {glyph}
      </span>
      <span className="uppercase tracking-[0.3em] text-xs">{label}</span>
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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full flex justify-between items-center px-2 max-w-md">
        <button
          type="button"
          onClick={onReset}
          className="text-gold-300/60 text-xs uppercase tracking-[0.2em] hover:text-gold-200"
        >
          Quitter
        </button>
        <div className="text-gold-200 text-sm uppercase tracking-[0.3em]">
          <span className="gold-text font-bold text-lg">{completed}</span>
          <span className="text-gold-700"> / {TOTAL_CARDS}</span>
        </div>
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
            <motion.div
              key={drawn.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="aspect-[5/7] h-[60vmin] max-h-[640px]"
                style={{ transformPerspective: 1200 }}
                initial={{ rotateY: 180, scale: 0.6, y: -30 }}
                animate={{ rotateY: 0, scale: 1, y: 0 }}
                exit={{ x: '120%', rotate: 25, opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              >
                <PlayingCardFace card={drawn} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md flex justify-center pb-2">
        <AnimatePresence mode="wait">
          {drawn ? (
            <motion.button
              key="done"
              type="button"
              onClick={onDone}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              whileTap={{ scale: 0.96 }}
              className="holographic holographic-shimmer px-14 py-4 rounded-full text-lg font-bold uppercase tracking-[0.3em] card-shadow"
              style={{ color: '#3d2d04', fontFamily: 'var(--font-display)' }}
            >
              Fait
            </motion.button>
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gold-400/60 text-xs uppercase tracking-[0.3em] py-5"
            >
              Touche le paquet pour tirer
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DoneScreen({ onRestart, onHome }: { onRestart: () => void; onHome: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-10 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <div className="text-7xl md:text-8xl">👑</div>
        <h1
          className="mt-4 text-5xl md:text-7xl font-black gold-text"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Terminé
        </h1>
        <p className="mt-4 text-gold-300/70 uppercase tracking-[0.3em] text-sm">
          52 cartes vaincues
        </p>
      </div>

      <div className="flex flex-col gap-4 items-center">
        <motion.button
          type="button"
          onClick={onRestart}
          whileTap={{ scale: 0.96 }}
          className="holographic holographic-shimmer px-12 py-4 rounded-full text-lg font-bold uppercase tracking-[0.3em] card-shadow"
          style={{ color: '#3d2d04', fontFamily: 'var(--font-display)' }}
        >
          Recommencer
        </motion.button>
        <button
          type="button"
          onClick={onHome}
          className="text-gold-400/60 text-xs uppercase tracking-[0.2em] hover:text-gold-200"
        >
          Accueil
        </button>
      </div>
    </motion.div>
  );
}

export default App;
