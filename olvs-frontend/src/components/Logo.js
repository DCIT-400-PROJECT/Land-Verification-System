import React from 'react';

// OLVS mark: a survey pin with a chain-link notch through the base,
// reading as "a verified, chained location" — not a generic badge.
export default function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#olvs-grad)" />
      <path
        d="M20 8c-4.4 0-8 3.5-8 7.9 0 5.9 8 15.1 8 15.1s8-9.2 8-15.1c0-4.4-3.6-7.9-8-7.9z"
        fill="#0A0C0F"
        fillOpacity="0.92"
      />
      <circle cx="20" cy="16" r="3.4" fill="none" stroke="#C9A84C" strokeWidth="1.6" />
      <path
        d="M15.5 22.5l3-2.1M24.5 22.5l-3-2.1"
        stroke="#C9A84C"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="olvs-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8A6F2E" />
          <stop offset="1" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
