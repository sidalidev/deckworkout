import { motion } from 'motion/react';
import { PlayingCardBack } from './PlayingCardBack';

type Props = {
  remaining: number;
  total: number;
  onDraw: () => void;
  disabled?: boolean;
};

export function DeckPile({ remaining, total, onDraw, disabled }: Props) {
  const visibleLayers = Math.min(8, Math.max(1, Math.ceil((remaining / total) * 8)));
  const layers = Array.from({ length: visibleLayers });

  return (
    <button
      type="button"
      onClick={onDraw}
      disabled={disabled || remaining === 0}
      className="relative aspect-[5/7] h-[60vmin] max-h-[640px] cursor-pointer disabled:cursor-default focus:outline-none"
      aria-label={`Tirer une carte (${remaining} restantes)`}
    >
      {layers.map((_, i) => {
        const offset = (visibleLayers - 1 - i) * 1.5;
        const isTop = i === visibleLayers - 1;
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              transform: `translate(${offset}px, ${-offset}px)`,
            }}
            whileHover={isTop && !disabled ? { y: -8, transition: { duration: 0.15 } } : undefined}
            whileTap={isTop && !disabled ? { scale: 0.97 } : undefined}
          >
            <PlayingCardBack />
          </motion.div>
        );
      })}
    </button>
  );
}
