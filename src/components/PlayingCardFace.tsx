import { useState } from 'react';
import {
  SUIT_EXERCISE,
  SUIT_GLYPH,
  SUIT_IS_RED,
  repsForRank,
  type PlayingCard,
} from '../lib/deck';
import { customFaceUrl } from '../lib/cardAssets';
import { loreFor } from '../lib/cardLore';

type Props = {
  card: PlayingCard;
};

export function PlayingCardFace({ card }: Props) {
  const customSrc = customFaceUrl(card);
  const [imageFailed, setImageFailed] = useState(false);

  if (customSrc && !imageFailed) {
    return <CustomImageFace card={card} src={customSrc} onError={() => setImageFailed(true)} />;
  }

  return <CssFace card={card} />;
}

function CustomImageFace({
  card,
  src,
  onError,
}: {
  card: PlayingCard;
  src: string;
  onError: () => void;
}) {
  const exercise = SUIT_EXERCISE[card.suit];
  const reps = repsForRank(card.rank);
  const lore = loreFor(card.rank, card.suit);

  return (
    <div className="relative w-full h-full rounded-[5%] overflow-hidden card-shadow">
      <img
        src={src}
        alt={`${card.rank} of ${card.suit}`}
        className="absolute inset-0 w-full h-full object-cover"
        onError={onError}
        draggable={false}
      />
      <div
        className="absolute bottom-0 inset-x-0 px-[5%] pt-[8%] pb-[5%] text-center"
        style={{
          background:
            'linear-gradient(to top, rgba(15, 10, 2, 0.95) 0%, rgba(15, 10, 2, 0.88) 55%, rgba(15, 10, 2, 0) 100%)',
        }}
      >
        {lore && (
          <>
            <div
              className="text-[6vmin] font-black leading-tight gold-text uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {lore.name}
            </div>
            <div
              className="text-[2.6vmin] italic text-gold-300/80 mt-[1%]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {lore.tagline}
            </div>
            <div
              className="mx-auto my-[3%] h-px w-[40%]"
              style={{ background: 'linear-gradient(to right, transparent, rgba(245, 207, 79, 0.5), transparent)' }}
            />
          </>
        )}
        <div className="flex items-baseline justify-center gap-[2%]">
          <span className="uppercase tracking-[0.3em] text-[2.8vmin] font-semibold text-gold-200">
            {exercise}
          </span>
          <span
            className="text-[7vmin] font-black leading-none gold-text"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ×{reps}
          </span>
        </div>
      </div>
    </div>
  );
}

function CssFace({ card }: { card: PlayingCard }) {
  const isRed = SUIT_IS_RED[card.suit];
  const glyph = SUIT_GLYPH[card.suit];
  const exercise = SUIT_EXERCISE[card.suit];
  const reps = repsForRank(card.rank);
  const pipColor = isRed ? '#c0392b' : '#1a1a1a';

  return (
    <div
      className="relative w-full h-full rounded-[5%] overflow-hidden card-shadow"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, #fffdf5 0%, #fbf3d8 40%, #f3e3a6 100%)',
      }}
    >
      <div
        className="absolute inset-[3%] rounded-[4%] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, transparent 0%, transparent 45%, rgba(245, 207, 79, 0.18) 50%, transparent 55%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-[2.5%] rounded-[4%] pointer-events-none border"
        style={{ borderColor: 'rgba(184, 134, 11, 0.55)' }}
      />

      <Corner rank={card.rank} glyph={glyph} color={pipColor} position="tl" />
      <Corner rank={card.rank} glyph={glyph} color={pipColor} position="br" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center">
        <div
          className="text-[28vmin] leading-none"
          style={{
            color: pipColor,
            textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {glyph}
        </div>
        <div
          className="mt-[4%] uppercase tracking-[0.3em] text-[3vmin] font-semibold"
          style={{ color: '#6b4f08' }}
        >
          {exercise}
        </div>
        <div
          className="mt-[1%] text-[10vmin] font-black leading-none gold-text"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ×{reps}
        </div>
      </div>
    </div>
  );
}

type CornerProps = {
  rank: string;
  glyph: string;
  color: string;
  position: 'tl' | 'br';
};

function Corner({ rank, glyph, color, position }: CornerProps) {
  const isTl = position === 'tl';
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        top: isTl ? '5%' : 'auto',
        left: isTl ? '6%' : 'auto',
        bottom: isTl ? 'auto' : '5%',
        right: isTl ? 'auto' : '6%',
        transform: isTl ? 'none' : 'rotate(180deg)',
        color,
        fontFamily: 'var(--font-display)',
      }}
    >
      <div className="text-[6vmin] font-bold leading-none">{rank}</div>
      <div className="text-[5vmin] leading-none">{glyph}</div>
    </div>
  );
}
