'use client';

import { useEffect, useState } from 'react';

export type Locale = 'zh-CN' | 'en-US' | 'zh-TW' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'de-DE' | 'fr-FR';

export interface LocaleInfo {
  code: Locale;
  label: string;
  name: string;
}

export const LOCALES: LocaleInfo[] = [
  { code: 'zh-CN', label: '简', name: '简体中文' },
  { code: 'en-US', label: 'EN', name: 'English' },
  { code: 'zh-TW', label: '繁', name: '繁體中文' },
  { code: 'ja-JP', label: 'JA', name: '日本語' },
  { code: 'ko-KR', label: 'KO', name: '한국어' },
  { code: 'es-ES', label: 'ES', name: 'Español' },
  { code: 'de-DE', label: 'DE', name: 'Deutsch' },
  { code: 'fr-FR', label: 'FR', name: 'Français' },
];

const STORAGE_KEY = 'pixelforge-locale';
const CHANGE_EVENT = 'pixelforge-locale-change';

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && LOCALES.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore storage errors */
  }
  return 'zh-CN';
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore storage errors */
  }
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: locale }));
}

export function useLocale(): { locale: Locale; setLocale: (loc: Locale) => void; locales: LocaleInfo[] } {
  const [locale, setLocaleState] = useState<Locale>('zh-CN');

  useEffect(() => {
    const current = getStoredLocale();
    setLocaleState(current);
    document.documentElement.lang = current;

    const onLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<Locale>;
      if (customEvent.detail && LOCALES.some((l) => l.code === customEvent.detail)) {
        setLocaleState(customEvent.detail);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        const next = event.newValue as Locale;
        if (LOCALES.some((l) => l.code === next)) {
          setLocaleState(next);
          document.documentElement.lang = next;
        }
      }
    };

    window.addEventListener(CHANGE_EVENT, onLocaleChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onLocaleChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const change = (next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  };

  return { locale, setLocale: change, locales: LOCALES };
}
