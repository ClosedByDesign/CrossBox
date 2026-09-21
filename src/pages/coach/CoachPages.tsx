import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Monitor, Trophy, UserX } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Avatar, Badge, Button, Card, EmptyState, LinkButton, PageHeader, ProgressBar, SectionCard, StatTile } from '../../components/ui';
import { Field, Input, Select } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { WeekGrid } from '../../components/schedule/WeekGrid';
import { SessionRow } from '../../components/schedule/SessionRow';
import { emptyFilters, groupByDay, useSession, useWeekSessions } from '../../components/schedule/useSchedule';
import { useDb, useDemoStore } from '../../store';
import { assignWod, awardPoints, cancelSession, checkIn, setAttendance } from '../../store/actions';
import { addDays, atTime, isoWeekNumber, now, startOfWeek, toDateKey, today } from '../../lib/clock';
import { formatDate, formatTimeRange } from '../../lib/format';
import type { User } from '../../data/types';

/* ------------------------------------------------------------ Dashboard */

export function CoachDashboard() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = now();
  const todayKey = toDateKey(today());

  const data = useMemo(() => {
    const mine = db.sessions.filter((s) => s.coachId === userId);
    const todaySessions = mine
      .filter((s) => s.date === todayKey)
      .map((session) => {
        const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
        const bookings = db.bookings.filter((b) => b.sessionId === session.id);
        const booked = bookings.filter((b) => b.status === 'gebucht' || b.status === 'anwesend').length;
        const checked = bookings.filter((b) => b.status === 'anwesend').length;
        return { session, template, booked, checked };
      })
      .sort((a, b) => a.session.startTime.localeCompare(b.session.startTime));

    const openPoints = mine
      .filter((s) => s.status === 'vorbei' && s.wodId && !s.pointsGiven)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((session) => ({ session, template: db.courseTemplates.find((t) => t.id === session.templateId)! }));

    const missingWod = mine
      .filter((s) => s.status === 'geplant' && !s.wodId && atTime(s.date, s.startTime) <= addDays(current, 2))
      .slice(0, 5)
      .map((session) => ({ session, template: db.courseTemplates.find((t) => t.id === session.templateId)! }));

    const weekCount = mine.filter((s) => {
      const start = startOfWeek(current);
      return s.date >= toDateKey(start) && s.date <= toDateKey(addDays(start, 6));
    }).length;

    return { todaySessions, openPoints, missingWod, weekCount };
  }, [db, userId, todayKey, current]);

  const user = db.users.find((u) => u.id === userId);

  return (
    <>
      <PageHeader
        title={`Hallo ${user?.firstName ?? ''}`}
        subtitle={formatDate(current, locale, { weekday: 'long', day: '2-digit', month: 'long' })}
        actions={<LinkButton to="/coach/kursplan" variant="primary" size="sm" icon={<CalendarDays size={15} />}>Kursplan</LinkButton>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="Kurse heute" value={data.todaySessions.length} hint={`${data.weekCount} Kurse diese Woche`} />
        <StatTile label="Punkte offen" value={data.openPoints.length} tone="warning" hint="Kurse ohne Wertung" icon={<Trophy size={16} />} />
        <StatTile label="WOD fehlt" value={data.missingWod.length} tone="info" hint="Kurse in den nächsten 2 Tagen" />
      </div>

      <SectionCard title="Deine Kurse heute" className="mb-4">
        {data.todaySessions.length === 0 ? (
          <p className="text-sm text-muted">Heute stehen keine Kurse für dich an.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.todaySessions.map(({ session, template, booked, checked }) => (
              <li key={session.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <span className="font-display text-xl tabular-nums">{session.startTime}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-xs text-muted">
                    {formatTimeRange(session.startTime, session.durationMin)} · {booked} angemeldet · {checked} eingecheckt
                  </p>
                  <div className="mt-1.5 max-w-[12rem]">
                    <ProgressBar value={booked} max={session.capacity} />
                  </div>
                </div>
                <LinkButton to={`/coach/kurs/${session.id}`} variant="secondary" size="sm">
                  Kurs öffnen
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Punkte vergeben">
          {data.openPoints.length === 0 ? (
            <p className="text-sm text-muted">Für alle deine Kurse sind Punkte vergeben.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.openPoints.map(({ session, template }) => (
                <li key={session.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm">
                    {template.name} · {formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </span>
                  <Link to={`/coach/kurs/${session.id}?tab=punkte`} className="text-xs">
                    Punkte eintragen →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="WOD fehlt noch">
          {data.missingWod.length === 0 ? (
            <p className="text-sm text-muted">Alle anstehenden Kurse haben ein Workout.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.missingWod.map(({ session, template }) => (
                <li key={session.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm">
                    {template.name} · {formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </span>
                  <Link to={`/coach/kurs/${session.id}`} className="text-xs">
                    WOD zuweisen →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}

/* --------------------------------------------------------- Kursplan */

export function CoachSchedule() {
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const [weekOffset, setWeekOffset] = useState(0);
  const [onlyMine, setOnlyMine] = useState(true);

  const weekStart = useMemo(() => addDays(startOfWeek(today()), weekOffset * 7), [weekOffset]);
  const all = useWeekSessions(weekStart, emptyFilters);
  const sessions = onlyMine ? all.filter((entry) => entry.session.coachId === userId) : all;

  const [selectedDay, setSelectedDay] = useState(toDateKey(today()));
  const daysInWeek = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));
  const activeDay = daysInWeek.includes(selectedDay) ? selectedDay : daysInWeek[0];
  const daySessions = groupByDay(sessions).get(activeDay) ?? [];

  return (
    <>
      <PageHeader
        title="Kursplan"
        subtitle={`KW ${isoWeekNumber(weekStart)} · ${formatDate(weekStart, locale, { day: '2-digit', month: 'short' })} – ${formatDate(addDays(weekStart, 6), locale, { day: '2-digit', month: 'short' })}`}
        actions={
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setWeekOffset((w) => w - 1)} icon={<ChevronLeft size={15} />} aria-label="Vorherige Woche" />
            <Button size="sm" variant={weekOffset === 0 ? 'primary' : 'secondary'} onClick={() => setWeekOffset(0)}>
              Heute
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setWeekOffset((w) => w + 1)} icon={<ChevronRight size={15} />} aria-label="Nächste Woche" />
            <Button size="sm" variant={onlyMine ? 'primary' : 'secondary'} onClick={() => setOnlyMine((v) => !v)}>
              Nur meine Kurse
            </Button>
          </div>
        }
      />

      <div className="hidden md:block">
        <WeekGrid weekStart={weekStart} sessions={sessions} linkBase="/coach/kurs" />
      </div>
      <div className="md:hidden">
        <div className="mb-3 flex gap-1 overflow-x-auto">
          {daysInWeek.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                'min-w-[2.6rem] flex-1 rounded-xl border px-1 py-2 text-center',
                day === activeDay ? 'border-brand bg-brand/15 text-brand' : 'border-line',
              )}
            >
              <span className="block text-[0.65rem] uppercase">{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}</span>
              <span className="block font-display text-lg leading-none">{Number(day.slice(-2))}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {daySessions.length === 0 ? (
            <EmptyState title="Keine Kurse an diesem Tag" />
          ) : (
            daySessions.map((entry) => <SessionRow key={entry.session.id} entry={entry} to={`/coach/kurs/${entry.session.id}`} />)
          )}
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------- Kursdetail für Trainer */

export function CoachSessionDetail({ basePath = '/coach' }: { basePath?: string }) {
  const { sessionId } = useParams();
  const data = useSession(sessionId);
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const navigate = useNavigate();
  const [points, setPoints] = useState<Record<string, string>>({});
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Trainer krank');

  if (!data) return <EmptyState title="Kurs nicht gefunden" />;
  const { session, template, coach, bookings, wod, bookedCount, waitlistCount } = data;
  const season = db.seasons.find((s) => s.active);

  const participants = bookings
    .filter((b) => b.status !== 'storniert' && b.status !== 'warteliste')
    .map((booking) => ({ booking, user: db.users.find((u) => u.id === booking.userId)! }))
    .filter((entry) => entry.user)
    .sort((a, b) => a.user.firstName.localeCompare(b.user.firstName));

  const waitlist = bookings
    .filter((b) => b.status === 'warteliste')
    .map((booking) => ({ booking, user: db.users.find((u) => u.id === booking.userId)! }))
    .filter((entry) => entry.user);

  const existingPoints = new Map(db.leaderboard.filter((e) => e.sessionId === session.id).map((e) => [e.userId, e.points]));
  const isPast = session.status === 'vorbei';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: `${basePath}/kursplan`, label: 'Zurück zum Kursplan' }}
        title={template.name}
        subtitle={`${formatDate(session.date, locale, { weekday: 'long', day: '2-digit', month: 'long' })} · ${formatTimeRange(session.startTime, session.durationMin)} Uhr · ${coach?.firstName ?? ''} ${coach?.lastName ?? ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton to={`/tv/kurs/${session.id}`} variant="secondary" size="sm" icon={<Monitor size={15} />} target="_blank">
              Beamer
            </LinkButton>
            {session.status !== 'abgesagt' && !isPast && (
              <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
                Kurs absagen
              </Button>
            )}
          </div>
        }
      />

      {session.status === 'abgesagt' && (
        <Card className="mb-4 border-danger/50 bg-danger/10">
          <p className="text-sm font-semibold text-danger">Abgesagt: {session.cancelReason}</p>
        </Card>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Angemeldet" value={`${bookedCount}/${session.capacity}`} />
        <StatTile label="Eingecheckt" value={participants.filter((p) => p.booking.status === 'anwesend').length} tone="success" />
        <StatTile label="Warteliste" value={waitlistCount} tone={waitlistCount > 0 ? 'warning' : 'info'} />
      </div>

      <SectionCard
        title="Workout"
        className="mb-4"
        action={
          <Select
            value={session.wodId ?? ''}
            onChange={(e) => {
              assignWod(session.id, e.target.value || null);
              toast(e.target.value ? 'WOD zugewiesen.' : 'WOD entfernt.');
            }}
            className="w-auto text-xs"
          >
            <option value="">Kein WOD</option>
            {db.wods.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        }
      >
        {wod ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg">{wod.name}</span>
              <Badge tone="brand">{wod.kind}</Badge>
              {wod.capMinutes && <Badge>{wod.capMinutes} Min</Badge>}
            </div>
            {wod.blocks.map((block) => (
              <div key={block.label} className="rounded-lg bg-elevated px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">{block.label}</p>
                {block.lines.map((line) => (
                  <p key={line} className="text-sm">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Noch kein Workout zugewiesen" description="Wähle oben eine Vorlage aus der Bibliothek." />
        )}
      </SectionCard>

      <SectionCard
        title={`Teilnehmer (${participants.length})`}
        className="mb-4"
        action={
          !isPast && participants.length > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                participants.forEach((entry) => checkIn(session.id, entry.user.id, 'trainer'));
                toast('Alle als anwesend markiert.');
              }}
            >
              Alle anwesend
            </Button>
          ) : undefined
        }
      >
        {participants.length === 0 ? (
          <p className="text-sm text-muted">Noch niemand angemeldet.</p>
        ) : (
          <ul className="flex flex-col">
            {participants.map(({ booking, user }) => (
              <li key={booking.id} className="flex flex-wrap items-center gap-3 border-b border-line py-2 last:border-0">
                <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={32} />
                <Link to={`${basePath}/athleten/${user.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold no-underline text-ink hover:text-brand">
                  {user.firstName} {user.lastName}
                </Link>
                {booking.status === 'anwesend' && <Badge tone="success"><CheckCircle2 size={12} /> Da</Badge>}
                {booking.status === 'no-show' && <Badge tone="danger"><UserX size={12} /> Fehlt</Badge>}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={booking.status === 'anwesend' ? 'success' : 'secondary'}
                    onClick={() => checkIn(session.id, user.id, 'trainer')}
                  >
                    Anwesend
                  </Button>
                  <Button
                    size="sm"
                    variant={booking.status === 'no-show' ? 'danger' : 'secondary'}
                    onClick={() => {
                      setAttendance(booking.id, 'no-show');
                      toast(`${user.firstName} als nicht erschienen markiert.`, 'info');
                    }}
                  >
                    Fehlt
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {waitlist.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="label-base">Warteliste</p>
            <ul className="flex flex-col gap-1">
              {waitlist.map(({ booking, user }, index) => (
                <li key={booking.id} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-muted tabular-nums">{index + 1}.</span>
                  <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={22} />
                  <span className="flex-1">
                    {user.firstName} {user.lastName}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => { setAttendance(booking.id, 'gebucht'); toast(`${user.firstName} nachgerückt.`); }}>
                    Nachrücken
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {isPast && (
        <SectionCard
          title="Punkte vergeben"
          description={session.pointsGiven ? 'Punkte sind bereits vergeben – Korrekturen sind möglich.' : 'Trag für jede Person einen Wert ein.'}
          className="mb-4"
        >
          {participants.length === 0 ? (
            <p className="text-sm text-muted">Für diesen Kurs gibt es keine Teilnehmer.</p>
          ) : (
            <>
              <ul className="flex flex-col">
                {participants.map(({ booking, user }) => (
                  <li key={booking.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                    <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 text-center"
                      value={points[user.id] ?? String(existingPoints.get(user.id) ?? '')}
                      onChange={(e) => setPoints({ ...points, [user.id]: e.target.value })}
                      aria-label={`Punkte für ${user.firstName}`}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    const payload: Record<string, number> = {};
                    participants.forEach(({ user }) => {
                      const raw = points[user.id] ?? existingPoints.get(user.id);
                      const value = Number(raw);
                      if (raw !== undefined && raw !== '' && !Number.isNaN(value)) payload[user.id] = value;
                    });
                    if (Object.keys(payload).length === 0) {
                      toast('Bitte mindestens einen Wert eintragen.', 'warning');
                      return;
                    }
                    awardPoints(session.id, payload, season?.id ?? 'season-current', session.tenantId);
                    toast(`Punkte für ${Object.keys(payload).length} Teilnehmer gespeichert.`);
                    navigate(basePath);
                  }}
                >
                  Punkte speichern
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const filled: Record<string, string> = {};
                    participants.forEach(({ user }, index) => {
                      filled[user.id] = String(25 - Math.min(20, index));
                    });
                    setPoints(filled);
                  }}
                >
                  Nach Reihenfolge vorbelegen
                </Button>
              </div>
            </>
          )}
        </SectionCard>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Kurs absagen?"
        description={
          <div>
            <p className="mb-3 text-sm text-muted">
              Alle {bookedCount} angemeldeten Personen werden benachrichtigt. Die Einheit wird niemandem angerechnet.
            </p>
            <Field label="Grund" htmlFor="cancel-reason">
              <Input id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </Field>
          </div>
        }
        confirmLabel="Kurs absagen"
        tone="danger"
        onConfirm={() => {
          cancelSession(session.id, cancelReason);
          toast('Kurs abgesagt – alle Teilnehmer wurden benachrichtigt.', 'info');
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Athleten */

export function CoachAthletes({ basePath = '/coach' }: { basePath?: string }) {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const navigate = useNavigate();

  const athletes = useMemo(() => {
    const mySessions = new Set(db.sessions.filter((s) => s.coachId === userId).map((s) => s.id));
    const counts = new Map<string, number>();
    db.bookings.forEach((booking) => {
      if (!mySessions.has(booking.sessionId)) return;
      if (booking.status !== 'anwesend' && booking.status !== 'gebucht') return;
      counts.set(booking.userId, (counts.get(booking.userId) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([id, visits]) => ({ user: db.users.find((u) => u.id === id), visits }))
      .filter((entry): entry is { user: User; visits: number } => !!entry.user)
      .sort((a, b) => b.visits - a.visits);
  }, [db, userId]);

  const columns: Column<{ user: User; visits: number }>[] = [
    {
      key: 'name',
      header: 'Name',
      value: (row) => `${row.user.firstName} ${row.user.lastName} ${row.user.nickname}`,
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <Avatar name={`${row.user.firstName} ${row.user.lastName}`} hue={row.user.avatarHue} size={28} />
          <span>
            {row.user.firstName} {row.user.lastName}
          </span>
        </span>
      ),
    },
    { key: 'nickname', header: 'Nickname', value: (row) => row.user.nickname, render: (row) => <span className="text-muted">@{row.user.nickname}</span>, hideOnMobile: true },
    { key: 'visits', header: 'Besuche bei dir', value: (row) => row.visits, sortable: true, render: (row) => <span className="tabular-nums">{row.visits}</span> },
    {
      key: 'status',
      header: 'Status',
      value: (row) => row.user.status,
      render: (row) => <Badge tone={row.user.status === 'aktiv' ? 'success' : 'warning'}>{row.user.status}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Athleten" subtitle="Alle Mitglieder, die in deinen Kursen trainieren" />
      <DataTable
        rows={athletes}
        columns={columns}
        rowKey={(row) => row.user.id}
        onRowClick={(row) => navigate(`${basePath}/athleten/${row.user.id}`)}
        searchPlaceholder="Athlet suchen …"
        initialSort={{ key: 'visits', dir: 'desc' }}
      />
      <p className="mt-3 text-xs text-muted">
        Als Trainer siehst du Trainingsdaten – Verträge, Rechnungen und Stammdaten bleiben der Boxleitung vorbehalten.
      </p>
    </>
  );
}

export function CoachAthleteDetail({ basePath = '/coach' }: { basePath?: string }) {
  const { athleteId } = useParams();
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const user = db.users.find((u) => u.id === athleteId);

  const data = useMemo(() => {
    if (!user) return null;
    const visits = db.bookings.filter((b) => b.userId === user.id && b.status === 'anwesend');
    const results = db.results
      .filter((r) => r.userId === user.id)
      .map((result) => ({ result, session: db.sessions.find((s) => s.id === result.sessionId), wod: db.wods.find((w) => w.id === result.wodId) }))
      .sort((a, b) => (b.session?.date ?? '').localeCompare(a.session?.date ?? ''))
      .slice(0, 8);
    const prs = db.lifts
      .map((lift) => {
        const best = db.personalRecords.filter((r) => r.userId === user.id && r.liftId === lift.id).reduce((max, r) => Math.max(max, r.valueKg), 0);
        return { lift, best };
      })
      .filter((entry) => entry.best > 0);
    const points = db.leaderboard.filter((e) => e.userId === user.id).reduce((sum, e) => sum + e.points, 0);
    return { visits, results, prs, points };
  }, [db, user]);

  if (!user || !data) return <EmptyState title="Athlet nicht gefunden" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        back={{ to: `${basePath}/athleten`, label: 'Zurück zu den Athleten' }}
        title={`${user.firstName} ${user.lastName}`}
        subtitle={`@${user.nickname} · Mitglied seit ${formatDate(user.joinedAt, locale, { month: 'long', year: 'numeric' })}`}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Trainings" value={data.visits.length} />
        <StatTile label="Punkte" value={data.points} tone="brand" />
        <StatTile label="Rekorde erfasst" value={data.prs.length} tone="info" />
      </div>

      <SectionCard title="Persönliche Rekorde" className="mb-4">
        {data.prs.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Rekorde erfasst.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.prs.map(({ lift, best }) => (
              <div key={lift.id} className="rounded-lg bg-elevated px-2 py-2 text-center">
                <p className="text-xs text-muted">{lift.name}</p>
                <p className="font-display text-lg tabular-nums">{best} kg</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Letzte Ergebnisse">
        {data.results.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Ergebnisse eingetragen.</p>
        ) : (
          <ul className="flex flex-col">
            {data.results.map(({ result, session, wod }) => (
              <li key={result.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                <span className="text-sm">
                  {wod?.name ?? 'Workout'}
                  <span className="block text-xs text-muted">{session ? formatDate(session.date, locale) : ''}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={result.rx ? 'brand' : 'neutral'}>{result.rx ? 'RX' : 'Scaled'}</Badge>
                  <span className="font-display tabular-nums">{result.display}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
