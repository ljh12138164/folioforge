'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Preference = 'light' | 'dark' | 'system';
declare global { interface Window { desktopTheme?: { setPreference: (value: Preference) => void } } }

const modes: { value: Preference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', Icon: Sun },
  { value: 'dark', label: '深色', Icon: Moon },
  { value: 'system', label: '系统', Icon: Monitor },
];

function applyTheme(value: Preference) {
  const root = document.documentElement;
  const resolved = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value;
  root.dataset.themePreference = value;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function ThemePicker() {
  const [preference, setPreference] = useState<Preference>('system');

  useEffect(() => {
    let initial: Preference = 'system';
    try {
      const saved = localStorage.getItem('pixelforge-theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') initial = saved;
    } catch { /* ignore storage errors */ }
    setPreference(initial);
    applyTheme(initial);
    window.desktopTheme?.setPreference(initial);

    const media = matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => {
      if ((document.documentElement.dataset.themePreference || 'system') === 'system') applyTheme('system');
    };
    media.addEventListener('change', followSystem);
    return () => media.removeEventListener('change', followSystem);
  }, []);

  function changeTheme(value: Preference) {
    setPreference(value);
    applyTheme(value);
    try { localStorage.setItem('pixelforge-theme', value); } catch { /* ignore storage errors */ }
    window.desktopTheme?.setPreference(value);
  }

  return (
    <div className="theme-picker" role="group" aria-label="外观主题">
      {modes.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          title={`${label}模式`}
          className={preference === value ? 'active' : ''}
          onClick={() => changeTheme(value)}
        >
          <Icon size={13} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
