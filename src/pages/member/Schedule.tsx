import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { PageHeader, Button, Chip, EmptyState } from '../../components/ui';
import { Select } from '../../components/ui/form';
import { WeekGrid } from '../../components/schedule/WeekGrid';
import { DayStrip } from '../../components/schedule/DayStrip';
import { SessionRow } from '../../components/schedule/SessionRow';
import { emptyFilters, groupByDay, useWeekSessions, type ScheduleFilters } from '../../components/schedule/useSchedule';
import { addDays, isoWeekNumber, startOfWeek, toDateKey, today } from '../../lib/clock';
import { formatDate, relativeDayLabel } from '../../lib/format';
import { useDb, useDemoStore } from '../../store';
import { useWeekdayNames } from '../../i18n';

export default function MemberSchedule() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filters, setFilters] = useState<ScheduleFilters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);

  const weekStart = useMemo(() => addDays(startOfWeek(today()), weekOffset * 7), [weekOffset]);
  const sessions = useWeekSessions(weekStart, filters);
  const weekdayNames = useWeekdayNames('long');

  const [selectedDay, setSelectedDay] = useState<string>(toDateKey(today()));
  const daysInWeek = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));
  const activeDay = daysInWeek.includes(selectedDay) ? selectedDay : daysInWeek[0];

  const byDay = groupByDay(sessions);
  const daySessions = byDay.get(activeDay) ?? [];
  const coaches = db.users.filter((u) => u.role === 'coach');
  const kinds = Array.from(new Set(db.courseTemplates.map((t) => t.kind)));
  const activeFilterCount =
    (filters.kind !== 'alle' ? 1 : 0) + (filters.coachId !== 'alle' ? 1 : 0) + (filters.onlyFree ? 1 : 0) + (filters.onlyMine ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Kursplan"
        subtitle={`KW ${isoWeekNumber(weekStart)} · ${formatDate(weekStart, locale, { day: '2-digit', month: 'short' })} – ${formatDate(addDays(weekStart, 6), locale, { day: '2-digit', month: 'short', year: 'numeric' })}`}
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Vorherige Woche"
              icon={<ChevronLeft size={15} />}
            />
            <Button size="sm" variant={weekOffset === 0 ? 'primary' : 'secondary'} onClick={() => { setWeekOffset(0); setSelectedDay(toDateKey(today())); }}>
              Heute
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Nächste Woche"
              icon={<ChevronRight size={15} />}
            />
            <Button
              size="sm"
              variant={activeFilterCount > 0 ? 'primary' : 'secondary'}
              onClick={() => setShowFilters((v) => !v)}
              icon={<SlidersHorizontal size={15} />}
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>
        }
      />

      {showFilters && (
        <div className="card mb-4 flex flex-wrap items-end gap-3 p-3">
          <div className="min-w-[10rem] flex-1">
            <label className="label-base" htmlFor="filter-kind">
              Kursart
            </label>
            <Select id="filter-kind" value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value })}>
              <option value="alle">Alle Kursarten</option>
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="label-base" htmlFor="filter-coach">
              Trainer
            </label>
            <Select id="filter-coach" value={filters.coachId} onChange={(e) => setFilters({ ...filters, coachId: e.target.value })}>
              <option value="alle">Alle Trainer</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 pb-0.5">
            <Chip active={filters.onlyFree} onClick={() => setFilters({ ...filters, onlyFree: !filters.onlyFree })}>
              Nur freie Plätze
            </Chip>
            <Chip active={filters.onlyMine} onClick={() => setFilters({ ...filters, onlyMine: !filters.onlyMine })}>
              Nur meine Kurse
            </Chip>
            {activeFilterCount > 0 && (
              <Chip onClick={() => setFilters(emptyFilters)}>Zurücksetzen</Chip>
            )}
          </div>
        </div>
      )}

      {/* Desktop: Wochenraster */}
      <div className="hidden md:block">
        {sessions.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} />}
            title="Keine Kurse in dieser Woche"
            description="Passe die Filter an oder wechsle die Woche."
          />
        ) : (
          <WeekGrid weekStart={weekStart} sessions={sessions} linkBase="/app/kurs" />
        )}
      </div>

      {/* Mobil: Tagesansicht */}
      <div className="md:hidden">
        <DayStrip weekStart={weekStart} selected={activeDay} onSelect={setSelectedDay} sessions={sessions} />
        <h2 className="mb-2 mt-4 text-base">
          {relativeDayLabel(activeDay, toDateKey(today()), locale) ??
            `${weekdayNames[daysInWeek.indexOf(activeDay)]}, ${formatDate(activeDay, locale, { day: '2-digit', month: '2-digit' })}`}
        </h2>
        {daySessions.length === 0 ? (
          <EmptyState title="Keine Kurse an diesem Tag" description="Wähle einen anderen Tag oder passe die Filter an." />
        ) : (
          <div className="flex flex-col gap-2">
            {daySessions.map((entry) => (
              <SessionRow key={entry.session.id} entry={entry} to={`/app/kurs/${entry.session.id}`} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
