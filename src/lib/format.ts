import type { Locale } from '../data/types';
import { localeTag } from '../i18n';
import { fromDateKey } from './clock';

export function formatCurrency(cents: number, locale: Locale = 'de'): string {
  return new Intl.NumberFormat(localeTag(locale), { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function formatDate(
  value: Date | string,
  locale: Locale = 'de',
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  const date = typeof value === 'string' ? (value.includes('T') ? new Date(value) : fromDateKey(value)) : value;
  return new Intl.DateTimeFormat(localeTag(locale), options).format(date);
}

export function formatDateLong(value: Date | string, locale: Locale = 'de'): string {
  return formatDate(value, locale, { weekday: 'short', day: '2-digit', month: 'short' });
}

export function formatTimeRange(startTime: string, durationMin: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const end = new Date(2000, 0, 1, h, m + durationMin);
  return `${startTime}–${`${end.getHours()}`.padStart(2, '0')}:${`${end.getMinutes()}`.padStart(2, '0')}`;
}

export function formatClock(value: Date, locale: Locale = 'de'): string {
  return new Intl.DateTimeFormat(localeTag(locale), { hour: '2-digit', minute: '2-digit' }).format(value);
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
}

export function initials(first: string, last?: string): string {
  return `${first.charAt(0)}${last?.charAt(0) ?? ''}`.toUpperCase();
}

export function relativeDayLabel(dateKey: string, referenceKey: string, locale: Locale = 'de'): string | null {
  const diff = (fromDateKey(dateKey).getTime() - fromDateKey(referenceKey).getTime()) / 86_400_000;
  if (diff === 0) return locale === 'de' ? 'Heute' : 'Today';
  if (diff === 1) return locale === 'de' ? 'Morgen' : 'Tomorrow';
  if (diff === -1) return locale === 'de' ? 'Gestern' : 'Yesterday';
  return null;
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
