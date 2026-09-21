import { cn } from '../../lib/cn';
import { addDays, isSameDay, now, toDateKey } from '../../lib/clock';
import { useWeekdayNames } from '../../i18n';
import type { EnrichedSession } from './useSchedule';
import { groupByDay } from './useSchedule';

/** Datumsstreifen Mo–So für die mobile Tagesansicht */
export function DayStrip({
  weekStart,
  selected,
  onSelect,
  sessions,
}: {
  weekStart: Date;
  selected: string;
  onSelect: (dateKey: string) => void;
  sessions: EnrichedSession[];
}) {
  const weekdays = useWeekdayNames('short');
  const byDay = groupByDay(sessions);
  const current = now();

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {Array.from({ length: 7 }, (_, index) => {
        const day = addDays(weekStart, index);
        const key = toDateKey(day);
        const daySessions = byDay.get(key) ?? [];
        const isSelected = key === selected;
        const isToday = isSameDay(day, current);
        const hasFree = daySessions.some((s) => s.freeSpots > 0 && s.session.status !== 'abgesagt');
        const booked = daySessions.some((s) => s.myBooking?.status === 'gebucht');

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'flex min-w-[2.6rem] flex-1 flex-col items-center gap-0.5 rounded-xl border px-1 py-2 transition-colors',
              isSelected ? 'border-brand bg-brand/15' : 'border-line bg-surface hover:border-brand/50',
            )}
          >
            <span className={cn('text-[0.65rem] font-semibold uppercase', isSelected ? 'text-brand' : 'text-muted')}>
              {weekdays[index]}
            </span>
            <span className={cn('font-display text-lg leading-none', isToday && !isSelected && 'text-brand')}>
              {day.getDate()}
            </span>
            <span className="flex h-2 items-center gap-0.5">
              {daySessions.length === 0 ? (
                <span className="text-[0.6rem] text-muted">–</span>
              ) : (
                <>
                  <span className={cn('h-1.5 w-1.5 rounded-full', hasFree ? 'bg-success' : 'bg-danger')} />
                  {booked && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
