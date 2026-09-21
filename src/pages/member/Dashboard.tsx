import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Dumbbell, Flame, QrCode, Receipt, Trophy } from 'lucide-react';
import { Badge, Card, EmptyState, LinkButton, PageHeader, ProgressBar, SectionCard, StatTile } from '../../components/ui';
import { SessionRow } from '../../components/schedule/SessionRow';
import { useDb, useDemoStore } from '../../store';
import { atTime, now, toDateKey, today } from '../../lib/clock';
import { formatCurrency, formatDate, formatTimeRange } from '../../lib/format';

export default function MemberDashboard() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const user = db.users.find((u) => u.id === userId);
  const current = now();

  const data = useMemo(() => {
    const templates = new Map(db.courseTemplates.map((t) => [t.id, t]));
    const users = new Map(db.users.map((u) => [u.id, u]));

    const myBookings = db.bookings.filter((b) => b.userId === userId);
    const upcoming = myBookings
      .filter((b) => b.status === 'gebucht' || b.status === 'warteliste')
      .map((booking) => {
        const session = db.sessions.find((s) => s.id === booking.sessionId);
        if (!session || session.status === 'abgesagt') return null;
        const template = templates.get(session.templateId);
        if (!template) return null;
        const start = atTime(session.date, session.startTime);
        if (start < current) return null;
        const coach = users.get(session.coachId);
        const sessionBookings = db.bookings.filter((b) => b.sessionId === session.id);
        const bookedCount = sessionBookings.filter((b) => b.status === 'gebucht' || b.status === 'anwesend').length;
        return {
          session,
          template,
          coachName: coach ? `${coach.firstName} ${coach.lastName}` : '—',
          start,
          end: new Date(start.getTime() + session.durationMin * 60_000),
          bookedCount,
          waitlistCount: sessionBookings.filter((b) => b.status === 'warteliste').length,
          freeSpots: Math.max(0, session.capacity - bookedCount),
          myBooking: booking,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const visitsThisMonth = myBookings.filter((b) => {
      if (b.status !== 'anwesend') return false;
      const session = db.sessions.find((s) => s.id === b.sessionId);
      return session ? atTime(session.date, session.startTime) >= monthStart : false;
    }).length;

    const totals = new Map<string, number>();
    db.leaderboard.forEach((entry) => totals.set(entry.userId, (totals.get(entry.userId) ?? 0) + entry.points));
    const ranking = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const rank = ranking.findIndex(([id]) => id === userId) + 1;

    const membership = db.memberships.find((m) => m.userId === userId);
    const plan = db.plans.find((p) => p.id === membership?.planId);
    const openInvoice = db.invoices.find((i) => i.userId === userId && i.status !== 'bezahlt');

    const todayKey = toDateKey(today());
    const todaysWod = db.sessions
      .filter((s) => s.date === todayKey && s.wodId)
      .map((s) => db.wods.find((w) => w.id === s.wodId))
      .find(Boolean);

    const pendingResults = myBookings
      .filter((b) => b.status === 'anwesend')
      .map((b) => db.sessions.find((s) => s.id === b.sessionId))
      .filter((s): s is NonNullable<typeof s> => !!s && !!s.wodId)
      .filter((s) => !db.results.some((r) => r.sessionId === s.id && r.userId === userId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 1);

    return {
      upcoming,
      visitsThisMonth,
      rank,
      points: totals.get(userId ?? '') ?? 0,
      membership,
      plan,
      openInvoice,
      todaysWod,
      pendingResult: pendingResults[0] ?? null,
      unreadNews: db.news.slice(0, 2),
    };
  }, [db, userId, current]);

  if (!user) return null;

  const next = data.upcoming[0];
  const hoursToNext = next ? Math.round((next.start.getTime() - current.getTime()) / 3_600_000) : null;

  return (
    <>
      <PageHeader
        title={`Moin, ${user.firstName}!`}
        subtitle={formatDate(current, locale, { weekday: 'long', day: '2-digit', month: 'long' })}
        actions={<LinkButton to="/app/kursplan" variant="primary" icon={<CalendarDays size={16} />}>Kurs buchen</LinkButton>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Punkte gesamt" value={data.points} hint={data.rank > 0 ? `Platz ${data.rank} im Leaderboard` : 'Noch keine Wertung'} icon={<Trophy size={16} />} />
        <StatTile label="Besuche im Monat" value={data.visitsThisMonth} hint="Check-ins in diesem Monat" tone="success" icon={<Flame size={16} />} />
        <StatTile
          label="Tarif"
          value={data.plan?.name ?? '—'}
          hint={
            data.plan?.sessionsPerMonth
              ? `${data.membership?.usedThisMonth ?? 0} von ${data.plan.sessionsPerMonth} Einheiten genutzt`
              : 'Unbegrenzt trainieren'
          }
          tone="info"
        />
        <StatTile
          label="Offene Rechnung"
          value={data.openInvoice ? formatCurrency(data.openInvoice.amountCents, locale) : '0,00 €'}
          hint={data.openInvoice ? `fällig am ${formatDate(data.openInvoice.dueAt, locale)}` : 'Alles bezahlt'}
          tone={data.openInvoice ? 'warning' : 'success'}
          icon={<Receipt size={16} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Dein nächster Kurs"
            action={<Link to="/app/buchungen" className="text-xs">Alle Buchungen</Link>}
            className="mb-4"
          >
            {next ? (
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-display text-2xl">{next.template.name}</span>
                  {next.myBooking.status === 'warteliste' ? (
                    <Badge tone="warning">Warteliste</Badge>
                  ) : (
                    <Badge tone="success">Gebucht</Badge>
                  )}
                  {hoursToNext !== null && hoursToNext <= 24 && (
                    <Badge tone="brand">{hoursToNext <= 0 ? 'Gleich' : `in ${hoursToNext} Std.`}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {formatDate(next.session.date, locale, { weekday: 'long', day: '2-digit', month: 'long' })} ·{' '}
                  {formatTimeRange(next.session.startTime, next.session.durationMin)} Uhr · {next.coachName}
                </p>
                <div className="mt-3 max-w-xs">
                  <ProgressBar value={next.bookedCount} max={next.session.capacity} />
                  <p className="mt-1 text-xs text-muted">
                    {next.bookedCount} von {next.session.capacity} Plätzen belegt
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LinkButton to={`/app/kurs/${next.session.id}`} variant="secondary" size="sm">
                    Kursdetails
                  </LinkButton>
                  <LinkButton to="/app/checkin" variant="primary" size="sm" icon={<QrCode size={14} />}>
                    Check-in-Code
                  </LinkButton>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Noch nichts gebucht"
                description="Im Kursplan findest du alle Termine dieser Woche."
                action={<LinkButton to="/app/kursplan" variant="primary" size="sm">Zum Kursplan</LinkButton>}
              />
            )}
          </SectionCard>

          <SectionCard title="Weitere Buchungen" className="mb-4">
            {data.upcoming.length > 1 ? (
              <div className="flex flex-col gap-2">
                {data.upcoming.slice(1, 4).map((entry) => (
                  <SessionRow key={entry.session.id} entry={entry} to={`/app/kurs/${entry.session.id}`} showDate />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Aktuell hast du keine weiteren Kurse gebucht.</p>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionCard title="WOD heute" className="mb-4" action={<Link to="/app/wods" className="text-xs">Alle WODs</Link>}>
            {data.todaysWod ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Dumbbell size={16} className="text-brand" />
                  <span className="font-display text-lg">{data.todaysWod.name}</span>
                  <Badge tone="brand">{data.todaysWod.kind}</Badge>
                </div>
                {data.todaysWod.blocks.slice(0, 2).map((block) => (
                  <div key={block.label} className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{block.label}</p>
                    {block.lines.map((line) => (
                      <p key={line} className="text-sm">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Für heute ist noch kein Workout veröffentlicht.</p>
            )}
          </SectionCard>

          {data.pendingResult && (
            <Card className="mb-4 border-brand/50 bg-brand/10">
              <p className="text-sm font-semibold">Ergebnis nachtragen</p>
              <p className="mt-0.5 text-xs text-muted">
                Für deinen Kurs am {formatDate(data.pendingResult.date, locale)} fehlt noch dein Ergebnis.
              </p>
              <LinkButton to="/app/ergebnisse" variant="primary" size="sm" className="mt-2">
                Jetzt eintragen
              </LinkButton>
            </Card>
          )}

          <SectionCard title="Aus der Box" action={<Link to="/app/news" className="text-xs">Alle News</Link>}>
            <ul className="flex flex-col gap-3">
              {data.unreadNews.map((post) => (
                <li key={post.id}>
                  <Link to="/app/news" className="text-sm font-semibold no-underline hover:text-brand">
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted">{post.teaser}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
