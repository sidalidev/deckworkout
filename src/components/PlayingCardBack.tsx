import { useState } from 'react';
import { BACK_IMAGE_URL } from '../lib/cardAssets';

const CARD_SHADOW =
  '0 0 0 2px #2b1d10, 0 6px 0 0 #2b1d10, 0 16px 36px -10px rgba(43, 29, 16, 0.35)';

export function PlayingCardBack() {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageFailed) {
    return (
      <div
        className="relative w-full h-full rounded-[5%] overflow-hidden"
        style={{ boxShadow: CARD_SHADOW, background: '#fdf6e3' }}
      >
        <img
          src={BACK_IMAGE_URL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageFailed(true)}
          draggable={false}
        />
      </div>
    );
  }

  return <CssBack />;
}

function CssBack() {
  return (
    <div
      className="relative w-full h-full rounded-[5%] overflow-hidden"
      style={{
        background: '#fdf6e3',
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="absolute inset-[5%] rounded-[4%]"
        style={{
          border: '2px solid #2b1d10',
          background:
            'repeating-linear-gradient(45deg, rgba(43, 29, 16, 0.05) 0 8px, transparent 8px 16px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-[28vmin] leading-none"
          style={{
            color: '#2b1d10',
            fontFamily: 'var(--font-display)',
          }}
        >
          ♛
        </div>
      </div>
      <div
        className="absolute top-[14%] left-1/2 -translate-x-1/2 uppercase tracking-[0.4em] text-[2.4vmin] font-black"
        style={{ color: '#4a3624' }}
      >
        Deck
      </div>
      <div
        className="absolute bottom-[14%] left-1/2 -translate-x-1/2 uppercase tracking-[0.4em] text-[2.4vmin] font-black"
        style={{ color: '#4a3624' }}
      >
        Workout
      </div>
    </div>
  );
}
