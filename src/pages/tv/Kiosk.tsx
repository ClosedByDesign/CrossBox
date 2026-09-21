import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useDb } from '../../store';
import { checkIn } from '../../store/actions';
import { atTime, minutesBetween, now, toDateKey, today } from '../../lib/clock';
import { formatTimeRange } from '../../lib/format';
import { Avatar } from '../../components/ui';
import { Input } from '../../components/ui/form';

const CHECK_IN_WINDOW_MIN = 30;

/** Check-in-Terminal für das Tablet am Eingang der Box */
export default function Kiosk() {
  const db = useDb();
  const current = now();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [done, setDone] = useState<{ name: string; course: string } | null>(null);

  const openSessions = useMemo(() => {
    const todayKey = toDateKey(today());
    return db.sessions
      .filter((s) => s.date === todayKey && s.status !== 'abgesagt')
      .map((session) => {
        const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
        const start = atTime(session.date, session.startTime);
        const end = new Date(start.getTime() + session.durationMin * 60_000);
        return { session, template, start, end };
      })
      .filter((entry) => minutesBetween(current, entry.start) <= CHECK_IN_WINDOW_MIN && entry.end >= current)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [db, current]);

  const active = openSessions.find((s) => s.session.id === sessionId) ?? openSessions[0] ?? null;

  const participants = useMemo(() => {
    if (!active) return [];
    return db.bookings
      .filter((b) => b.sessionId === active.session.id && (b.status === 'gebucht' || b.status === 'anwesend'))
      .map((booking) => ({ booking, user: db.users.find((u) => u.id === booking.userId)! }))
      .filter((entry) => entry.user)
      .filter((entry) =>
        query.trim()
          ? `${entry.user.firstName} ${entry.user.lastName} ${entry.user.nickname}`.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      )
      .sort((a, b) => a.user.firstName.localeCompare(b.user.firstName));
  }, [db, active, query]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), 6000);
    return () => clearTimeout(timer);
  }, [done]);

  if (done) {
    return (
      <div className="dark flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
        <CheckCircle2 size={96} className="text-success" />
        <h1 className="mt-6 text-[clamp(2rem,6vw,3.5rem)]">Willkommen, {done.name}!</h1>
        <p className="mt-2 text-[clamp(1rem,2.4vw,1.5rem)] text-muted">Eingecheckt für {done.course}. Viel Spaß beim Training.</p>
        <button type="button" onClick={() => setDone(null)} className="mt-8 rounded-full border border-line px-6 py-3 text-sm text-muted">
          Weiter
        </button>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-canvas px-[4vw] py-[4vh] text-ink">
      <header className="mb-[3vh] flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-brand">Check-in</p>
          <h1 className="text-[clamp(1.8rem,5vw,3.2rem)] leading-none">Schön, dass du da bist</h1>
        </div>
        <Link to="/tv" className="text-xs text-muted no-underline opacity-60">
          Kiosk verlassen
        </Link>
      </header>

      {openSessions.length === 0 ? (
        <div className="card px-6 py-[10vh] text-center">
          <p className="text-[clamp(1.1rem,2.4vw,1.8rem)] text-muted">
            Gerade läuft kein Kurs im Check-in-Fenster. Der Check-in öffnet 30 Minuten vor Kursbeginn.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-[2vh] flex flex-wrap gap-2">
            {openSessions.map((entry) => (
              <button
                key={entry.session.id}
                type="button"
                onClick={() => setSessionId(entry.session.id)}
                className={cn(
                  'rounded-xl border px-5 py-3 text-left transition-colors',
                  active?.session.id === entry.session.id ? 'border-brand bg-brand/15' : 'border-line bg-surface',
                )}
              >
                <span className="block font-display text-2xl tabular-nums">{entry.session.startTime}</span>
                <span className="block text-sm font-semibold">{entry.template.name}</span>
                <span className="block text-xs text-muted">{formatTimeRange(entry.session.startTime, entry.session.durationMin)}</span>
              </button>
            ))}
          </div>

          <div className="relative mb-[2vh] max-w-md">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Namen suchen …"
              className="py-4 pl-10 text-lg"
              aria-label="Namen suchen"
            />
          </div>

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map(({ user, booking }) => {
              const checkedIn = booking.status === 'anwesend';
              return (
                <li key={booking.id}>
                  <button
                    type="button"
                    disabled={checkedIn}
                    onClick={() => {
                      checkIn(active!.session.id, user.id, 'kiosk');
                      setDone({ name: user.firstName, course: active!.template.name });
                      setQuery('');
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors',
                      checkedIn ? 'border-success/50 bg-success/10 opacity-70' : 'border-line bg-surface hover:border-brand',
                    )}
                  >
                    <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-semibold">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="block text-xs text-muted">{checkedIn ? 'bereits eingecheckt' : 'zum Einchecken tippen'}</span>
                    </span>
                    {checkedIn && <CheckCircle2 size={22} className="text-success" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {participants.length === 0 && (
            <p className="mt-6 text-center text-muted">Niemand gefunden. Bitte an der Theke melden.</p>
          )}
        </>
      )}
    </div>
  );
}
