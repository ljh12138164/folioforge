'use client';

import { Globe } from 'lucide-react';
import { useLocale } from './i18n';
import type { Locale } from './i18n';

export function LocalePicker() {
  const { locale, setLocale, locales } = useLocale();

  return (
    <div className="locale-picker" role="group" aria-label="语言切换 / Language">
      <Globe size={13} className="shrink-0 text-muted" aria-hidden="true" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="选择界面语言"
        title="选择界面语言 / Select language"
      >
        {locales.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
