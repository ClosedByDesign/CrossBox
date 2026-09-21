import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock3, LayoutGrid, Timer, Trophy } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useDb } from '../../store';
import { atTime, now, toDateKey, today } from '../../lib/clock';
import { formatClock, formatTimeRange } from '../../lib/format';
import { courseColor } from '../../lib/courseColors';
import { WodTimer, modeForWod } from '../../components/tv/WodTimer';
import { Avatar } from '../../components/ui';

/** Die Beamer-Ansicht läuft bewusst immer dunkel – in der Box hängt der Fernseher meist im Halbdunkel */
function TvFrame({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="dark min-h-screen bg-canvas px-[4vw] py-[3vh] text-ink">
      <Link
        to="/tv"
        className="fixed right-4 top-4 z-10 text-xs text-muted no-underline opacity-60 hover:opacity-100"
      >
        {title ? '← Beamer-Menü' : ''}
      </Link>
      {children}
    </div>
  );
}

/** Auswahl der Anzeigen für den Fernseher in der Box */
export function TvLauncher() {
  const db = useDb();
  const current = now();
  const todayKey = toDateKey(today());

  const live = db.sessions
    .filter((s) => s.date === todayKey && s.status !== 'abgesagt')
    .map((session) => ({ session, start: atTime(session.date, session.startTime) }))
    .sort((a, b) => Math.abs(a.start.getTime() - current.getTime()) - Math.abs(b.start.getTime() - current.getTime()))[0];

  const tiles = [
    { to: live ? `/tv/kurs/${live.session.id}` : '/tv/kursplan', icon: LayoutGrid, title: 'Aktueller Kurs', text: 'WOD, Teilnehmer und Timer für den laufenden Kurs' },
    { to: '/tv/timer', icon: Timer, title: 'Timer', text: 'AMRAP, EMOM, For Time und Tabata – frei konfigurierbar' },
    { to: '/tv/leaderboard', icon: Trophy, title: 'Leaderboard', text: 'Gesamtwertung der laufenden Saison' },
    { to: '/tv/kursplan', icon: CalendarDays, title: 'Tagesplan', text: 'Alle Kurse des Tages für den Eingangsbereich' },
  ];

  return (
    <TvFrame>
      <header className="mb-[6vh]">
        <p className="font-display text-[clamp(1rem,2vw,1.6rem)] uppercase tracking-[0.2em] text-brand">Beamer-Anzeige</p>
        <h1 className="text-[clamp(2rem,6vw,4.5rem)]">Was soll auf den Fernseher?</h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="card flex items-start gap-4 p-6 no-underline transition-colors hover:border-brand"
            >
              <Icon size={36} className="text-brand" />
              <span>
                <span className="block font-display text-2xl">{tile.title}</span>
                <span className="block text-sm text-muted">{tile.text}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-[6vh] text-sm text-muted">
        Tipp: Vollbild mit F11. Die Anzeige braucht keine Anmeldung und lässt sich direkt als Lesezeichen auf dem TV-Browser ablegen.
      </p>
      <Link to="/app" className="mt-2 inline-block text-xs text-muted">
        ← Zurück zur App
      </Link>
    </TvFrame>
  );
}

/** Große WOD-Anzeige mit Timer und Teilnehmerliste */
export function TvSession() {
  const { sessionId } = useParams();
  const db = useDb();
  const current = now();

  const data = useMemo(() => {
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const template = db.courseTemplates.find((t) => t.id === session.templateId);
    const wod = db.wods.find((w) => w.id === session.wodId) ?? null;
    const coach = db.users.find((u) => u.id === session.coachId);
    const participants = db.bookings
      .filter((b) => b.sessionId === session.id && (b.status === 'gebucht' || b.status === 'anwesend'))
      .map((b) => ({ booking: b, user: db.users.find((u) => u.id === b.userId) }))
      .filter((p) => p.user);
    return { session, template, wod, coach, participants };
  }, [db, sessionId]);

  if (!data?.template) {
    return (
      <TvFrame title="menu">
        <p className="mt-[20vh] text-center text-[clamp(1.2rem,3vw,2rem)] text-muted">Kein Kurs ausgewählt.</p>
      </TvFrame>
    );
  }

  const { session, template, wod, coach, participants } = data;
  const color = courseColor(template.kind);

  return (
    <TvFrame title="menu">
      <header className="mb-[3vh] flex flex-wrap items-end justify-between gap-4 border-b-4 border-brand pb-[2vh]">
        <div>
          <p className={cn('font-display text-[clamp(0.9rem,1.8vw,1.4rem)] uppercase tracking-[0.2em]', color.text)}>
            {template.kind}
          </p>
          <h1 className="text-[clamp(2.2rem,7vw,5.5rem)] leading-none">{wod?.name ?? template.name}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-[clamp(1.2rem,3vw,2.4rem)] tabular-nums text-brand">
            {formatTimeRange(session.startTime, session.durationMin)}
          </p>
          <p className="text-[clamp(0.8rem,1.4vw,1.1rem)] text-muted">
            {coach ? `${coach.firstName} ${coach.lastName}` : ''} · {participants.length} Teilnehmer
          </p>
        </div>
      </header>

      <div className="grid gap-[3vw] lg:grid-cols-[3fr_2fr]">
        <div>
          {wod ? (
            <div className="flex flex-col gap-[2vh]">
              {wod.blocks.map((block) => (
                <div key={block.label}>
                  <p className="font-display text-[clamp(1rem,2vw,1.6rem)] uppercase tracking-wide text-brand">{block.label}</p>
                  {block.lines.map((line) => (
                    <p key={line} className="text-[clamp(1.1rem,2.6vw,2.2rem)] font-semibold leading-tight">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
              {(wod.scalingRx || wod.scalingScaled) && (
                <div className="mt-[1vh] grid gap-2 text-[clamp(0.85rem,1.5vw,1.2rem)] sm:grid-cols-2">
                  {wod.scalingRx && (
                    <p className="rounded-lg bg-brand/15 px-4 py-2">
                      <strong className="text-brand">RX</strong> · {wod.scalingRx}
                    </p>
                  )}
                  {wod.scalingScaled && (
                    <p className="rounded-lg bg-elevated px-4 py-2">
                      <strong>Scaled</strong> · {wod.scalingScaled}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[clamp(1.1rem,2.4vw,2rem)] text-muted">Für diesen Kurs ist noch kein Workout hinterlegt.</p>
          )}
        </div>

        <div className="flex flex-col gap-[3vh]">
          <div className="card px-4 py-[3vh]">
            <WodTimer initialMode={wod ? modeForWod(wod.kind) : 'forTime'} capMinutes={wod?.capMinutes ?? null} compact />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 font-display text-[clamp(0.9rem,1.6vw,1.2rem)] uppercase tracking-wide text-muted">
              <Clock3 size={16} /> {formatClock(current)} Uhr · Teilnehmer
            </p>
            <ul className="grid grid-cols-2 gap-1.5">
              {participants.map(({ user, booking }) => (
                <li key={booking.id} className="flex items-center gap-2 rounded-lg bg-elevated px-2 py-1.5">
                  <Avatar name={`${user!.firstName} ${user!.lastName}`} hue={user!.avatarHue} size={26} />
                  <span className="truncate text-[clamp(0.8rem,1.3vw,1rem)]">
                    {user!.firstName} {user!.lastName.charAt(0)}.
                  </span>
                  {booking.status === 'anwesend' && <span className="ml-auto h-2 w-2 rounded-full bg-success" title="Eingecheckt" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </TvFrame>
  );
}

export function TvTimer() {
  return (
    <TvFrame title="menu">
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <WodTimer />
      </div>
    </TvFrame>
  );
}

export function TvLeaderboard() {
  const db = useDb();
  const [scope, setScope] = useState<'gesamt' | 'monat'>('gesamt');

  const rows = useMemo(() => {
    const monthStart = new Date(now().getFullYear(), now().getMonth(), 1);
    const totals = new Map<string, number>();
    db.leaderboard.forEach((entry) => {
      if (scope === 'monat') {
        const session = db.sessions.find((s) => s.id === entry.sessionId);
        if (!session || atTime(session.date, session.startTime) < monthStart) return;
      }
      totals.set(entry.userId, (totals.get(entry.userId) ?? 0) + entry.points);
    });
    return [...totals.entries()]
      .map(([userId, points]) => ({ user: db.users.find((u) => u.id === userId), points }))
      .filter((r) => r.user)
      .sort((a, b) => b.points - a.points)
      .slice(0, 12);
  }, [db, scope]);

  return (
    <TvFrame title="menu">
      <header className="mb-[3vh] flex flex-wrap items-end justify-between gap-3 border-b-4 border-brand pb-[2vh]">
        <h1 className="text-[clamp(2rem,6vw,4.5rem)] leading-none">Leaderboard</h1>
        <div className="flex gap-2">
          {(['gesamt', 'monat'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={cn(
                'rounded-full border px-4 py-1.5 font-semibold',
                scope === value ? 'border-brand bg-brand/20 text-brand' : 'border-line text-muted',
              )}
            >
              {value === 'gesamt' ? 'Saison' : 'Dieser Monat'}
            </button>
          ))}
        </div>
      </header>
      <ol className="flex flex-col gap-[1vh]">
        {rows.map((row, index) => (
          <li
            key={row.user!.id}
            className={cn(
              'flex items-center gap-4 rounded-xl px-4 py-[1.2vh]',
              index === 0 ? 'bg-brand/20' : index < 3 ? 'bg-elevated' : 'bg-surface',
            )}
          >
            <span
              className={cn(
                'w-[2.5ch] text-right font-display text-[clamp(1.4rem,3.4vw,2.6rem)] tabular-nums',
                index === 0 ? 'text-brand' : 'text-muted',
              )}
            >
              {index + 1}
            </span>
            <Avatar name={`${row.user!.firstName} ${row.user!.lastName}`} hue={row.user!.avatarHue} size={40} />
            <span className="flex-1 truncate text-[clamp(1.1rem,2.6vw,2rem)] font-semibold">
              {row.user!.firstName} {row.user!.lastName}
            </span>
            <span className="font-display text-[clamp(1.2rem,3vw,2.4rem)] tabular-nums text-brand">{row.points}</span>
          </li>
        ))}
      </ol>
    </TvFrame>
  );
}

export function TvDaySchedule() {
  const db = useDb();
  const current = now();
  const todayKey = toDateKey(today());

  const sessions = db.sessions
    .filter((s) => s.date === todayKey)
    .map((session) => {
      const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
      const coach = db.users.find((u) => u.id === session.coachId);
      const booked = db.bookings.filter((b) => b.sessionId === session.id && (b.status === 'gebucht' || b.status === 'anwesend')).length;
      const start = atTime(session.date, session.startTime);
      const end = new Date(start.getTime() + session.durationMin * 60_000);
      return { session, template, coach, booked, start, end };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <TvFrame title="menu">
      <header className="mb-[3vh] flex items-end justify-between border-b-4 border-brand pb-[2vh]">
        <h1 className="text-[clamp(2rem,6vw,4.5rem)] leading-none">Kurse heute</h1>
        <p className="font-display text-[clamp(1.4rem,3vw,2.4rem)] tabular-nums text-brand">{formatClock(current)}</p>
      </header>
      <ul className="flex flex-col gap-[1vh]">
        {sessions.map(({ session, template, coach, booked, start, end }) => {
          const isLive = start <= current && end >= current;
          const isPast = end < current;
          const color = courseColor(template.kind);
          return (
            <li
              key={session.id}
              className={cn(
                'flex items-center gap-4 rounded-xl border px-4 py-[1.2vh]',
                isLive ? 'border-brand bg-brand/15' : 'border-line bg-surface',
                isPast && 'opacity-40',
              )}
            >
              <span className={cn('h-[3vh] w-1.5 rounded-full', color.bar)} />
              <span className="font-display text-[clamp(1.3rem,3vw,2.4rem)] tabular-nums">{session.startTime}</span>
              <span className="flex-1 truncate text-[clamp(1.1rem,2.4vw,1.9rem)] font-semibold">
                {template.name}
                {session.status === 'abgesagt' && <span className="ml-2 text-danger">abgesagt</span>}
              </span>
              <span className="text-[clamp(0.85rem,1.6vw,1.2rem)] text-muted">{coach?.firstName}</span>
              <span className="w-[6ch] text-right font-display text-[clamp(1rem,2vw,1.5rem)] tabular-nums text-muted">
                {booked}/{session.capacity}
              </span>
              {isLive && <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-ink">Läuft</span>}
            </li>
          );
        })}
      </ul>
    </TvFrame>
  );
}
