import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { detectBrowserLocale, resolveLocale, DEFAULT_LOCALE } from '@pixelforge/ui/i18n';

describe('i18n language detection and fallback', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    };
    vi.stubGlobal('localStorage', storageMock);
    vi.stubGlobal('window', { localStorage: storageMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('defaults baseline fallback to en-US', () => {
    expect(DEFAULT_LOCALE).toBe('en-US');
    expect(detectBrowserLocale([])).toBe('en-US');
    expect(detectBrowserLocale(['ru-RU', 'it-IT'])).toBe('en-US');
  });

  it('detects traditional Chinese for Taiwan, Hong Kong, and Macau', () => {
    expect(detectBrowserLocale(['zh-TW', 'en'])).toBe('zh-TW');
    expect(detectBrowserLocale(['zh-HK', 'en'])).toBe('zh-TW');
    expect(detectBrowserLocale(['zh-MO'])).toBe('zh-TW');
    expect(detectBrowserLocale(['zh-Hant-TW'])).toBe('zh-TW');
  });

  it('detects simplified Chinese for mainland and generic Chinese', () => {
    expect(detectBrowserLocale(['zh-CN', 'en'])).toBe('zh-CN');
    expect(detectBrowserLocale(['zh'])).toBe('zh-CN');
    expect(detectBrowserLocale(['zh-SG'])).toBe('zh-CN');
  });

  it('detects English variants as en-US', () => {
    expect(detectBrowserLocale(['en-US'])).toBe('en-US');
    expect(detectBrowserLocale(['en-GB'])).toBe('en-US');
    expect(detectBrowserLocale(['en'])).toBe('en-US');
  });

  it('detects other supported European and Asian languages', () => {
    expect(detectBrowserLocale(['ja-JP'])).toBe('ja-JP');
    expect(detectBrowserLocale(['ja'])).toBe('ja-JP');
    expect(detectBrowserLocale(['ko-KR'])).toBe('ko-KR');
    expect(detectBrowserLocale(['ko'])).toBe('ko-KR');
    expect(detectBrowserLocale(['es-ES'])).toBe('es-ES');
    expect(detectBrowserLocale(['es-MX'])).toBe('es-ES');
    expect(detectBrowserLocale(['de-DE'])).toBe('de-DE');
    expect(detectBrowserLocale(['fr-FR'])).toBe('fr-FR');
  });

  it('prioritizes the first matched language in preference list', () => {
    expect(detectBrowserLocale(['unknown-lang', 'ja-JP', 'en-US'])).toBe('ja-JP');
    expect(detectBrowserLocale(['de-DE', 'zh-CN'])).toBe('de-DE');
  });

  it('resolveLocale respects localStorage when available, otherwise falls back to browser detection', () => {
    // 1. Without localStorage, falls back to detected browser language
    vi.stubGlobal('navigator', { languages: ['fr-FR'] });
    expect(resolveLocale()).toBe('fr-FR');

    // 2. With valid localStorage, user manual preference takes precedence
    localStorage.setItem('pixelforge-locale', 'ja-JP');
    expect(resolveLocale()).toBe('ja-JP');

    // 3. Invalid localStorage value gets ignored and falls back to detection
    localStorage.setItem('pixelforge-locale', 'invalid-locale');
    expect(resolveLocale()).toBe('fr-FR');
  });
});
