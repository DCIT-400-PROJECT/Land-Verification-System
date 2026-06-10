import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const options = [
  { value: 'dark',   icon: '🌙', label: 'Dark' },
  { value: 'light',  icon: '☀️', label: 'Light' },
  { value: 'system', icon: '💻', label: 'System' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find(o => o.value === theme) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
          background: 'var(--dark-3)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'Sora, sans-serif',
          transition: 'all 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span>{current.icon}</span>
        <span style={{ display: 'none', ['@media(minWidth:600px)']: { display: 'inline' } }}>
          {current.label}
        </span>
        <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--dark-2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 6, minWidth: 140,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 999,
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: theme === opt.value ? 'var(--dark-4)' : 'transparent',
                color: theme === opt.value ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: theme === opt.value ? 600 : 400,
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseOver={e => { if (theme !== opt.value) e.currentTarget.style.background = 'var(--dark-3)'; }}
              onMouseOut={e => { if (theme !== opt.value) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{opt.icon}</span>
              <div>
                <div>{opt.label}</div>
                <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 400, marginTop: 1 }}>
                  {opt.value === 'dark'   && 'Always dark mode'}
                  {opt.value === 'light'  && 'Always light mode'}
                  {opt.value === 'system' && "Match your OS setting"}
                </div>
              </div>
              {theme === opt.value && (
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gold)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
