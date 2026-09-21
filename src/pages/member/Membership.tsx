import { useMemo, useState } from 'react';
import { CreditCard, FileText, PauseCircle, Receipt, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, SectionCard } from '../../components/ui';
import { Field, Select, Textarea } from '../../components/ui/form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { addDays, now, toDateKey } from '../../lib/clock';
import { formatCurrency, formatDate } from '../../lib/format';

export default function Membership() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);

  const [changeOpen, setChangeOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [pauseMonths, setPauseMonths] = useState('1');
  const [cancelReason, setCancelReason] = useState('');

  const membership = db.memberships.find((m) => m.userId === userId);
  const plan = db.plans.find((p) => p.id === membership?.planId);
  const user = db.users.find((u) => u.id === userId);

  const visits = useMemo(() => {
    const monthStart = new Date(now().getFullYear(), now().getMonth(), 1);
    return db.bookings.filter((b) => {
      if (b.userId !== userId || b.status !== 'anwesend') return false;
      const session = db.sessions.find((s) => s.id === b.sessionId);
      return session ? new Date(session.date) >= monthStart : false;
    }).length;
  }, [db, userId]);

  if (!membership || !plan || !user) {
    return <EmptyState icon={<FileText size={28} />} title="Kein Vertrag hinterlegt" />;
  }

  const statusTone = membership.status === 'aktiv' ? 'success' : membership.status === 'pausiert' ? 'warning' : 'danger';
  const statusLabel = { aktiv: 'Aktiv', pausiert: 'Pausiert', gekuendigt: 'Gekündigt' }[membership.status];
  const noticeDate = addDays(now(), 30);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Mitgliedschaft"
        subtitle={`Mitglied seit ${formatDate(user.joinedAt, locale, { month: 'long', year: 'numeric' })}`}
        actions={<Badge tone={statusTone}>{statusLabel}</Badge>}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl">{plan.name}</p>
            <p className="text-sm text-muted">{plan.description}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-brand">{formatCurrency(plan.priceCents, locale)}</p>
            <p className="text-xs text-muted">{plan.interval === 'monat' ? 'pro Monat' : 'einmalig'}</p>
          </div>
        </div>

        {plan.sessionsPerMonth != null && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Kontingent diesen Monat</span>
              <span className="tabular-nums">
                {membership.usedThisMonth} von {plan.sessionsPerMonth} Einheiten
              </span>
            </div>
            <ProgressBar value={membership.usedThisMonth} max={plan.sessionsPerMonth} />
          </div>
        )}

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Vertragsbeginn</dt>
            <dd>{formatDate(membership.startedAt, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Mindestlaufzeit</dt>
            <dd>{plan.minTermMonths > 0 ? `${plan.minTermMonths} Monate` : 'keine'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Besuche im Monat</dt>
            <dd>{visits}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Kündigungsfrist</dt>
            <dd>1 Monat zum Laufzeitende</dd>
          </div>
        </dl>

        {membership.status === 'pausiert' && membership.pausedUntil && (
          <p className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
            Dein Vertrag ist bis {formatDate(membership.pausedUntil, locale)} pausiert. In dieser Zeit kannst du keine Kurse buchen.
          </p>
        )}
      </Card>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => setChangeOpen(true)}>
          Tarif wechseln
        </Button>
        <Button
          variant="secondary"
          icon={<PauseCircle size={15} />}
          onClick={() => {
            if (membership.status === 'pausiert') {
              updateEntity('memberships', membership.id, { status: 'aktiv', pausedUntil: undefined });
              toast('Dein Vertrag läuft wieder.');
            } else {
              setPauseOpen(true);
            }
          }}
        >
          {membership.status === 'pausiert' ? 'Pause beenden' : 'Pausieren'}
        </Button>
        <Button variant="danger" icon={<XCircle size={15} />} onClick={() => setCancelOpen(true)} disabled={membership.status === 'gekuendigt'}>
          Kündigen
        </Button>
      </div>

      <SectionCard title="Zahlungsmethode" className="mb-4" action={<a href="#/app/rechnungen" className="text-xs">Rechnungen</a>}>
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-muted" />
          <div>
            <p className="text-sm font-semibold">SEPA-Lastschrift</p>
            <p className="text-xs text-muted">DE89 •••• •••• •••• 3210 · Mandat CFR-{user.id.slice(-4)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Leistungen deines Tarifs">
        <ul className="flex flex-col gap-1.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {feature}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Tarifwechsel */}
      <Modal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="Tarif wechseln"
        footer={
          <>
            <Button variant="ghost" onClick={() => setChangeOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const target = newPlanId || plan.id;
                updateEntity('memberships', membership.id, { planId: target });
                const name = db.plans.find((p) => p.id === target)?.name;
                toast(`Tarif gewechselt: ${name} ab dem nächsten Monat.`);
                setChangeOpen(false);
              }}
            >
              Wechsel bestätigen
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Der Wechsel wird zum Beginn des nächsten Abrechnungsmonats wirksam. Die Differenz erscheint auf der nächsten Rechnung.
        </p>
        <div className="flex flex-col gap-2">
          {db.plans.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5',
                (newPlanId || plan.id) === option.id ? 'border-brand bg-brand/10' : 'border-line',
              )}
            >
              <input
                type="radio"
                name="plan"
                checked={(newPlanId || plan.id) === option.id}
                onChange={() => setNewPlanId(option.id)}
                className="mt-1 accent-[rgb(var(--c-brand))]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{option.name}</span>
                  <span className="text-sm tabular-nums text-brand">{formatCurrency(option.priceCents, locale)}</span>
                </span>
                <span className="block text-xs text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </Modal>

      {/* Pausieren */}
      <Modal
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        title="Mitgliedschaft pausieren"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPauseOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const until = addDays(now(), Number(pauseMonths) * 30);
                updateEntity('memberships', membership.id, { status: 'pausiert', pausedUntil: toDateKey(until) });
                toast(`Vertrag pausiert bis ${formatDate(until, locale)}.`, 'info');
                setPauseOpen(false);
              }}
            >
              Pause starten
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Bis zu drei Monate pro Jahr kannst du kostenfrei pausieren. Die Laufzeit verlängert sich entsprechend, Beiträge werden in
          dieser Zeit nicht abgebucht.
        </p>
        <Field label="Dauer" htmlFor="pause-months">
          <Select id="pause-months" value={pauseMonths} onChange={(e) => setPauseMonths(e.target.value)}>
            <option value="1">1 Monat</option>
            <option value="2">2 Monate</option>
            <option value="3">3 Monate</option>
          </Select>
        </Field>
      </Modal>

      {/* Kündigen */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Mitgliedschaft kündigen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Doch nicht
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                updateEntity('memberships', membership.id, { status: 'gekuendigt', endsAt: toDateKey(noticeDate) });
                toast(`Kündigung vorgemerkt zum ${formatDate(noticeDate, locale)}.`, 'info');
                setCancelOpen(false);
              }}
            >
              Kündigung absenden
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm">
          Deine Mitgliedschaft würde zum <strong>{formatDate(noticeDate, locale)}</strong> enden. Bis dahin kannst du weiter alle Kurse
          besuchen.
        </p>
        <Card className="mb-3 border-brand/40 bg-brand/10">
          <p className="text-sm font-semibold">Lieber pausieren?</p>
          <p className="text-xs text-muted">
            Wenn es gerade zeitlich nicht passt, kannst du bis zu drei Monate pausieren und deine Konditionen behalten.
          </p>
        </Card>
        <Field label="Grund (optional)" htmlFor="cancel-reason">
          <Textarea id="cancel-reason" rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}

export function Invoices() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const [confirm, setConfirm] = useState<string | null>(null);

  const invoices = db.invoices.filter((i) => i.userId === userId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const open = invoices.filter((i) => i.status !== 'bezahlt');
  const openSum = open.reduce((sum, i) => sum + i.amountCents, 0);

  const tone = { bezahlt: 'success', offen: 'warning', ueberfaellig: 'danger' } as const;
  const label = { bezahlt: 'Bezahlt', offen: 'Offen', ueberfaellig: 'Überfällig' };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Rechnungen" subtitle="Beiträge, Shop-Käufe und Gebühren" />

      {open.length > 0 && (
        <Card className="mb-4 border-warning/50 bg-warning/10">
          <p className="text-sm font-semibold text-warning">
            {open.length} offene {open.length === 1 ? 'Rechnung' : 'Rechnungen'} · {formatCurrency(openSum, locale)}
          </p>
          <p className="mt-0.5 text-xs text-muted">Der Einzug erfolgt automatisch per SEPA-Lastschrift.</p>
        </Card>
      )}

      {invoices.length === 0 ? (
        <EmptyState icon={<Receipt size={28} />} title="Noch keine Rechnungen" />
      ) : (
        <Card className="p-0">
          <ul>
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{invoice.periodLabel}</p>
                  <p className="text-xs text-muted">
                    Nr. {invoice.number} · fällig {formatDate(invoice.dueAt, locale)} · {invoice.method === 'sepa' ? 'SEPA' : 'Karte'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={tone[invoice.status]}>{label[invoice.status]}</Badge>
                  <span className="w-20 text-right font-semibold tabular-nums">{formatCurrency(invoice.amountCents, locale)}</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(invoice.number)}>
                    PDF
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Rechnung ${confirm ?? ''}`}
        description="Im fertigen Produkt wird hier eine PDF-Rechnung heruntergeladen. Im Prototyp ist der Download nicht hinterlegt."
        confirmLabel="Verstanden"
        onConfirm={() => undefined}
      />
    </div>
  );
}
