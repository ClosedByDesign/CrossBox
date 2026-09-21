import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Trophy } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, StatTile } from '../../components/ui';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Field, Input, Select } from '../../components/ui/form';
import { Modal } from '../../components/ui/Modal';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { formatCurrency, formatDate } from '../../lib/format';
import { MAIN_TENANT_ID } from '../../data/seed/static';
import type { Invoice, Membership, Order, Plan, ShopArticle, User } from '../../data/types';
import { isCoach } from '../../data/types';

/* ---------------------------------------------------------- Verträge */

export function AdminContracts() {
  const db = useDb();
  const navigate = useNavigate();
  const locale = useDemoStore((s) => s.prefs.locale);

  interface Row {
    membership: Membership;
    user: User;
    plan?: Plan;
  }

  const rows: Row[] = db.memberships
    .map((membership) => ({
      membership,
      user: db.users.find((u) => u.id === membership.userId)!,
      plan: db.plans.find((p) => p.id === membership.planId),
    }))
    .filter((row) => row.user);

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Mitglied',
      value: (row) => `${row.user.firstName} ${row.user.lastName}`,
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <Avatar name={`${row.user.firstName} ${row.user.lastName}`} hue={row.user.avatarHue} size={26} />
          {row.user.firstName} {row.user.lastName}
        </span>
      ),
    },
    { key: 'plan', header: 'Tarif', value: (row) => row.plan?.name ?? '', sortable: true, render: (row) => row.plan?.name ?? '—' },
    {
      key: 'price',
      header: 'Beitrag',
      value: (row) => row.plan?.priceCents ?? 0,
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.plan ? formatCurrency(row.plan.priceCents, locale) : '—'}</span>,
      hideOnMobile: true,
    },
    { key: 'start', header: 'Beginn', value: (row) => row.membership.startedAt, sortable: true, render: (row) => formatDate(row.membership.startedAt, locale), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      value: (row) => row.membership.status,
      sortable: true,
      render: (row) => (
        <Badge tone={row.membership.status === 'aktiv' ? 'success' : row.membership.status === 'pausiert' ? 'warning' : 'danger'}>
          {row.membership.status}
        </Badge>
      ),
    },
  ];

  const active = rows.filter((r) => r.membership.status === 'aktiv');
  const mrr = active.reduce((sum, r) => sum + (r.plan?.interval === 'monat' ? r.plan.priceCents : 0), 0);

  return (
    <>
      <PageHeader title="Verträge" subtitle={`${rows.length} Verträge · ${active.length} aktiv`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Aktive Verträge" value={active.length} />
        <StatTile label="Monatlich wiederkehrend" value={formatCurrency(mrr, locale)} tone="success" />
        <StatTile label="Gekündigt" value={rows.filter((r) => r.membership.status === 'gekuendigt').length} tone="warning" />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.membership.id}
        onRowClick={(row) => navigate(`/admin/mitglieder/${row.user.id}?tab=vertrag`)}
        searchPlaceholder="Mitglied suchen …"
      />
    </>
  );
}

/* ------------------------------------------------------------ Tarife */

export function AdminPlans() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const createEntity = useDemoStore((s) => s.createEntity);
  const [edit, setEdit] = useState<Plan | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState({ name: '', priceCents: 8900, sessionsPerMonth: '', minTermMonths: 12, description: '' });

  const counts = new Map<string, number>();
  db.memberships.forEach((m) => counts.set(m.planId, (counts.get(m.planId) ?? 0) + 1));

  const closeEditor = () => {
    setEditorOpen(false);
    setEdit(null);
  };

  const openEditor = (plan: Plan | null) => {
    setEdit(plan);
    setEditorOpen(true);
    setForm({
      name: plan?.name ?? '',
      priceCents: plan?.priceCents ?? 8900,
      sessionsPerMonth: plan?.sessionsPerMonth != null ? String(plan.sessionsPerMonth) : '',
      minTermMonths: plan?.minTermMonths ?? 12,
      description: plan?.description ?? '',
    });
  };

  return (
    <>
      <PageHeader
        title="Tarife"
        subtitle={`${db.plans.length} Tarife im Angebot`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => openEditor(null)}>
            Neuer Tarif
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {db.plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xl">{plan.name}</p>
              {plan.highlight && <Badge tone="brand">Beliebt</Badge>}
            </div>
            <p className="mt-1 font-display text-2xl text-brand">{formatCurrency(plan.priceCents, locale)}</p>
            <p className="text-xs text-muted">{plan.interval === 'monat' ? 'pro Monat' : 'einmalig'}</p>
            <p className="mt-2 text-sm text-muted">{plan.description}</p>
            <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
              <li>Mindestlaufzeit: {plan.minTermMonths > 0 ? `${plan.minTermMonths} Monate` : 'keine'}</li>
              <li>Kontingent: {plan.sessionsPerMonth ?? 'unbegrenzt'}</li>
              <li className="font-semibold text-ink">{counts.get(plan.id) ?? 0} aktive Verträge</li>
            </ul>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => openEditor(plan)}>
              Bearbeiten
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        title={edit ? `${edit.name} bearbeiten` : 'Neuer Tarif'}
        footer={
          <>
            <Button variant="ghost" onClick={closeEditor}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const payload = {
                  name: form.name,
                  priceCents: form.priceCents,
                  sessionsPerMonth: form.sessionsPerMonth === '' ? null : Number(form.sessionsPerMonth),
                  minTermMonths: form.minTermMonths,
                  description: form.description,
                };
                if (edit) {
                  updateEntity('plans', edit.id, payload);
                  toast(`${form.name} aktualisiert.`);
                } else {
                  createEntity('plans', {
                    id: `p-${Date.now()}`,
                    tenantId: MAIN_TENANT_ID,
                    interval: 'monat',
                    features: [],
                    ...payload,
                  });
                  toast(`${form.name} angelegt.`);
                }
                closeEditor();
              }}
            >
              Speichern
            </Button>
          </>
        }
      >
        <Field label="Name" htmlFor="plan-name">
          <Input id="plan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preis (Cent)" htmlFor="plan-price" hint={formatCurrency(form.priceCents, locale)}>
            <Input id="plan-price" type="number" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} />
          </Field>
          <Field label="Mindestlaufzeit (Monate)" htmlFor="plan-term">
            <Input id="plan-term" type="number" value={form.minTermMonths} onChange={(e) => setForm({ ...form, minTermMonths: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Kontingent pro Monat" htmlFor="plan-quota" hint="Leer lassen für unbegrenzt">
          <Input id="plan-quota" type="number" value={form.sessionsPerMonth} onChange={(e) => setForm({ ...form, sessionsPerMonth: e.target.value })} />
        </Field>
        <Field label="Beschreibung" htmlFor="plan-desc">
          <Input id="plan-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </Modal>
    </>
  );
}

/* -------------------------------------------------------- Rechnungen */

export function AdminInvoices() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const [filter, setFilter] = useState<'alle' | 'offen'>('offen');

  interface Row {
    invoice: Invoice;
    user?: User;
  }

  const rows: Row[] = db.invoices
    .map((invoice) => ({ invoice, user: db.users.find((u) => u.id === invoice.userId) }))
    .filter((row) => (filter === 'offen' ? row.invoice.status !== 'bezahlt' : true))
    .sort((a, b) => b.invoice.issuedAt.localeCompare(a.invoice.issuedAt));

  const openSum = db.invoices.filter((i) => i.status !== 'bezahlt').reduce((sum, i) => sum + i.amountCents, 0);
  const paidThisMonth = db.invoices
    .filter((i) => i.status === 'bezahlt' && new Date(i.issuedAt).getMonth() === new Date().getMonth())
    .reduce((sum, i) => sum + i.amountCents, 0);

  const columns: Column<Row>[] = [
    { key: 'number', header: 'Nummer', value: (row) => row.invoice.number, sortable: true, render: (row) => <span className="tabular-nums">{row.invoice.number}</span> },
    {
      key: 'user',
      header: 'Mitglied',
      value: (row) => (row.user ? `${row.user.firstName} ${row.user.lastName}` : ''),
      sortable: true,
      render: (row) => (row.user ? `${row.user.firstName} ${row.user.lastName}` : '—'),
    },
    { key: 'period', header: 'Zeitraum', value: (row) => row.invoice.periodLabel, render: (row) => <span className="text-muted">{row.invoice.periodLabel}</span>, hideOnMobile: true },
    { key: 'due', header: 'Fällig', value: (row) => row.invoice.dueAt, sortable: true, render: (row) => formatDate(row.invoice.dueAt, locale), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      value: (row) => row.invoice.status,
      sortable: true,
      render: (row) => (
        <Badge tone={row.invoice.status === 'bezahlt' ? 'success' : row.invoice.status === 'offen' ? 'warning' : 'danger'}>
          {row.invoice.status}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Betrag',
      value: (row) => row.invoice.amountCents,
      sortable: true,
      render: (row) => <span className="tabular-nums">{formatCurrency(row.invoice.amountCents, locale)}</span>,
    },
    {
      key: 'action',
      header: '',
      render: (row) =>
        row.invoice.status !== 'bezahlt' ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              updateEntity('invoices', row.invoice.id, { status: 'bezahlt' });
              toast(`Zahlung zu ${row.invoice.number} erfasst.`);
            }}
          >
            Bezahlt
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Rechnungen" subtitle="Beiträge und offene Posten" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Offene Posten" value={formatCurrency(openSum, locale)} tone={openSum > 0 ? 'warning' : 'success'} />
        <StatTile label="Bezahlt diesen Monat" value={formatCurrency(paidThisMonth, locale)} tone="success" />
        <StatTile label="Rechnungen gesamt" value={db.invoices.length} />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.invoice.id}
        searchPlaceholder="Rechnung oder Mitglied suchen …"
        toolbar={
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-auto">
            <option value="offen">Nur offene</option>
            <option value="alle">Alle</option>
          </Select>
        }
      />
    </>
  );
}

/* --------------------------------------------------------------- Shop */

export function AdminShop() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const [edit, setEdit] = useState<ShopArticle | null>(null);
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);

  const lowStock = db.shopArticles.filter((a) => a.stock <= 8);

  const columns: Column<ShopArticle>[] = [
    {
      key: 'name',
      header: 'Artikel',
      value: (row) => row.name,
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="text-xl">{row.emoji}</span>
          <span className="font-semibold">{row.name}</span>
        </span>
      ),
    },
    { key: 'category', header: 'Kategorie', value: (row) => row.category, sortable: true, render: (row) => <Badge>{row.category}</Badge>, hideOnMobile: true },
    { key: 'price', header: 'Preis', value: (row) => row.priceCents, sortable: true, render: (row) => <span className="tabular-nums">{formatCurrency(row.priceCents, locale)}</span> },
    {
      key: 'stock',
      header: 'Bestand',
      value: (row) => row.stock,
      sortable: true,
      render: (row) => <span className={row.stock <= 8 ? 'font-semibold text-warning tabular-nums' : 'tabular-nums'}>{row.stock}</span>,
    },
    {
      key: 'active',
      header: 'Sichtbar',
      value: (row) => (row.active ? 'ja' : 'nein'),
      render: (row) => <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Im Shop' : 'Versteckt'}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Artikel" subtitle={`${db.shopArticles.length} Artikel · ${lowStock.length} mit niedrigem Bestand`} />
      {lowStock.length > 0 && (
        <Card className="mb-4 border-warning/50 bg-warning/10">
          <p className="text-sm font-semibold text-warning">Nachbestellen: {lowStock.map((a) => a.name).join(', ')}</p>
        </Card>
      )}
      <DataTable
        rows={db.shopArticles}
        columns={columns}
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          setEdit(row);
          setStock(row.stock);
          setPrice(row.priceCents);
        }}
        searchPlaceholder="Artikel suchen …"
      />

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.name ?? ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!edit) return;
                updateEntity('shopArticles', edit.id, { stock, priceCents: price });
                toast(`${edit.name} aktualisiert.`);
                setEdit(null);
              }}
            >
              Speichern
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preis (Cent)" htmlFor="article-price" hint={formatCurrency(price, locale)}>
            <Input id="article-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Bestand" htmlFor="article-stock">
            <Input id="article-stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Sichtbarkeit">
          <Select
            value={edit?.active ? 'ja' : 'nein'}
            onChange={(e) => {
              if (!edit) return;
              updateEntity('shopArticles', edit.id, { active: e.target.value === 'ja' });
            }}
          >
            <option value="ja">Im Shop sichtbar</option>
            <option value="nein">Versteckt</option>
          </Select>
        </Field>
      </Modal>
    </>
  );
}

export function AdminOrders() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);

  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const nextStatus: Record<Order['status'], Order['status'] | null> = {
    neu: 'abholbereit',
    abholbereit: 'abgeholt',
    abgeholt: null,
    storniert: null,
  };
  const label = { neu: 'In Bearbeitung', abholbereit: 'Abholbereit', abgeholt: 'Abgeholt', storniert: 'Storniert' };
  const tone = { neu: 'warning', abholbereit: 'success', abgeholt: 'neutral', storniert: 'danger' } as const;

  return (
    <>
      <PageHeader title="Bestellungen" subtitle={`${orders.filter((o) => o.status === 'neu').length} offen`} />
      {orders.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title="Keine Bestellungen" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const user = db.users.find((u) => u.id === order.userId);
            const next = nextStatus[order.status];
            return (
              <Card key={order.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {user && <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={30} />}
                    <div>
                      <p className="font-semibold">
                        {order.number} · {user ? `${user.firstName} ${user.lastName}` : 'Unbekannt'}
                      </p>
                      <p className="text-xs text-muted">{formatDate(order.createdAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={tone[order.status]}>{label[order.status]}</Badge>
                    {next && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          updateEntity('orders', order.id, { status: next });
                          toast(`${order.number}: ${label[next]}`);
                        }}
                      >
                        {next === 'abholbereit' ? 'Bereitstellen' : 'Als abgeholt'}
                      </Button>
                    )}
                  </div>
                </div>
                <ul className="mt-2 flex flex-col gap-0.5 text-sm">
                  {order.items.map((item) => {
                    const article = db.shopArticles.find((a) => a.id === item.articleId);
                    return (
                      <li key={item.articleId} className="flex justify-between">
                        <span>
                          {item.qty}× {article?.name}
                        </span>
                        <span className="tabular-nums text-muted">{formatCurrency(item.priceCents * item.qty, locale)}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 border-t border-line pt-2 text-right font-semibold tabular-nums">{formatCurrency(order.totalCents, locale)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------- Team */

export function AdminCoaches() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = new Date();

  const coaches = db.users.filter((u) => isCoach(u) && u.tenantId === MAIN_TENANT_ID);
  const weekSessions = db.sessions.filter((s) => {
    const date = new Date(s.date);
    const diff = (date.getTime() - current.getTime()) / 86_400_000;
    return diff >= -3 && diff <= 4;
  });

  return (
    <>
      <PageHeader title="Trainer" subtitle={`${coaches.length} Trainer im Team`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {coaches.map((coach) => {
          const sessions = weekSessions.filter((s) => s.coachId === coach.id);
          const hours = sessions.reduce((sum, s) => sum + s.durationMin, 0) / 60;
          return (
            <Card key={coach.id}>
              <div className="flex items-start gap-3">
                <Avatar name={`${coach.firstName} ${coach.lastName}`} hue={coach.avatarHue} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg">
                    {coach.firstName} {coach.lastName}
                  </p>
                  <p className="text-xs text-muted">{coach.headline}</p>
                  <p className="mt-1 text-sm text-muted">{coach.bio}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {coach.certifications?.map((cert) => (
                      <Badge key={cert} tone="info">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {sessions.length} Kurse diese Woche · {hours.toFixed(1)} Stunden · dabei seit{' '}
                    {formatDate(coach.joinedAt, locale, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------ Leaderboard */

const lbTabs: TabDef[] = [
  { key: 'offen', label: 'Offene Punktevergabe' },
  { key: 'wertung', label: 'Gesamtwertung' },
];

export function AdminLeaderboard() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const navigate = useNavigate();
  const active = useActiveTab(lbTabs);

  const open = db.sessions
    .filter((s) => s.status === 'vorbei' && s.wodId && !s.pointsGiven)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => ({
      session,
      template: db.courseTemplates.find((t) => t.id === session.templateId)!,
      coach: db.users.find((u) => u.id === session.coachId),
      participants: db.bookings.filter((b) => b.sessionId === session.id && b.status === 'anwesend').length,
    }));

  const ranking = useMemo(() => {
    const totals = new Map<string, { points: number; classes: number }>();
    db.leaderboard.forEach((entry) => {
      const prev = totals.get(entry.userId) ?? { points: 0, classes: 0 };
      totals.set(entry.userId, { points: prev.points + entry.points, classes: prev.classes + 1 });
    });
    return [...totals.entries()]
      .map(([id, value]) => ({ user: db.users.find((u) => u.id === id), ...value }))
      .filter((row) => row.user)
      .sort((a, b) => b.points - a.points);
  }, [db]);

  const season = db.seasons.find((s) => s.active);

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle={season ? `${season.name} · ${formatDate(season.from, locale)} – ${formatDate(season.to, locale)}` : undefined}
        actions={<Badge tone={open.length > 0 ? 'warning' : 'success'}>{open.length} Kurse offen</Badge>}
      />
      <Tabs tabs={lbTabs} />

      {active === 'offen' &&
        (open.length === 0 ? (
          <EmptyState icon={<Trophy size={28} />} title="Alles vergeben" description="Für alle vergangenen Kurse wurden Punkte eingetragen." />
        ) : (
          <Card className="p-0">
            <ul>
              {open.slice(0, 20).map(({ session, template, coach, participants }) => (
                <li key={session.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                  <span className="font-display text-lg tabular-nums">{session.startTime}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })} · {coach?.firstName}{' '}
                      {coach?.lastName} · {participants} Teilnehmer
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => navigate(`/admin/kurs/${session.id}`)}>
                    Punkte vergeben
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ))}

      {active === 'wertung' && (
        <Card className="p-2">
          <ul>
            {ranking.slice(0, 30).map((row, index) => (
              <li key={row.user!.id} className="flex items-center gap-3 border-b border-line px-2 py-2 last:border-0">
                <span className="w-7 text-center font-display text-lg tabular-nums text-muted">{index + 1}</span>
                <Avatar name={`${row.user!.firstName} ${row.user!.lastName}`} hue={row.user!.avatarHue} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {row.user!.firstName} {row.user!.lastName}
                </span>
                <span className="text-xs text-muted">{row.classes} Kurse</span>
                <span className="w-14 text-right font-display tabular-nums text-brand">{row.points}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
