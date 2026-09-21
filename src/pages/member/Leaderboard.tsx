import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Avatar, Badge, Card, EmptyState, PageHeader } from '../../components/ui';
import { Select } from '../../components/ui/form';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { useDb, useDemoStore } from '../../store';
import { atTime, now } from '../../lib/clock';
import { formatDate } from '../../lib/format';

const tabs: TabDef[] = [
  { key: 'gesamt', label: 'Gesamt' },
  { key: 'monat', label: 'Dieser Monat' },
  { key: 'kurs', label: 'Nach Kurs' },
];

export default function Leaderboard() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const active = useActiveTab(tabs);
  const season = db.seasons.find((s) => s.active);

  const scoredSessions = useMemo(
    () =>
      db.sessions
        .filter((s) => db.leaderboard.some((e) => e.sessionId === s.id))
        .sort((a, b) => (b.date === a.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date)))
        .slice(0, 30),
    [db],
  );

  const [sessionId, setSessionId] = useState<string>('');
  const selectedSession = sessionId || scoredSessions[0]?.id || '';

  const rows = useMemo(() => {
    const monthStart = new Date(now().getFullYear(), now().getMonth(), 1);
    const totals = new Map<string, { points: number; classes: number }>();

    db.leaderboard.forEach((entry) => {
      if (active === 'kurs' && entry.sessionId !== selectedSession) return;
      if (active === 'monat') {
        const session = db.sessions.find((s) => s.id === entry.sessionId);
        if (!session || atTime(session.date, session.startTime) < monthStart) return;
      }
      const prev = totals.get(entry.userId) ?? { points: 0, classes: 0 };
      totals.set(entry.userId, { points: prev.points + entry.points, classes: prev.classes + 1 });
    });

    return [...totals.entries()]
      .map(([id, value]) => ({ user: db.users.find((u) => u.id === id), ...value }))
      .filter((row) => row.user)
      .sort((a, b) => b.points - a.points);
  }, [db, active, selectedSession]);

  const myIndex = rows.findIndex((row) => row.user?.id === userId);
  const visible = rows.slice(0, 25);
  const myRow = myIndex >= 25 ? rows[myIndex] : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Leaderboard"
        subtitle={season ? `${season.name} · ${formatDate(season.from, locale)} – ${formatDate(season.to, locale)}` : undefined}
        actions={myIndex >= 0 ? <Badge tone="brand">Dein Platz: {myIndex + 1}</Badge> : undefined}
      />
      <Tabs tabs={tabs} />

      {active === 'kurs' && (
        <div className="mb-3">
          <label className="label-base" htmlFor="session-select">
            Kurstermin
          </label>
          <Select id="session-select" value={selectedSession} onChange={(e) => setSessionId(e.target.value)}>
            {scoredSessions.map((session) => {
              const template = db.courseTemplates.find((t) => t.id === session.templateId);
              return (
                <option key={session.id} value={session.id}>
                  {formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })} ·{' '}
                  {session.startTime} · {template?.name}
                </option>
              );
            })}
          </Select>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={<Trophy size={28} />} title="Noch keine Wertung" description="Sobald Trainer Punkte vergeben, erscheint hier die Rangliste." />
      ) : (
        <Card className="p-2">
          <ul className="flex flex-col">
            {visible.map((row, index) => {
              const isMe = row.user?.id === userId;
              return (
                <li
                  key={row.user!.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2',
                    isMe && 'bg-brand/10 ring-1 ring-brand',
                  )}
                >
                  <span
                    className={cn(
                      'w-7 text-center font-display text-lg tabular-nums',
                      index === 0 && 'text-amber-400',
                      index === 1 && 'text-slate-400',
                      index === 2 && 'text-amber-700',
                      index > 2 && 'text-muted',
                    )}
                  >
                    {index + 1}
                  </span>
                  <Avatar name={`${row.user!.firstName} ${row.user!.lastName}`} hue={row.user!.avatarHue} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {row.user!.firstName} {row.user!.lastName}
                    {isMe && <span className="ml-1 text-xs font-normal text-brand">(du)</span>}
                  </span>
                  <span className="hidden text-xs text-muted sm:block">{row.classes} Kurse</span>
                  <span className="w-14 text-right font-display text-base tabular-nums text-brand">{row.points}</span>
                </li>
              );
            })}
            {myRow && (
              <>
                <li className="py-1 text-center text-xs text-muted">…</li>
                <li className="flex items-center gap-3 rounded-lg bg-brand/10 px-2 py-2 ring-1 ring-brand">
                  <span className="w-7 text-center font-display text-lg tabular-nums text-muted">{myIndex + 1}</span>
                  <Avatar name={`${myRow.user!.firstName} ${myRow.user!.lastName}`} hue={myRow.user!.avatarHue} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {myRow.user!.firstName} {myRow.user!.lastName} <span className="text-xs font-normal text-brand">(du)</span>
                  </span>
                  <span className="w-14 text-right font-display text-base tabular-nums text-brand">{myRow.points}</span>
                </li>
              </>
            )}
          </ul>
        </Card>
      )}

      <p className="mt-3 text-xs text-muted">
        Punkte vergibt der Trainer nach jedem Kurs. Gewertet wird pro Kurs – die Gesamtwertung summiert alle Kurse der Saison.
      </p>
    </div>
  );
}
