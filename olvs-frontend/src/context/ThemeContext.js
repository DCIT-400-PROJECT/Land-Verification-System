import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const themes = {
  dark: {
    '--gold':           '#C9A84C',
    '--gold-light':     '#E8C97A',
    '--gold-dim':       '#8A6F2E',
    '--dark':           '#0A0C0F',
    '--dark-2':         '#111318',
    '--dark-3':         '#181C22',
    '--dark-4':         '#1E232B',
    '--dark-5':         '#252B35',
    '--border':         'rgba(201,168,76,0.15)',
    '--border-hover':   'rgba(201,168,76,0.35)',
    '--text-primary':   '#F0EDE8',
    '--text-secondary': '#8B8F96',
    '--text-muted':     '#555A63',
    '--success':        '#2ECC71',
    '--danger':         '#E74C3C',
    '--warning':        '#F39C12',
    '--info':           '#3498DB',
    '--bg-body':        '#0A0C0F',
    '--nav-bg':         'rgba(10,12,15,0.95)',
  },
  light: {
    '--gold':           '#A07828',
    '--gold-light':     '#C9A84C',
    '--gold-dim':       '#7A5C1E',
    '--dark':           '#FFFFFF',
    '--dark-2':         '#F8F9FA',
    '--dark-3':         '#EEF0F3',
    '--dark-4':         '#E2E6EA',
    '--dark-5':         '#D0D5DD',
    '--border':         'rgba(0,0,0,0.1)',
    '--border-hover':   'rgba(160,120,40,0.4)',
    '--text-primary':   '#1A1D23',
    '--text-secondary': '#4A5568',
    '--text-muted':     '#8A92A0',
    '--success':        '#1E7E3E',
    '--danger':         '#C0392B',
    '--warning':        '#D68910',
    '--info':           '#1F618D',
    '--bg-body':        '#F0F2F5',
    '--nav-bg':         'rgba(255,255,255,0.95)',
  },
};

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const vars = themes[resolved];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
  root.setAttribute('data-theme', resolved);
  document.body.style.background = vars['--bg-body'];
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('olvs-theme') || 'dark');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('olvs-theme', theme);

    // Listen for system changes when in system mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
