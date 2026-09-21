import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { courseColor } from '../../lib/courseColors';
import { addDays, isSameDay, now, toDateKey } from '../../lib/clock';
import { useWeekdayNames } from '../../i18n';
import type { EnrichedSession } from './useSchedule';
import { groupByDay } from './useSchedule';

const PX_PER_MINUTE = 1.15;
const DEFAULT_RANGE = { startHour: 6, endHour: 22 };

interface LaneSession extends EnrichedSession {
  lane: number;
  laneCount: number;
}

/** Überlappende Kurse nebeneinander verteilen (Spalten innerhalb eines Tages) */
function assignLanes(sessions: EnrichedSession[]): LaneSession[] {
  const laneEnds: number[] = [];
  const withLane = sessions
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((entry) => {
      let lane = laneEnds.findIndex((end) => end <= entry.start.getTime());
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = entry.end.getTime();
      return { ...entry, lane, laneCount: 1 };
    });

  // Gruppen überlappender Kurse ermitteln, damit die Breite stimmt
  let cluster: LaneSession[] = [];
  let clusterEnd = 0;
  const flush = () => {
    if (cluster.length === 0) return;
    const lanes = Math.max(...cluster.map((c) => c.lane)) + 1;
    cluster.forEach((c) => {
      c.laneCount = lanes;
    });
    cluster = [];
  };

  withLane.forEach((entry) => {
    if (cluster.length > 0 && entry.start.getTime() >= clusterEnd) flush();
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.end.getTime());
  });
  flush();

  return withLane;
}

export function WeekGrid({
  weekStart,
  sessions,
  linkBase,
}: {
  weekStart: Date;
  sessions: EnrichedSession[];
  linkBase: string;
}) {
  const navigate = useNavigate();
  const weekdays = useWeekdayNames('short');
  const current = now();

  const { startHour, endHour } = useMemo(() => {
    if (sessions.length === 0) return DEFAULT_RANGE;
    const starts = sessions.map((s) => s.start.getHours());
    const ends = sessions.map((s) => s.end.getHours() + (s.end.getMinutes() > 0 ? 1 : 0));
    return { startHour: Math.min(...starts, 8), endHour: Math.max(...ends, 18) };
  }, [sessions]);

  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight = totalMinutes * PX_PER_MINUTE;
  const byDay = groupByDay(sessions);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div className="card overflow-hidden">
      {/* Kopfzeile mit Wochentagen */}
      <div className="grid border-b border-line" style={{ gridTemplateColumns: '3.25rem repeat(7, minmax(0, 1fr))' }}>
        <div />
        {days.map((day, index) => {
          const isToday = isSameDay(day, current);
          return (
            <div
              key={toDateKey(day)}
              className={cn('border-l border-line px-2 py-2 text-center', isToday && 'bg-brand/10')}
            >
              <div className={cn('text-[0.7rem] font-semibold uppercase tracking-wide', isToday ? 'text-brand' : 'text-muted')}>
                {weekdays[index]}
              </div>
              <div className={cn('font-display text-lg leading-tight', isToday && 'text-brand')}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Raster */}
      <div className="relative overflow-x-auto pt-3">
        <div className="grid min-w-[52rem]" style={{ gridTemplateColumns: '3.25rem repeat(7, minmax(0, 1fr))' }}>
          {/* Zeitachse */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[0.7rem] tabular-nums text-muted"
                style={{ top: (hour - startHour) * 60 * PX_PER_MINUTE }}
              >
                {`${hour}`.padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const key = toDateKey(day);
            const daySessions = assignLanes(byDay.get(key) ?? []);
            const isToday = isSameDay(day, current);
            const minutesIntoDay = (current.getHours() - startHour) * 60 + current.getMinutes();

            return (
              <div key={key} className={cn('relative border-l border-line', isToday && 'bg-brand/5')} style={{ height: gridHeight }}>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-line/60"
                    style={{ top: (hour - startHour) * 60 * PX_PER_MINUTE }}
                  />
                ))}

                {isToday && minutesIntoDay > 0 && minutesIntoDay < totalMinutes && (
                  <div className="absolute inset-x-0 z-10 border-t-2 border-danger" style={{ top: minutesIntoDay * PX_PER_MINUTE }}>
                    <span className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-danger" />
                  </div>
                )}

                {daySessions.map((entry) => {
                  const color = courseColor(entry.template.kind);
                  const top = ((entry.start.getHours() - startHour) * 60 + entry.start.getMinutes()) * PX_PER_MINUTE;
                  const height = Math.max(entry.session.durationMin * PX_PER_MINUTE - 2, 26);
                  const width = 100 / entry.laneCount;
                  const cancelled = entry.session.status === 'abgesagt';
                  const full = entry.freeSpots === 0 && !cancelled;

                  return (
                    <button
                      key={entry.session.id}
                      type="button"
                      onClick={() => navigate(`${linkBase}/${entry.session.id}`)}
                      style={{ top, height, left: `${entry.lane * width}%`, width: `calc(${width}% - 3px)` }}
                      className={cn(
                        'absolute overflow-hidden rounded-md border px-1.5 py-1 text-left transition-colors',
                        color.chip,
                        cancelled && 'border-dashed opacity-60',
                        'hover:brightness-110',
                      )}
                      title={`${entry.template.name} · ${entry.session.startTime} · ${entry.coachName}`}
                    >
                      <span className="flex items-baseline gap-1 leading-tight">
                        <span className="shrink-0 text-[0.7rem] font-bold tabular-nums">{entry.session.startTime}</span>
                        <span className={cn('truncate text-[0.72rem] font-semibold', cancelled && 'line-through')}>
                          {entry.template.name}
                        </span>
                      </span>
                      {height > 34 && (
                        <span className="mt-0.5 flex items-baseline justify-between gap-1 text-[0.65rem] leading-tight text-muted">
                          <span className="truncate">{entry.coachName.split(' ')[0]}</span>
                          <span className={cn('shrink-0 font-semibold tabular-nums', full && !cancelled && 'text-danger')}>
                            {cancelled ? 'abgesagt' : `${entry.bookedCount}/${entry.session.capacity}`}
                          </span>
                        </span>
                      )}
                      {entry.myBooking?.status === 'gebucht' && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-success" title="Gebucht" />
                      )}
                      {entry.myBooking?.status === 'warteliste' && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning" title="Warteliste" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
