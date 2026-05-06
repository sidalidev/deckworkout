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

const CARD_SHADOW =
  '0 0 0 2px #2b1d10, 0 6px 0 0 #2b1d10, 0 16px 36px -10px rgba(43, 29, 16, 0.35)';

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
    <div
      className="relative w-full h-full rounded-[5%] overflow-hidden"
      style={{ boxShadow: CARD_SHADOW, background: '#fdf6e3' }}
    >
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
            'linear-gradient(to top, rgba(43, 29, 16, 0.95) 0%, rgba(43, 29, 16, 0.85) 55%, rgba(43, 29, 16, 0) 100%)',
        }}
      >
        {lore && (
          <>
            <div
              className="text-[6.5vmin] font-black leading-tight uppercase"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#fdf6e3',
                letterSpacing: '-0.01em',
              }}
            >
              {lore.name}
            </div>
            <div
              className="text-[2.6vmin] italic mt-[1%]"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#fde6a8',
              }}
            >
              {lore.tagline}
            </div>
            <div
              className="mx-auto my-[3%] h-[2px] w-[40%]"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(245, 200, 74, 0.6), transparent)',
              }}
            />
          </>
        )}
        <div className="flex items-baseline justify-center gap-[2%]">
          <span
            className="uppercase tracking-[0.18em] text-[2.8vmin] font-extrabold"
            style={{ color: '#f7ecd0' }}
          >
            {exercise}
          </span>
          <span
            className="text-[7vmin] font-black leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              color: '#f5c84a',
            }}
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
  const pipColor = isRed ? '#c34a2c' : '#2b1d10';

  return (
    <div
      className="relative w-full h-full rounded-[5%] overflow-hidden"
      style={{
        background: '#fdf6e3',
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="absolute inset-[4%] rounded-[4%] pointer-events-none"
        style={{ border: '2px solid #ddcfa6' }}
      />

      <Corner rank={card.rank} glyph={glyph} color={pipColor} position="tl" />
      <Corner rank={card.rank} glyph={glyph} color={pipColor} position="br" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center">
        <div
          className="text-[28vmin] leading-none"
          style={{
            color: pipColor,
            fontFamily: 'var(--font-display)',
          }}
        >
          {glyph}
        </div>
        <div
          className="mt-[4%] uppercase tracking-[0.18em] text-[3vmin] font-extrabold"
          style={{ color: '#4a3624' }}
        >
          {exercise}
        </div>
        <div
          className="mt-[1%] text-[10vmin] font-black leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            color: pipColor,
          }}
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
      <div className="text-[6vmin] font-black leading-none">{rank}</div>
      <div className="text-[5vmin] leading-none">{glyph}</div>
    </div>
  );
}
