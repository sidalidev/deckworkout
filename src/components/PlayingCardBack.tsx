import { useState } from 'react';
import { BACK_IMAGE_URL } from '../lib/cardAssets';

export function PlayingCardBack() {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageFailed) {
    return (
      <div className="relative w-full h-full rounded-[5%] overflow-hidden card-shadow">
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
    <div className="relative w-full h-full rounded-[5%] overflow-hidden card-shadow holographic holographic-shimmer">
      <div
        className="absolute inset-[3%] rounded-[4%] border-2"
        style={{
          borderColor: 'rgba(61, 45, 4, 0.7)',
          background:
            'repeating-linear-gradient(45deg, rgba(61, 45, 4, 0.08) 0 6px, transparent 6px 14px), repeating-linear-gradient(-45deg, rgba(61, 45, 4, 0.06) 0 6px, transparent 6px 14px)',
        }}
      />
      <div
        className="absolute inset-[8%] rounded-[3%] border"
        style={{ borderColor: 'rgba(61, 45, 4, 0.55)' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-[28vmin] leading-none"
          style={{
            color: 'rgba(61, 45, 4, 0.85)',
            fontFamily: 'var(--font-display)',
            textShadow: '0 2px 6px rgba(255, 215, 100, 0.4)',
          }}
        >
          ♛
        </div>
      </div>
      <div
        className="absolute top-[12%] left-1/2 -translate-x-1/2 uppercase tracking-[0.5em] text-[2.4vmin] font-bold"
        style={{ color: 'rgba(61, 45, 4, 0.8)' }}
      >
        Deck
      </div>
      <div
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2 uppercase tracking-[0.5em] text-[2.4vmin] font-bold"
        style={{ color: 'rgba(61, 45, 4, 0.8)' }}
      >
        Workout
      </div>
    </div>
  );
}
