/**
 * Einziger Zugang zur "aktuellen" Zeit. Nirgends sonst im Code steht `new Date()`
 * ohne Argument – dadurch lässt sich die Demo-Zeit verschieben ("gleich startet
 * der 18:00-Kurs"), ohne dass irgendein Screen davon weiß.
 */

let offsetMinutes = 0;

export function setClockOffset(minutes: number): void {
  offsetMinutes = minutes;
}

export function getClockOffset(): number {
  return offsetMinutes;
}

export function now(): Date {
  return new Date(Date.now() + offsetMinutes * 60_000);
}

export function today(): Date {
  const d = now();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO-Datum YYYY-MM-DD ohne Zeitzonen-Verschiebung */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Kombiniert Datum (YYYY-MM-DD) und Uhrzeit (HH:mm) zu einem Date */
export function atTime(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** ISO-Wochentag: 1 = Montag … 7 = Sonntag */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/** Montag der Woche, in der das Datum liegt */
export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - (isoWeekday(copy) - 1));
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Kalenderwoche nach ISO 8601 */
export function isoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function minutesBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 60_000;
}
