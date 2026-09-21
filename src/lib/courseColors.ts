import type { CourseKind } from '../data/types';

/** Farbzuordnung je Kursart – in Hell und Dunkel geprüft */
export const COURSE_COLORS: Record<CourseKind, { dot: string; chip: string; bar: string; text: string }> = {
  WOD: { dot: 'bg-brand', chip: 'bg-brand/12 border-brand/40', bar: 'bg-brand', text: 'text-brand' },
  'Partner-WOD': { dot: 'bg-danger', chip: 'bg-danger/12 border-danger/40', bar: 'bg-danger', text: 'text-danger' },
  Weightlifting: { dot: 'bg-violet-500', chip: 'bg-violet-500/12 border-violet-500/40', bar: 'bg-violet-500', text: 'text-violet-500' },
  Gymnastics: { dot: 'bg-teal-500', chip: 'bg-teal-500/12 border-teal-500/40', bar: 'bg-teal-500', text: 'text-teal-500' },
  Endurance: { dot: 'bg-emerald-500', chip: 'bg-emerald-500/12 border-emerald-500/40', bar: 'bg-emerald-500', text: 'text-emerald-500' },
  Mobility: { dot: 'bg-sky-500', chip: 'bg-sky-500/12 border-sky-500/40', bar: 'bg-sky-500', text: 'text-sky-500' },
  Teens: { dot: 'bg-amber-500', chip: 'bg-amber-500/12 border-amber-500/40', bar: 'bg-amber-500', text: 'text-amber-500' },
  Fundamentals: { dot: 'bg-info', chip: 'bg-info/12 border-info/40', bar: 'bg-info', text: 'text-info' },
  'Open Gym': { dot: 'bg-slate-400', chip: 'bg-slate-400/12 border-slate-400/40', bar: 'bg-slate-400', text: 'text-slate-400' },
};

export function courseColor(kind: CourseKind) {
  return COURSE_COLORS[kind] ?? COURSE_COLORS['Open Gym'];
}
