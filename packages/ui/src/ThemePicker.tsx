'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useLocale } from './i18n';
import type { Locale } from './i18n';

type Preference = 'light' | 'dark' | 'system';
declare global { interface Window { desktopTheme?: { setPreference: (value: Preference) => void } } }

const themeLabels: Record<Locale, { light: string; dark: string; system: string; label: string; modeSuffix: string }> = {
  'zh-CN': { light: '浅色', dark: '深色', system: '系统', label: '外观主题', modeSuffix: '模式' },
  'zh-TW': { light: '淺色', dark: '深色', system: '系統', label: '外觀主題', modeSuffix: '模式' },
  'en-US': { light: 'Light', dark: 'Dark', system: 'System', label: 'Appearance', modeSuffix: ' mode' },
  'ja-JP': { light: 'ライト', dark: 'ダーク', system: 'システム', label: '外観テーマ', modeSuffix: 'モード' },
  'ko-KR': { light: '라이트', dark: '다크', system: '시스템', label: '화면 테마', modeSuffix: ' 모드' },
  'es-ES': { light: 'Claro', dark: 'Oscuro', system: 'Sistema', label: 'Tema', modeSuffix: '' },
  'de-DE': { light: 'Hell', dark: 'Dunkel', system: 'System', label: 'Darstellung', modeSuffix: '' },
  'fr-FR': { light: 'Clair', dark: 'Sombre', system: 'Système', label: 'Apparence', modeSuffix: '' },
};

function applyTheme(value: Preference) {
  const root = document.documentElement;
  const resolved = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value;
  root.dataset.themePreference = value;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function ThemePicker() {
  const [preference, setPreference] = useState<Preference>('system');
  const { locale } = useLocale();
  const t = themeLabels[locale] || themeLabels['zh-CN'];

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

  const modes: { value: Preference; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: t.light, Icon: Sun },
    { value: 'dark', label: t.dark, Icon: Moon },
    { value: 'system', label: t.system, Icon: Monitor },
  ];

  return (
    <div className="theme-picker" role="group" aria-label={t.label}>
      {modes.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          title={`${label}${t.modeSuffix}`}
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
