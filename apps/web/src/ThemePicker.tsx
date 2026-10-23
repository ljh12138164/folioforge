'use client';

import { useEffect, useState } from 'react';
import { SunMoon } from 'lucide-react';

type Preference = 'system' | 'light' | 'dark';
declare global { interface Window { desktopTheme?: { setPreference: (value: Preference) => void } } }

export function ThemePicker() {
  const [preference, setPreference] = useState<Preference>('system');

  useEffect(() => {
    const root = document.documentElement;
    setPreference((root.dataset.themePreference as Preference) || 'system');
    const media = matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => {
      if (root.dataset.themePreference === 'system') root.dataset.theme = media.matches ? 'dark' : 'light';
    };
    media.addEventListener('change', followSystem);
    return () => media.removeEventListener('change', followSystem);
  }, []);

  function changeTheme(value: Preference) {
    setPreference(value);
    document.documentElement.dataset.themePreference = value;
    document.documentElement.dataset.theme = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value;
    try { localStorage.setItem('pixelforge-theme', value); } catch { /* The current page still works when storage is unavailable. */ }
    window.desktopTheme?.setPreference(value);
  }

  return <label className="theme-picker"><SunMoon size={16} aria-hidden="true" /><select aria-label="外观主题" value={preference} onChange={(event) => changeTheme(event.target.value as Preference)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label>;
}
