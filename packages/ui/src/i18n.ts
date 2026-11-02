'use client';

import { useEffect, useState } from 'react';

export type Locale = 'zh-CN' | 'en-US' | 'zh-TW' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'de-DE' | 'fr-FR';

export interface LocaleInfo {
  code: Locale;
  label: string;
  name: string;
}

export const DEFAULT_LOCALE: Locale = 'en-US';

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

/**
 * Detect the best matching supported locale from browser language preferences.
 * Falls back to DEFAULT_LOCALE ('en-US') when no match is found.
 */
export function detectBrowserLocale(languages?: readonly string[]): Locale {
  const list = languages ?? (typeof navigator !== 'undefined' ? (navigator.languages || [navigator.language]) : []);
  for (const raw of list) {
    if (!raw) continue;
    const l = raw.toLowerCase().trim();
    if (l.startsWith('zh-tw') || l.startsWith('zh-hk') || l.startsWith('zh-mo') || l.includes('hant')) return 'zh-TW';
    if (l.startsWith('zh')) return 'zh-CN';
    if (l.startsWith('en')) return 'en-US';
    if (l.startsWith('ja')) return 'ja-JP';
    if (l.startsWith('ko')) return 'ko-KR';
    if (l.startsWith('es')) return 'es-ES';
    if (l.startsWith('de')) return 'de-DE';
    if (l.startsWith('fr')) return 'fr-FR';
  }
  return DEFAULT_LOCALE;
}

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && LOCALES.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore storage errors */
  }
  return null;
}

export function resolveLocale(): Locale {
  const stored = getStoredLocale();
  if (stored) return stored;
  return detectBrowserLocale();
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
    const current = resolveLocale();
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
