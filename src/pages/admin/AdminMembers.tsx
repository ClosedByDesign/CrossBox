import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Plus, UserPlus } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, ProgressBar, SectionCard, StatTile } from '../../components/ui';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Field, Input, Select, Textarea } from '../../components/ui/form';
import { Modal } from '../../components/ui/Modal';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { checkIn } from '../../store/actions';
import { atTime, now, toDateKey, today } from '../../lib/clock';
import { formatCurrency, formatDate, formatTimeRange } from '../../lib/format';
import { MAIN_TENANT_ID } from '../../data/seed/static';
import type { User } from '../../data/types';

interface MemberRow {
  user: User;
  planName: string;
  membershipStatus: string;
  visits: number;
  openCents: number;
}

export function AdminMembers() {
  const db = useDb();
  const navigate = useNavigate();
  const locale = useDemoStore((s) => s.prefs.locale);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'alle' | 'aktiv' | 'pausiert' | 'offen'>('alle');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', planId: 'p-flat' });

  const rows = useMemo<MemberRow[]>(() => {
    const visitCounts = new Map<string, number>();
    db.bookings.forEach((b) => {
      if (b.status === 'anwesend') visitCounts.set(b.userId, (visitCounts.get(b.userId) ?? 0) + 1);
    });
    const openByUser = new Map<string, number>();
    db.invoices.forEach((i) => {
      if (i.status !== 'bezahlt') openByUser.set(i.userId, (openByUser.get(i.userId) ?? 0) + i.amountCents);
    });

    return db.users
      .filter((u) => u.role === 'member' && u.tenantId === MAIN_TENANT_ID)
      .map((user) => {
        const membership = db.memberships.find((m) => m.userId === user.id);
        const plan = db.plans.find((p) => p.id === membership?.planId);
        return {
          user,
          planName: plan?.name ?? '—',
          membershipStatus: membership?.status ?? 'aktiv',
          visits: visitCounts.get(user.id) ?? 0,
          openCents: openByUser.get(user.id) ?? 0,
        };
      });
  }, [db]);

  const filtered = rows.filter((row) => {
    if (filter === 'aktiv') return row.user.status === 'aktiv';
    if (filter === 'pausiert') return row.membershipStatus === 'pausiert';
    if (filter === 'offen') return row.openCents > 0;
    return true;
  });

  const columns: Column<MemberRow>[] = [
    {
      key: 'name',
      header: 'Mitglied',
      value: (row) => `${row.user.firstName} ${row.user.lastName} ${row.user.nickname} ${row.user.email}`,
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <Avatar name={`${row.user.firstName} ${row.user.lastName}`} hue={row.user.avatarHue} size={30} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">
              {row.user.firstName} {row.user.lastName}
            </span>
            <span className="block truncate text-xs text-muted">{row.user.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'plan', header: 'Tarif', value: (row) => row.planName, sortable: true, render: (row) => <span>{row.planName}</span> },
    {
      key: 'status',
      header: 'Vertrag',
      value: (row) => row.membershipStatus,
      sortable: true,
      render: (row) => (
        <Badge tone={row.membershipStatus === 'aktiv' ? 'success' : row.membershipStatus === 'pausiert' ? 'warning' : 'danger'}>
          {row.membershipStatus === 'aktiv' ? 'Aktiv' : row.membershipStatus === 'pausiert' ? 'Pausiert' : 'Gekündigt'}
        </Badge>
      ),
    },
    { key: 'visits', header: 'Besuche', value: (row) => row.visits, sortable: true, render: (row) => <span className="tabular-nums">{row.visits}</span>, hideOnMobile: true },
    {
      key: 'since',
      header: 'Mitglied seit',
      value: (row) => row.user.joinedAt,
      sortable: true,
      render: (row) => <span className="text-muted">{formatDate(row.user.joinedAt, locale, { month: '2-digit', year: 'numeric' })}</span>,
      hideOnMobile: true,
    },
    {
      key: 'open',
      header: 'Offen',
      value: (row) => row.openCents,
      sortable: true,
      render: (row) =>
        row.openCents > 0 ? <span className="font-semibold text-warning tabular-nums">{formatCurrency(row.openCents, locale)}</span> : <span className="text-muted">–</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Mitglieder"
        subtitle={`${rows.length} Mitglieder · ${rows.filter((r) => r.openCents > 0).length} mit offenen Beträgen`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Mitglied anlegen
          </Button>
        }
      />

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(row) => row.user.id}
        onRowClick={(row) => navigate(`/admin/mitglieder/${row.user.id}`)}
        searchPlaceholder="Name oder E-Mail suchen …"
        initialSort={{ key: 'name', dir: 'asc' }}
        toolbar={
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-auto">
            <option value="alle">Alle</option>
            <option value="aktiv">Nur aktive</option>
            <option value="pausiert">Pausiert</option>
            <option value="offen">Mit offenen Beträgen</option>
          </Select>
        }
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Mitglied anlegen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.firstName || !form.lastName) {
                  toast('Bitte Vor- und Nachnamen angeben.', 'warning');
                  return;
                }
                toast(`${form.firstName} ${form.lastName} wurde angelegt und erhält eine Einladung per E-Mail.`);
                setCreateOpen(false);
                setForm({ firstName: '', lastName: '', email: '', planId: 'p-flat' });
              }}
            >
              Anlegen
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vorname" htmlFor="first">
            <Input id="first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Nachname" htmlFor="last">
            <Input id="last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="E-Mail" htmlFor="mail">
          <Input id="mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Tarif" htmlFor="plan">
          <Select id="plan" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            {db.plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {formatCurrency(plan.priceCents, locale)}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </>
  );
}

const memberTabs: TabDef[] = [
  { key: 'uebersicht', label: 'Übersicht' },
  { key: 'vertrag', label: 'Vertrag' },
  { key: 'rechnungen', label: 'Rechnungen' },
  { key: 'besuche', label: 'Besuche' },
  { key: 'training', label: 'Training' },
  { key: 'notizen', label: 'Notizen' },
];

export function AdminMemberDetail() {
  const { memberId } = useParams();
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const active = useActiveTab(memberTabs);
  const [note, setNote] = useState('');

  const user = db.users.find((u) => u.id === memberId);

  const data = useMemo(() => {
    if (!user) return null;
    const membership = db.memberships.find((m) => m.userId === user.id);
    const plan = db.plans.find((p) => p.id === membership?.planId);
    const invoices = db.invoices.filter((i) => i.userId === user.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const bookings = db.bookings
      .filter((b) => b.userId === user.id)
      .map((booking) => ({ booking, session: db.sessions.find((s) => s.id === booking.sessionId) }))
      .filter((entry) => entry.session)
      .sort((a, b) => (b.session!.date ?? '').localeCompare(a.session!.date ?? ''));
    const visits = bookings.filter((b) => b.booking.status === 'anwesend');
    const noShows = bookings.filter((b) => b.booking.status === 'no-show');
    const points = db.leaderboard.filter((e) => e.userId === user.id).reduce((sum, e) => sum + e.points, 0);
    const prs = db.lifts
      .map((lift) => ({
        lift,
        best: db.personalRecords.filter((r) => r.userId === user.id && r.liftId === lift.id).reduce((max, r) => Math.max(max, r.valueKg), 0),
      }))
      .filter((entry) => entry.best > 0);
    const openSum = invoices.filter((i) => i.status !== 'bezahlt').reduce((sum, i) => sum + i.amountCents, 0);
    return { membership, plan, invoices, bookings, visits, noShows, points, prs, openSum };
  }, [db, user]);

  if (!user || !data) return <EmptyState title="Mitglied nicht gefunden" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: '/admin/mitglieder', label: 'Zurück zur Mitgliederliste' }}
        title={`${user.firstName} ${user.lastName}`}
        subtitle={`@${user.nickname} · ${user.email}${user.phone ? ` · ${user.phone}` : ''}`}
        actions={
          <Badge tone={user.status === 'aktiv' ? 'success' : user.status === 'pausiert' ? 'warning' : 'danger'}>{user.status}</Badge>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatTile label="Besuche" value={data.visits.length} />
        <StatTile label="No-Shows" value={data.noShows.length} tone={data.noShows.length > 3 ? 'warning' : 'info'} />
        <StatTile label="Punkte" value={data.points} tone="brand" />
        <StatTile label="Offen" value={formatCurrency(data.openSum, locale)} tone={data.openSum > 0 ? 'warning' : 'success'} />
      </div>

      <Tabs tabs={memberTabs} />

      {active === 'uebersicht' && (
        <SectionCard title="Stammdaten">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Mitglied seit</dt>
              <dd>{formatDate(user.joinedAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Tarif</dt>
              <dd>{data.plan?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">E-Mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Telefon</dt>
              <dd>{user.phone ?? 'nicht hinterlegt'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted">Notfallkontakt</dt>
              <dd>{user.emergencyContact ?? 'nicht hinterlegt'}</dd>
            </div>
          </dl>
        </SectionCard>
      )}

      {active === 'vertrag' && (
        <SectionCard title="Vertrag">
          {data.membership && data.plan ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-xl">{data.plan.name}</p>
                  <p className="text-xs text-muted">
                    seit {formatDate(data.membership.startedAt, locale)}
                    {data.membership.endsAt ? ` · endet ${formatDate(data.membership.endsAt, locale)}` : ''}
                  </p>
                </div>
                <p className="font-display text-xl text-brand">{formatCurrency(data.plan.priceCents, locale)}</p>
              </div>
              {data.plan.sessionsPerMonth != null && (
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Kontingent</span>
                    <span>
                      {data.membership.usedThisMonth} / {data.plan.sessionsPerMonth}
                    </span>
                  </div>
                  <ProgressBar value={data.membership.usedThisMonth} max={data.plan.sessionsPerMonth} />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Select
                  value={data.membership.planId}
                  onChange={(e) => {
                    updateEntity('memberships', data.membership!.id, { planId: e.target.value });
                    toast('Tarif geändert.');
                  }}
                  className="w-auto"
                >
                  {db.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const next = data.membership!.status === 'pausiert' ? 'aktiv' : 'pausiert';
                    updateEntity('memberships', data.membership!.id, { status: next });
                    toast(next === 'pausiert' ? 'Vertrag pausiert.' : 'Vertrag reaktiviert.', 'info');
                  }}
                >
                  {data.membership.status === 'pausiert' ? 'Pause beenden' : 'Pausieren'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    updateEntity('memberships', data.membership!.id, { status: 'gekuendigt' });
                    toast('Vertrag gekündigt.', 'info');
                  }}
                >
                  Kündigen
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Kein Vertrag hinterlegt.</p>
          )}
        </SectionCard>
      )}

      {active === 'rechnungen' && (
        <SectionCard title={`Rechnungen (${data.invoices.length})`}>
          <ul>
            {data.invoices.slice(0, 12).map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <span className="text-sm">
                  {invoice.periodLabel}
                  <span className="block text-xs text-muted">Nr. {invoice.number}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone={invoice.status === 'bezahlt' ? 'success' : invoice.status === 'offen' ? 'warning' : 'danger'}>
                    {invoice.status}
                  </Badge>
                  <span className="w-20 text-right tabular-nums">{formatCurrency(invoice.amountCents, locale)}</span>
                  {invoice.status !== 'bezahlt' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        updateEntity('invoices', invoice.id, { status: 'bezahlt' });
                        toast('Zahlung erfasst.');
                      }}
                    >
                      Als bezahlt
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {active === 'besuche' && (
        <SectionCard title="Besuchshistorie">
          <ul>
            {data.bookings.slice(0, 20).map(({ booking, session }) => {
              const template = db.courseTemplates.find((t) => t.id === session!.templateId);
              return (
                <li key={booking.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                  <span className="text-sm">
                    {template?.name}
                    <span className="block text-xs text-muted">
                      {formatDate(session!.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} ·{' '}
                      {session!.startTime}
                    </span>
                  </span>
                  <Badge
                    tone={
                      booking.status === 'anwesend'
                        ? 'success'
                        : booking.status === 'no-show'
                          ? 'danger'
                          : booking.status === 'storniert'
                            ? 'neutral'
                            : 'info'
                    }
                  >
                    {booking.status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {active === 'training' && (
        <>
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
          <SectionCard title="Punkte">
            <p className="font-display text-3xl text-brand">{data.points}</p>
            <p className="text-xs text-muted">Summe aller vergebenen Punkte in der laufenden Saison</p>
          </SectionCard>
        </>
      )}

      {active === 'notizen' && (
        <SectionCard title="Interne Notizen" description="Nur für die Boxleitung sichtbar">
          <Field label="Neue Notiz" htmlFor="note">
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Knieprobleme, Übungen anpassen" />
          </Field>
          <Button
            variant="primary"
            onClick={() => {
              if (!note.trim()) return;
              toast('Notiz gespeichert.');
              setNote('');
            }}
          >
            Notiz speichern
          </Button>
        </SectionCard>
      )}
    </div>
  );
}

/* --------------------------------------------------- Interessenten */

export function AdminLeads() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);

  const leads = [...db.trialRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const columns = [
    { key: 'neu', label: 'Neu' },
    { key: 'kontaktiert', label: 'Kontaktiert' },
    { key: 'erledigt', label: 'Erledigt' },
  ] as const;

  return (
    <>
      <PageHeader title="Interessenten" subtitle="Anfragen für ein Probetraining" />
      {leads.length === 0 ? (
        <EmptyState icon={<UserPlus size={28} />} title="Keine Anfragen" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {columns.map((column) => {
            const items = leads.filter((lead) => lead.status === column.key);
            return (
              <div key={column.key}>
                <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                  {column.label}
                  <span className="rounded-full bg-elevated px-2 py-0.5">{items.length}</span>
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((lead) => (
                    <Card key={lead.id}>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-xs text-muted">{lead.email}</p>
                      {lead.phone && <p className="text-xs text-muted">{lead.phone}</p>}
                      {lead.preferredDate && (
                        <p className="mt-1 text-xs">
                          Wunschtermin: <strong>{formatDate(lead.preferredDate, locale)}</strong>
                        </p>
                      )}
                      {lead.message && <p className="mt-1 text-sm text-muted">{lead.message}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {lead.status !== 'kontaktiert' && lead.status !== 'erledigt' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              updateEntity('trialRequests', lead.id, { status: 'kontaktiert' });
                              toast(`${lead.name} als kontaktiert markiert.`);
                            }}
                          >
                            Kontaktiert
                          </Button>
                        )}
                        {lead.status !== 'erledigt' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              updateEntity('trialRequests', lead.id, { status: 'erledigt' });
                              toast(`${lead.name} zu Mitglied umgewandelt.`);
                            }}
                          >
                            Zu Mitglied
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 && <p className="text-xs text-muted">–</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------ Anwesenheit */

export function AdminAttendance() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = now();
  const todayKey = toDateKey(today());

  const sessions = db.sessions
    .filter((s) => s.date === todayKey && s.status !== 'abgesagt')
    .map((session) => {
      const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
      const bookings = db.bookings
        .filter((b) => b.sessionId === session.id && b.status !== 'storniert' && b.status !== 'warteliste')
        .map((booking) => ({ booking, user: db.users.find((u) => u.id === booking.userId)! }))
        .filter((entry) => entry.user);
      return { session, template, bookings, start: atTime(session.date, session.startTime) };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const totalPresent = sessions.reduce((sum, s) => sum + s.bookings.filter((b) => b.booking.status === 'anwesend').length, 0);
  const totalBooked = sessions.reduce((sum, s) => sum + s.bookings.length, 0);

  return (
    <>
      <PageHeader
        title="Anwesenheit"
        subtitle={formatDate(current, locale, { weekday: 'long', day: '2-digit', month: 'long' })}
        actions={<Badge tone="brand">{totalPresent} von {totalBooked} eingecheckt</Badge>}
      />

      {sessions.length === 0 ? (
        <EmptyState title="Heute keine Kurse" />
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map(({ session, template, bookings, start }) => {
            const present = bookings.filter((b) => b.booking.status === 'anwesend').length;
            const running = start <= current && new Date(start.getTime() + session.durationMin * 60_000) >= current;
            return (
              <SectionCard
                key={session.id}
                title={
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{session.startTime}</span> {template.name}
                    {running && <Badge tone="live">Läuft</Badge>}
                  </span>
                }
                description={`${formatTimeRange(session.startTime, session.durationMin)} Uhr · ${present}/${bookings.length} anwesend`}
              >
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted">Keine Anmeldungen.</p>
                ) : (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {bookings.map(({ booking, user }) => (
                      <li key={booking.id} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5">
                        <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={26} />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {user.firstName} {user.lastName}
                        </span>
                        {booking.status === 'anwesend' ? (
                          <CheckCircle2 size={16} className="text-success" />
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => { checkIn(session.id, user.id, 'trainer'); toast(`${user.firstName} eingecheckt.`); }}>
                            Check-in
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}
    </>
  );
}
