import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, LifeBuoy, LogIn, Plus } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SectionCard, StatTile } from '../../components/ui';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Field, Input, Select, Switch, Textarea } from '../../components/ui/form';
import { Modal } from '../../components/ui/Modal';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { ColumnChart, TrendChart } from '../../components/charts/Charts';
import { useDb, useDemoStore } from '../../store';
import { now } from '../../lib/clock';
import { formatCurrency, formatDate } from '../../lib/format';
import type { PlatformInvoice, Tenant } from '../../data/types';

function usePlatformNumbers() {
  const db = useDb();
  return useMemo(() => {
    const active = db.tenants.filter((t) => t.status === 'aktiv');
    const mrr = active.reduce((sum, tenant) => {
      const plan = db.platformPlans.find((p) => p.id === tenant.platformPlanId);
      return sum + (plan?.priceCents ?? 0);
    }, 0);
    const memberTotal = db.users.filter((u) => u.role === 'member').length;
    const openInvoices = db.platformInvoices.filter((i) => i.status !== 'bezahlt');
    const openTickets = db.supportTickets.filter((t) => t.status !== 'geschlossen');
    return { active, mrr, memberTotal, openInvoices, openTickets };
  }, [db]);
}

export function PlatformDashboard() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const navigate = useNavigate();
  const { active, mrr, memberTotal, openInvoices, openTickets } = usePlatformNumbers();
  const current = now();

  const revenue = useMemo(() => {
    const months: Array<{ monat: string; umsatz: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const sum = db.platformInvoices
        .filter((invoice) => {
          const date = new Date(invoice.issuedAt);
          return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
        })
        .reduce((total, invoice) => total + invoice.amountCents, 0);
      months.push({ monat: month.toLocaleDateString('de-DE', { month: 'short' }), umsatz: Math.round(sum / 100) });
    }
    return months;
  }, [db, current]);

  return (
    <>
      <PageHeader
        title="Plattform"
        subtitle="Überblick über alle Boxen auf BoxFlow"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => navigate('/platform/mandanten')}>
            Box anlegen
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Aktive Boxen" value={active.length} hint={`${db.tenants.length} insgesamt`} icon={<Building2 size={16} />} />
        <StatTile label="Monatlich wiederkehrend" value={formatCurrency(mrr, locale)} tone="success" />
        <StatTile label="Mitglieder gesamt" value={memberTotal} hint="über alle Boxen" tone="info" />
        <StatTile
          label="Offene Posten"
          value={formatCurrency(openInvoices.reduce((s, i) => s + i.amountCents, 0), locale)}
          hint={`${openTickets.length} offene Tickets`}
          tone={openInvoices.length > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Plattform-Umsatz" description="Abrechnung der Boxen, in Euro">
          <ColumnChart data={revenue} xKey="monat" yKey="umsatz" unit="€" highlightIndex={revenue.length - 1} />
        </SectionCard>

        <SectionCard title="Boxen" action={<Button size="sm" variant="ghost" onClick={() => navigate('/platform/mandanten')}>Alle</Button>}>
          <ul className="flex flex-col">
            {db.tenants.map((tenant) => {
              const plan = db.platformPlans.find((p) => p.id === tenant.platformPlanId);
              const members = db.users.filter((u) => u.tenantId === tenant.id && u.role === 'member').length;
              return (
                <li key={tenant.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated font-display text-xs">
                    {tenant.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{tenant.name}</p>
                    <p className="text-xs text-muted">
                      {tenant.city} · {plan?.name} · {members > 0 ? `${members} Mitglieder` : `${tenant.memberCount ?? 0} Mitglieder`}
                    </p>
                  </div>
                  <Badge tone={tenant.status === 'aktiv' ? 'success' : 'neutral'}>{tenant.status}</Badge>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      {openTickets.length > 0 && (
        <SectionCard title="Offene Support-Anfragen" className="mt-4" action={<Button size="sm" variant="ghost" onClick={() => navigate('/platform/support')}>Alle</Button>}>
          <ul className="flex flex-col gap-2">
            {openTickets.slice(0, 4).map((ticket) => {
              const tenant = db.tenants.find((t) => t.id === ticket.tenantId);
              return (
                <li key={ticket.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <LifeBuoy size={13} className="mr-1.5 inline text-brand" />
                    {ticket.subject}
                    <span className="ml-2 text-xs text-muted">{tenant?.name}</span>
                  </span>
                  <Badge tone={ticket.priority === 'hoch' ? 'danger' : 'warning'}>{ticket.priority}</Badge>
                  <span className="text-xs text-muted">{formatDate(ticket.createdAt, locale, { day: '2-digit', month: '2-digit' })}</span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </>
  );
}

export function PlatformTenants() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const navigate = useNavigate();
  const createEntity = useDemoStore((s) => s.createEntity);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', email: '', planId: 'pp-pro' });

  const rows = db.tenants;

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Box',
      value: (row) => `${row.name} ${row.city}`,
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated font-display text-[0.7rem]">{row.initials}</span>
          <span>
            <span className="block font-semibold">{row.name}</span>
            <span className="block text-xs text-muted">{row.city}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'plan',
      header: 'Tarif',
      value: (row) => db.platformPlans.find((p) => p.id === row.platformPlanId)?.name ?? '',
      sortable: true,
      render: (row) => <Badge tone="info">{db.platformPlans.find((p) => p.id === row.platformPlanId)?.name}</Badge>,
    },
    {
      key: 'members',
      header: 'Mitglieder',
      value: (row) => db.users.filter((u) => u.tenantId === row.id && u.role === 'member').length || 0,
      sortable: true,
      render: (row) => {
        const count = db.users.filter((u) => u.tenantId === row.id && u.role === 'member').length;
        return <span className="tabular-nums">{count}</span>;
      },
    },
    {
      key: 'since',
      header: 'Kunde seit',
      value: (row) => row.since,
      sortable: true,
      render: (row) => <span className="text-muted">{formatDate(row.since, locale, { month: '2-digit', year: 'numeric' })}</span>,
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      value: (row) => row.status,
      render: (row) => <Badge tone={row.status === 'aktiv' ? 'success' : 'neutral'}>{row.status}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Mandanten"
        subtitle={`${rows.length} Boxen auf der Plattform`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setOpen(true)}>
            Box anlegen
          </Button>
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/platform/mandanten/${row.id}`)}
        searchPlaceholder="Box suchen …"
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Neue Box anlegen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.name.trim()) {
                  toast('Bitte einen Namen angeben.', 'warning');
                  return;
                }
                createEntity('tenants', {
                  id: `t-${Date.now()}`,
                  name: form.name,
                  slug: form.name.toLowerCase().replace(/\s+/g, '-'),
                  city: form.city,
                  street: '',
                  zip: '',
                  email: form.email,
                  phone: '',
                  initials: form.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
                  status: 'aktiv',
                  platformPlanId: form.planId,
                  since: now().toISOString().slice(0, 10),
                  bookingWindowDays: 7,
                  cancelDeadlineHours: 2,
                  waitlistEnabled: true,
                  noShowFeeCents: 0,
                  openingHours: [],
                });
                toast(`${form.name} angelegt – die Einladung an den Box-Admin ist unterwegs.`);
                setOpen(false);
                setForm({ name: '', city: '', email: '', planId: 'pp-pro' });
              }}
            >
              Box anlegen
            </Button>
          </>
        }
      >
        <Field label="Name der Box" htmlFor="tenant-name">
          <Input id="tenant-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z. B. CrossFit Nordlicht" />
        </Field>
        <Field label="Stadt" htmlFor="tenant-city">
          <Input id="tenant-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="E-Mail des Box-Admins" htmlFor="tenant-mail" hint="Erhält die Einladung zum Einrichten">
          <Input id="tenant-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Plattform-Tarif" htmlFor="tenant-plan">
          <Select id="tenant-plan" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            {db.platformPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {formatCurrency(plan.priceCents, locale)} / Monat
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </>
  );
}

const tenantTabs: TabDef[] = [
  { key: 'uebersicht', label: 'Übersicht' },
  { key: 'nutzung', label: 'Nutzung' },
  { key: 'abrechnung', label: 'Abrechnung' },
  { key: 'features', label: 'Features' },
];

export function PlatformTenantDetail() {
  const { tenantId } = useParams();
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const impersonate = useDemoStore((s) => s.impersonate);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const navigate = useNavigate();
  const active = useActiveTab(tenantTabs);

  const tenant = db.tenants.find((t) => t.id === tenantId);
  if (!tenant) return <EmptyState title="Box nicht gefunden" />;

  const plan = db.platformPlans.find((p) => p.id === tenant.platformPlanId);
  const admin = db.users.find((u) => u.tenantId === tenant.id && u.role === 'box-admin');
  const members = db.users.filter((u) => u.tenantId === tenant.id && u.role === 'member');
  const sessions = db.sessions.filter((s) => s.tenantId === tenant.id);
  const invoices = db.platformInvoices.filter((i) => i.tenantId === tenant.id);
  const flags = db.featureFlags;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: '/platform/mandanten', label: 'Zurück zur Mandantenliste' }}
        title={tenant.name}
        subtitle={`${tenant.city} · Kunde seit ${formatDate(tenant.since, locale, { month: 'long', year: 'numeric' })}`}
        actions={
          admin ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<LogIn size={15} />}
              onClick={() => {
                impersonate(admin.id);
                toast(`Du siehst jetzt ${tenant.name} als ${admin.firstName} ${admin.lastName}.`, 'info');
                navigate('/admin');
              }}
            >
              Als Box-Admin ansehen
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatTile label="Mitglieder" value={members.length || tenant.memberCount || 0} />
        <StatTile label="Kurstermine" value={sessions.length} tone="info" />
        <StatTile label="Tarif" value={plan?.name ?? '—'} tone="brand" />
        <StatTile label="Status" value={tenant.status} tone={tenant.status === 'aktiv' ? 'success' : 'warning'} />
      </div>

      <Tabs tabs={tenantTabs} />

      {active === 'uebersicht' && (
        <SectionCard title="Stammdaten">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Adresse</dt>
              <dd>
                {tenant.street || '—'}
                {tenant.zip ? `, ${tenant.zip} ${tenant.city}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Box-Admin</dt>
              <dd>{admin ? `${admin.firstName} ${admin.lastName}` : 'nicht zugewiesen'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">E-Mail</dt>
              <dd>{tenant.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Telefon</dt>
              <dd>{tenant.phone || '—'}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Select
              value={tenant.platformPlanId}
              onChange={(e) => {
                updateEntity('tenants', tenant.id, { platformPlanId: e.target.value });
                toast('Plattform-Tarif geändert.');
              }}
              className="w-auto"
            >
              {db.platformPlans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Button
              variant={tenant.status === 'aktiv' ? 'danger' : 'success'}
              size="sm"
              onClick={() => {
                const next = tenant.status === 'aktiv' ? 'inaktiv' : 'aktiv';
                updateEntity('tenants', tenant.id, { status: next });
                toast(next === 'aktiv' ? 'Box aktiviert.' : 'Box deaktiviert – der Zugang ist gesperrt.', 'info');
              }}
            >
              {tenant.status === 'aktiv' ? 'Zugang sperren' : 'Zugang freigeben'}
            </Button>
          </div>
        </SectionCard>
      )}

      {active === 'nutzung' && (
        <SectionCard title="Nutzung" description="Kennzahlen dieser Box">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Buchungen gesamt</dt>
              <dd className="font-display text-xl">{db.bookings.filter((b) => sessions.some((s) => s.id === b.sessionId)).length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Kursarten</dt>
              <dd className="font-display text-xl">{db.courseTemplates.filter((t) => t.tenantId === tenant.id).length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Trainer</dt>
              <dd className="font-display text-xl">{db.users.filter((u) => u.tenantId === tenant.id && u.role === 'coach').length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Limit laut Tarif</dt>
              <dd className="font-display text-xl">{plan?.maxMembers ?? 'unbegrenzt'}</dd>
            </div>
          </dl>
          {plan?.maxMembers && members.length > plan.maxMembers * 0.8 && (
            <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              Die Box nähert sich dem Mitgliederlimit ihres Tarifs – ein Upgrade wäre sinnvoll.
            </p>
          )}
        </SectionCard>
      )}

      {active === 'abrechnung' && (
        <SectionCard title="Rechnungen an diese Box">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Rechnungen.</p>
          ) : (
            <ul>
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                  <span className="text-sm">
                    {invoice.periodLabel}
                    <span className="block text-xs text-muted">{invoice.number}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={invoice.status === 'bezahlt' ? 'success' : invoice.status === 'offen' ? 'warning' : 'danger'}>
                      {invoice.status}
                    </Badge>
                    <span className="tabular-nums">{formatCurrency(invoice.amountCents, locale)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {active === 'features' && (
        <SectionCard title="Freigeschaltete Module">
          {flags.map((flag) => {
            const enabled = flag.globallyEnabled || flag.enabledTenantIds.includes(tenant.id);
            return (
              <Switch
                key={flag.id}
                checked={enabled}
                onChange={(value) => {
                  const next = value
                    ? [...flag.enabledTenantIds, tenant.id]
                    : flag.enabledTenantIds.filter((id) => id !== tenant.id);
                  updateEntity('featureFlags', flag.id, { enabledTenantIds: next });
                  toast(`${flag.name} ${value ? 'freigeschaltet' : 'deaktiviert'} für ${tenant.name}.`);
                }}
                label={flag.name}
                hint={flag.globallyEnabled ? 'Global aktiv für alle Boxen' : flag.description}
              />
            );
          })}
        </SectionCard>
      )}
    </div>
  );
}

export function PlatformBilling() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);

  const rows = [...db.platformInvoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const open = rows.filter((i) => i.status !== 'bezahlt');

  const columns: Column<PlatformInvoice>[] = [
    { key: 'number', header: 'Nummer', value: (row) => row.number, sortable: true, render: (row) => <span className="tabular-nums">{row.number}</span> },
    {
      key: 'tenant',
      header: 'Box',
      value: (row) => db.tenants.find((t) => t.id === row.tenantId)?.name ?? '',
      sortable: true,
      render: (row) => db.tenants.find((t) => t.id === row.tenantId)?.name ?? '—',
    },
    { key: 'period', header: 'Zeitraum', value: (row) => row.periodLabel, render: (row) => <span className="text-muted">{row.periodLabel}</span>, hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      value: (row) => row.status,
      sortable: true,
      render: (row) => <Badge tone={row.status === 'bezahlt' ? 'success' : row.status === 'offen' ? 'warning' : 'danger'}>{row.status}</Badge>,
    },
    { key: 'amount', header: 'Betrag', value: (row) => row.amountCents, sortable: true, render: (row) => <span className="tabular-nums">{formatCurrency(row.amountCents, locale)}</span> },
    {
      key: 'action',
      header: '',
      render: (row) =>
        row.status !== 'bezahlt' ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              updateEntity('platformInvoices', row.id, { status: 'bezahlt' });
              toast(`${row.number} als bezahlt markiert.`);
            }}
          >
            Bezahlt
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Abrechnung" subtitle="Rechnungen an die Boxen" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Offen" value={formatCurrency(open.reduce((s, i) => s + i.amountCents, 0), locale)} tone={open.length ? 'warning' : 'success'} />
        <StatTile label="Rechnungen" value={rows.length} />
        <StatTile label="Überfällig" value={rows.filter((i) => i.status === 'ueberfaellig').length} tone="danger" />
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(row) => row.id} searchPlaceholder="Rechnung oder Box suchen …" />
    </>
  );
}

export function PlatformPlans() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);

  return (
    <>
      <PageHeader title="Plattform-Tarife" subtitle="Was die Boxen für BoxFlow zahlen" />
      <div className="grid gap-3 sm:grid-cols-3">
        {db.platformPlans.map((plan) => {
          const tenants = db.tenants.filter((t) => t.platformPlanId === plan.id);
          return (
            <Card key={plan.id} className="flex flex-col">
              <p className="font-display text-xl">{plan.name}</p>
              <p className="mt-1 font-display text-3xl text-brand">{formatCurrency(plan.priceCents, locale)}</p>
              <p className="text-xs text-muted">pro Monat und Box</p>
              <p className="mt-2 text-sm text-muted">Bis {plan.maxMembers ?? 'unbegrenzt'} Mitglieder</p>
              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-2 text-xs text-muted">{tenants.length} Boxen in diesem Tarif</p>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function PlatformStats() {
  const db = useDb();
  const { mrr } = usePlatformNumbers();
  const locale = useDemoStore((s) => s.prefs.locale);

  const tenantUsage = db.tenants.map((tenant) => ({
    box: tenant.name.replace('CrossFit ', ''),
    mitglieder: db.users.filter((u) => u.tenantId === tenant.id && u.role === 'member').length || tenant.memberCount || 0,
  }));

  const growth = useMemo(() => {
    const months: Array<{ monat: string; boxen: number }> = [];
    const current = now();
    for (let i = 11; i >= 0; i--) {
      const reference = new Date(current.getFullYear(), current.getMonth() - i + 1, 0);
      months.push({
        monat: reference.toLocaleDateString('de-DE', { month: 'short' }),
        boxen: db.tenants.filter((t) => new Date(t.since) <= reference).length,
      });
    }
    return months;
  }, [db]);

  return (
    <>
      <PageHeader title="Statistiken" subtitle="Nutzung über alle Boxen hinweg" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Monatlich wiederkehrend" value={formatCurrency(mrr, locale)} tone="success" />
        <StatTile label="Buchungen gesamt" value={db.bookings.length} />
        <StatTile label="Check-ins" value={db.checkIns.length} tone="info" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Mitglieder je Box">
          <ColumnChart data={tenantUsage} xKey="box" yKey="mitglieder" />
        </SectionCard>
        <SectionCard title="Boxen auf der Plattform">
          <TrendChart data={growth} xKey="monat" yKey="boxen" />
        </SectionCard>
      </div>
    </>
  );
}

export function PlatformSupport() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const [reply, setReply] = useState<Record<string, string>>({});

  const tickets = [...db.supportTickets].sort((a, b) => {
    const order = { offen: 0, 'in-arbeit': 1, geschlossen: 2 };
    return order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <>
      <PageHeader title="Support" subtitle={`${tickets.filter((t) => t.status !== 'geschlossen').length} offene Anfragen von Boxen`} />
      {tickets.length === 0 ? (
        <EmptyState icon={<LifeBuoy size={28} />} title="Keine Anfragen" />
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => {
            const tenant = db.tenants.find((t) => t.id === ticket.tenantId);
            return (
              <SectionCard
                key={ticket.id}
                title={ticket.subject}
                description={`${tenant?.name ?? 'Unbekannt'} · ${formatDate(ticket.createdAt, locale, { day: '2-digit', month: 'long' })}`}
                action={
                  <span className="flex items-center gap-2">
                    <Badge tone={ticket.priority === 'hoch' ? 'danger' : 'neutral'}>{ticket.priority}</Badge>
                    <Badge tone={ticket.status === 'offen' ? 'warning' : ticket.status === 'in-arbeit' ? 'info' : 'neutral'}>
                      {ticket.status}
                    </Badge>
                  </span>
                }
              >
                <ul className="mb-3 flex flex-col gap-2">
                  {ticket.messages.map((message) => (
                    <li key={message.id} className={`rounded-lg px-3 py-2 text-sm ${message.from === 'box' ? 'bg-elevated' : 'bg-brand/10'}`}>
                      <p className="text-xs font-semibold text-muted">
                        {message.authorName} · {formatDate(message.at, locale, { day: '2-digit', month: '2-digit' })}
                      </p>
                      <p>{message.body}</p>
                    </li>
                  ))}
                </ul>
                {ticket.status !== 'geschlossen' && (
                  <>
                    <Field label="Antwort" htmlFor={`p-reply-${ticket.id}`}>
                      <Textarea
                        id={`p-reply-${ticket.id}`}
                        rows={2}
                        value={reply[ticket.id] ?? ''}
                        onChange={(e) => setReply({ ...reply, [ticket.id]: e.target.value })}
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const text = reply[ticket.id];
                          if (!text?.trim()) return;
                          updateEntity('supportTickets', ticket.id, {
                            status: 'in-arbeit',
                            messages: [
                              ...ticket.messages,
                              { id: `stm-${Date.now()}`, from: 'plattform', authorName: 'Sven Krüger', body: text, at: now().toISOString() },
                            ],
                          });
                          setReply({ ...reply, [ticket.id]: '' });
                          toast('Antwort gesendet.');
                        }}
                      >
                        Antworten
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          updateEntity('supportTickets', ticket.id, { status: 'geschlossen' });
                          toast('Ticket geschlossen.', 'info');
                        }}
                      >
                        Schließen
                      </Button>
                    </div>
                  </>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}
    </>
  );
}

export function PlatformFeatures() {
  const db = useDb();
  const updateEntity = useDemoStore((s) => s.updateEntity);

  return (
    <>
      <PageHeader title="Features" subtitle="Module global oder je Box freischalten" />
      <div className="flex flex-col gap-3">
        {db.featureFlags.map((flag) => (
          <SectionCard
            key={flag.id}
            title={flag.name}
            description={flag.description}
            action={
              <Switch
                checked={flag.globallyEnabled}
                onChange={(value) => {
                  updateEntity('featureFlags', flag.id, { globallyEnabled: value });
                  toast(`${flag.name} ${value ? 'für alle Boxen aktiviert' : 'global deaktiviert'}.`);
                }}
                label="Global"
              />
            }
          >
            <div className="flex flex-wrap gap-2">
              {db.tenants.map((tenant) => {
                const enabled = flag.globallyEnabled || flag.enabledTenantIds.includes(tenant.id);
                return (
                  <button
                    key={tenant.id}
                    type="button"
                    disabled={flag.globallyEnabled}
                    onClick={() => {
                      const next = enabled
                        ? flag.enabledTenantIds.filter((id) => id !== tenant.id)
                        : [...flag.enabledTenantIds, tenant.id];
                      updateEntity('featureFlags', flag.id, { enabledTenantIds: next });
                      toast(`${flag.name}: ${tenant.name} ${enabled ? 'deaktiviert' : 'freigeschaltet'}.`);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      enabled ? 'border-success bg-success/15 text-success' : 'border-line text-muted'
                    }`}
                  >
                    {tenant.name}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        ))}
      </div>
    </>
  );
}

export function PlatformSettings() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Einstellungen" subtitle="Globale Vorgaben für alle Boxen" />
      <SectionCard title="Standardwerte für neue Boxen" className="mb-4">
        <Field label="Buchungsfenster (Tage)" htmlFor="default-window">
          <Input id="default-window" type="number" defaultValue={7} />
        </Field>
        <Field label="Stornofrist (Stunden)" htmlFor="default-cancel">
          <Input id="default-cancel" type="number" defaultValue={2} />
        </Field>
        <Switch checked onChange={() => undefined} label="Warteliste standardmäßig aktiv" />
        <Button variant="primary" className="mt-3" onClick={() => toast('Standardwerte gespeichert.')}>
          Speichern
        </Button>
      </SectionCard>

      <SectionCard title="Absender für E-Mails">
        <Field label="Absendername" htmlFor="sender-name">
          <Input id="sender-name" defaultValue="BoxFlow" />
        </Field>
        <Field label="Absenderadresse" htmlFor="sender-mail">
          <Input id="sender-mail" type="email" defaultValue="noreply@boxflow.app" />
        </Field>
        <Button variant="primary" className="mt-3" onClick={() => toast('Absender gespeichert.')}>
          Speichern
        </Button>
      </SectionCard>
    </div>
  );
}
