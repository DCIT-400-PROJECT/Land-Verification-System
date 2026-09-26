import React from 'react';

// A simplified Ghana silhouette used as a watermark behind the hero.
// The border draws itself in once, then a beacon pulses at Accra's
// approximate position — the same "verification" motif used elsewhere,
// but now literally placed on the country the system serves.
export default function GhanaMap() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg
        viewBox="0 0 400 460"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute', left: '50%', top: '46%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, 90vw)', height: 'auto', opacity: 0.16,
        }}
      >
        {/* Simplified outline of Ghana */}
        <path
          d="M 118 18
             L 185 14 L 236 22 L 268 40 L 270 62
             L 300 78 L 318 96 L 322 118
             L 312 140 L 322 168 L 336 196
             L 330 224 L 340 252 L 336 284
             L 344 316 L 338 348 L 320 372
             L 300 396 L 268 414 L 236 424
             L 200 430 L 168 422 L 140 404
             L 116 380 L 98 352 L 86 320
             L 78 288 L 70 256 L 74 224
             L 64 196 L 58 164 L 66 132
             L 60 100 L 72 70 L 96 44
             L 118 18 Z"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          className="dash-draw-map"
        />
        {/* Beacon at approximate Accra position */}
        <circle cx="230" cy="392" r="4" fill="var(--gold)" className="ghana-beacon" />
        <circle cx="230" cy="392" r="4" fill="none" stroke="var(--gold)" strokeWidth="1.5" className="ghana-beacon-ring" />
      </svg>
    </div>
  );
}
