import { useCallback } from 'react';
import type { Locale } from '../data/types';
import { useDemoStore } from '../store';
import { de, type Dictionary } from './de';
import { en } from './en';

const dictionaries: Record<Locale, Dictionary> = { de, en };

type Params = Record<string, string | number>;

function resolve(dict: Dictionary, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, dict);
}

export function translate(locale: Locale, path: string, params?: Params): string {
  const value = resolve(dictionaries[locale], path) ?? resolve(dictionaries.de, path);
  if (typeof value !== 'string') return path;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function useT() {
  const locale = useDemoStore((s) => s.prefs.locale);
  const t = useCallback((path: string, params?: Params) => translate(locale, path, params), [locale]);
  return { t, locale };
}

export function useWeekdayNames(style: 'short' | 'long' = 'short'): string[] {
  const locale = useDemoStore((s) => s.prefs.locale);
  return [...dictionaries[locale].weekdays[style]];
}

export function localeTag(locale: Locale): string {
  return locale === 'de' ? 'de-DE' : 'en-GB';
}
