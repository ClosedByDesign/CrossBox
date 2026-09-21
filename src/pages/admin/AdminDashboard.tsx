import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Euro, TrendingUp, UserPlus, Users } from 'lucide-react';
import { Badge, Card, EmptyState, LinkButton, PageHeader, ProgressBar, SectionCard, StatTile } from '../../components/ui';
import { useDb, useDemoStore } from '../../store';
import { addDays, atTime, now, startOfWeek, toDateKey, today } from '../../lib/clock';
import { formatCurrency, formatDate, percent } from '../../lib/format';
import { MAIN_TENANT_ID } from '../../data/seed/static';

export default function AdminDashboard() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = now();
  const todayKey = toDateKey(today());

  const data = useMemo(() => {
    const members = db.users.filter((u) => u.role === 'member' && u.tenantId === MAIN_TENANT_ID);
    const activeMembers = members.filter((m) => m.status === 'aktiv');

    const weekStart = startOfWeek(current);
    const weekSessions = db.sessions.filter(
      (s) => s.date >= toDateKey(weekStart) && s.date <= toDateKey(addDays(weekStart, 6)) && s.status !== 'abgesagt',
    );
    const weekCapacity = weekSessions.reduce((sum, s) => sum + s.capacity, 0);
    const weekBooked = db.bookings.filter(
      (b) => weekSessions.some((s) => s.id === b.sessionId) && (b.status === 'gebucht' || b.status === 'anwesend'),
    ).length;

    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const revenue = db.invoices
      .filter((i) => new Date(i.issuedAt) >= monthStart && i.status !== 'ueberfaellig')
      .reduce((sum, i) => sum + i.amountCents, 0);
    const openInvoices = db.invoices.filter((i) => i.status !== 'bezahlt');
    const openSum = openInvoices.reduce((sum, i) => sum + i.amountCents, 0);

    const pastMonth = db.sessions.filter((s) => s.status === 'vorbei' && new Date(s.date) >= addDays(current, -30));
    const pastBookings = db.bookings.filter((b) => pastMonth.some((s) => s.id === b.sessionId));
    const noShows = pastBookings.filter((b) => b.status === 'no-show').length;
    const attended = pastBookings.filter((b) => b.status === 'anwesend').length;

    const todaySessions = db.sessions
      .filter((s) => s.date === todayKey)
      .map((session) => {
        const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
        const coach = db.users.find((u) => u.id === session.coachId);
        const booked = db.bookings.filter((b) => b.sessionId === session.id && (b.status === 'gebucht' || b.status === 'anwesend')).length;
        const waitlist = db.bookings.filter((b) => b.sessionId === session.id && b.status === 'warteliste').length;
        return { session, template, coach, booked, waitlist, start: atTime(session.date, session.startTime) };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const openPoints = db.sessions.filter((s) => s.status === 'vorbei' && s.wodId && !s.pointsGiven);
    const missingWod = db.sessions.filter(
      (s) => s.status === 'geplant' && !s.wodId && atTime(s.date, s.startTime) <= addDays(current, 2),
    );
    const newLeads = db.trialRequests.filter((t) => t.status === 'neu');
    const expiring = db.memberships.filter((m) => m.status === 'gekuendigt');

    return {
      memberCount: activeMembers.length,
      paused: members.filter((m) => m.status === 'pausiert').length,
      utilisation: percent(weekBooked, weekCapacity),
      weekBooked,
      weekCapacity,
      revenue,
      openSum,
      openInvoices: openInvoices.length,
      noShowRate: attended + noShows > 0 ? percent(noShows, attended + noShows) : 0,
      todaySessions,
      openPoints,
      missingWod,
      newLeads,
      expiring,
    };
  }, [db, current, todayKey]);

  const tasks = [
    data.openPoints.length > 0 && {
      label: `${data.openPoints.length} Kurse ohne Punktevergabe`,
      to: '/admin/leaderboard',
      tone: 'warning' as const,
    },
    data.missingWod.length > 0 && {
      label: `${data.missingWod.length} anstehende Kurse ohne Workout`,
      to: '/admin/kursplan',
      tone: 'info' as const,
    },
    data.newLeads.length > 0 && {
      label: `${data.newLeads.length} neue Probetrainings-Anfragen`,
      to: '/admin/interessenten',
      tone: 'success' as const,
    },
    data.openInvoices > 0 && {
      label: `${data.openInvoices} offene Rechnungen (${formatCurrency(data.openSum, locale)})`,
      to: '/admin/rechnungen',
      tone: 'danger' as const,
    },
    data.expiring.length > 0 && {
      label: `${data.expiring.length} gekündigte Verträge`,
      to: '/admin/vertraege',
      tone: 'warning' as const,
    },
  ].filter(Boolean) as Array<{ label: string; to: string; tone: 'warning' | 'info' | 'success' | 'danger' }>;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`CrossFit Rheinblick · ${formatDate(current, locale, { weekday: 'long', day: '2-digit', month: 'long' })}`}
        actions={<LinkButton to="/admin/kursplan" variant="primary" size="sm" icon={<CalendarDays size={15} />}>Kursplanung</LinkButton>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Aktive Mitglieder" value={data.memberCount} hint={`${data.paused} pausiert`} icon={<Users size={16} />} />
        <StatTile
          label="Auslastung diese Woche"
          value={`${data.utilisation} %`}
          hint={`${data.weekBooked} von ${data.weekCapacity} Plätzen`}
          tone={data.utilisation > 80 ? 'success' : 'info'}
          icon={<TrendingUp size={16} />}
        />
        <StatTile label="Umsatz laufender Monat" value={formatCurrency(data.revenue, locale)} hint="Beiträge und Shop" tone="success" icon={<Euro size={16} />} />
        <StatTile
          label="Offene Posten"
          value={formatCurrency(data.openSum, locale)}
          hint={`${data.openInvoices} Rechnungen · No-Show-Quote ${data.noShowRate} %`}
          tone={data.openSum > 0 ? 'warning' : 'success'}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <SectionCard title="Kurse heute" action={<Link to="/admin/kursplan" className="text-xs">Kursplan</Link>}>
          {data.todaySessions.length === 0 ? (
            <EmptyState title="Heute keine Kurse" />
          ) : (
            <ul className="flex flex-col">
              {data.todaySessions.map(({ session, template, coach, booked, waitlist, start }) => {
                const running = start <= current && new Date(start.getTime() + session.durationMin * 60_000) >= current;
                return (
                  <li key={session.id} className="flex flex-wrap items-center gap-3 border-b border-line py-2 last:border-0">
                    <span className="font-display text-lg tabular-nums">{session.startTime}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/kurs/${session.id}`} className="text-sm font-semibold no-underline text-ink hover:text-brand">
                        {template.name}
                      </Link>
                      <p className="text-xs text-muted">{coach?.firstName} {coach?.lastName}</p>
                    </div>
                    <div className="w-24">
                      <ProgressBar value={booked} max={session.capacity} />
                      <p className="mt-0.5 text-[0.7rem] tabular-nums text-muted">
                        {booked}/{session.capacity}
                        {waitlist > 0 && ` · ${waitlist} WL`}
                      </p>
                    </div>
                    {session.status === 'abgesagt' ? <Badge tone="danger">Abgesagt</Badge> : running ? <Badge tone="live">Läuft</Badge> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <div>
          <SectionCard title="Zu erledigen" className="mb-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted">Alles erledigt – nichts liegt an.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <li key={task.label}>
                    <Link
                      to={task.to}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm no-underline text-ink hover:border-brand"
                    >
                      <span>{task.label}</span>
                      <Badge tone={task.tone}>offen</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Neue Interessenten" action={<Link to="/admin/interessenten" className="text-xs">Alle</Link>}>
            {data.newLeads.length === 0 ? (
              <p className="text-sm text-muted">Keine offenen Anfragen.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.newLeads.slice(0, 4).map((lead) => (
                  <li key={lead.id} className="flex items-center gap-2 text-sm">
                    <UserPlus size={15} className="text-brand" />
                    <span className="min-w-0 flex-1 truncate">{lead.name}</span>
                    <span className="text-xs text-muted">{formatDate(lead.createdAt, locale, { day: '2-digit', month: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <Card className="mt-4 text-xs text-muted">
        Prototyp mit Beispieldaten: {db.users.filter((u) => u.role === 'member').length} Mitglieder, {db.sessions.length} Kurstermine über
        zwölf Wochen, {db.bookings.length} Buchungen. Alle Zahlen sind erzeugt und ändern sich mit deinen Eingaben.
      </Card>
    </>
  );
}
