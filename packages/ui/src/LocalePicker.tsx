'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLocale } from './i18n';
import type { Locale } from './i18n';

export function LocalePicker() {
  const { locale, setLocale, locales } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // Synchronize focusedIndex with active locale when opened
  useEffect(() => {
    if (isOpen) {
      const idx = locales.findIndex((l) => l.code === locale);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, locale, locales]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % locales.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + locales.length) % locales.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < locales.length) {
          selectLocale(locales[focusedIndex].code);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const selectLocale = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="locale-picker" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="locale-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label="选择界面语言 / Select language"
        title="选择界面语言 / Select language"
      >
        <Globe size={13} className="shrink-0 text-muted" aria-hidden="true" />
        <span className="locale-name-full">{currentLocale.name}</span>
        <span className="locale-name-short">{currentLocale.label}</span>
        <ChevronDown size={12} className="chevron shrink-0" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="界面语言选项"
          className="locale-dropdown"
        >
          {locales.map(({ code, name }, index) => {
            const isSelected = locale === code;
            const isFocused = focusedIndex === index;
            return (
              <li
                key={code}
                role="option"
                tabIndex={isFocused ? 0 : -1}
                aria-selected={isSelected}
                className={`locale-option ${isSelected ? 'active' : ''} ${isFocused ? 'focused' : ''}`}
                onClick={() => selectLocale(code)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <span className="locale-option-text">{name}</span>
                {isSelected && <Check size={13} className="check-icon" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
