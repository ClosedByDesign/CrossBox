import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { Field, Input, Select } from '../../components/ui/form';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { TrendChart } from '../../components/charts/Charts';
import { useDb, useDemoStore } from '../../store';
import { savePersonalRecord } from '../../store/actions';
import { formatDate } from '../../lib/format';

function useMyRecords() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);

  return useMemo(() => {
    const mine = db.personalRecords.filter((r) => r.userId === userId);
    return db.lifts.map((lift) => {
      const entries = mine
        .filter((r) => r.liftId === lift.id)
        .sort((a, b) => a.achievedAt.localeCompare(b.achievedAt));
      const best = entries.reduce((max, entry) => Math.max(max, entry.valueKg), 0);
      const latest = entries[entries.length - 1] ?? null;
      const previous = entries[entries.length - 2] ?? null;
      return { lift, entries, best, latest, delta: latest && previous ? latest.valueKg - previous.valueKg : 0 };
    });
  }, [db, userId]);
}

function NewRecordDialog({
  open,
  onClose,
  liftId,
}: {
  open: boolean;
  onClose: () => void;
  liftId?: string;
}) {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const [lift, setLift] = useState(liftId ?? db.lifts[0]?.id ?? '');
  const [value, setValue] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Neuen Rekord eintragen"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const kg = Number(value.replace(',', '.'));
              if (!userId || !kg) return;
              savePersonalRecord(userId, lift, kg);
              const name = db.lifts.find((l) => l.id === lift)?.name ?? 'Übung';
              toast(`${name}: ${kg} kg als neuer Rekord gespeichert.`);
              setValue('');
              onClose();
            }}
          >
            Speichern
          </Button>
        </>
      }
    >
      <Field label="Übung" htmlFor="lift">
        <Select id="lift" value={lift} onChange={(e) => setLift(e.target.value)}>
          {db.lifts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Gewicht in kg" htmlFor="kg" hint="Dein bestes Ergebnis für eine saubere Wiederholung.">
        <Input id="kg" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="z. B. 92,5" />
      </Field>
    </Modal>
  );
}

export default function Records() {
  const records = useMyRecords();
  const locale = useDemoStore((s) => s.prefs.locale);
  const [dialogOpen, setDialogOpen] = useState(false);

  const withData = records.filter((r) => r.entries.length > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Persönliche Rekorde"
        subtitle="Deine besten Werte und wie sie sich entwickelt haben"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setDialogOpen(true)}>
            Rekord eintragen
          </Button>
        }
      />

      {withData.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={28} />}
          title="Noch keine Rekorde"
          description="Trage deinen ersten Wert ein – danach siehst du hier deinen Verlauf."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {records.map(({ lift, best, latest, delta, entries }) => (
            <Link key={lift.id} to={`/app/rekorde/${lift.id}`} className="card p-4 no-underline transition-colors hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{lift.name}</p>
                  <p className="text-xs text-muted">{lift.category}</p>
                </div>
                {delta > 0 && <Badge tone="success">+{delta} kg</Badge>}
              </div>
              <p className="mt-2 font-display text-3xl text-brand">
                {best ? `${best} kg` : '—'}
              </p>
              <p className="text-xs text-muted">
                {latest ? `zuletzt am ${formatDate(latest.achievedAt, locale)}` : 'noch kein Wert'} · {entries.length} Einträge
              </p>
            </Link>
          ))}
        </div>
      )}

      <NewRecordDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

export function RecordDetail() {
  const { liftId } = useParams();
  const records = useMyRecords();
  const locale = useDemoStore((s) => s.prefs.locale);
  const [dialogOpen, setDialogOpen] = useState(false);

  const record = records.find((r) => r.lift.id === liftId);
  if (!record) return <EmptyState title="Übung nicht gefunden" />;

  const chartData = record.entries.map((entry) => ({
    datum: formatDate(entry.achievedAt, locale, { day: '2-digit', month: 'short' }),
    kg: entry.valueKg,
  }));

  const percentages = [95, 90, 85, 80, 70, 60];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: '/app/rekorde', label: 'Zurück zu den Rekorden' }}
        title={record.lift.name}
        subtitle={record.lift.category}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setDialogOpen(true)}>
            Wert eintragen
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="label-base mb-0">Bestwert</p>
          <p className="font-display text-3xl text-brand">{record.best} kg</p>
        </Card>
        <Card>
          <p className="label-base mb-0">Letzter Eintrag</p>
          <p className="font-display text-3xl">{record.latest?.valueKg ?? '—'} kg</p>
          <p className="text-xs text-muted">{record.latest ? formatDate(record.latest.achievedAt, locale) : ''}</p>
        </Card>
        <Card>
          <p className="label-base mb-0">Einträge</p>
          <p className="font-display text-3xl">{record.entries.length}</p>
        </Card>
      </div>

      <SectionCard title="Verlauf" className="mb-4">
        {chartData.length > 1 ? (
          <TrendChart data={chartData} xKey="datum" yKey="kg" unit="kg" />
        ) : (
          <p className="text-sm text-muted">Ab dem zweiten Eintrag siehst du hier deine Entwicklung.</p>
        )}
      </SectionCard>

      <SectionCard title="Trainingsgewichte" description="Prozente vom Bestwert – praktisch für Kraftblöcke" className="mb-4">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {percentages.map((pct) => (
            <div key={pct} className="rounded-lg bg-elevated px-2 py-2 text-center">
              <p className="text-xs text-muted">{pct} %</p>
              <p className="font-display text-lg tabular-nums">{Math.round((record.best * pct) / 100 / 2.5) * 2.5} kg</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Historie">
        <ul className="flex flex-col">
          {[...record.entries].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
              <span className="font-display text-lg tabular-nums">{entry.valueKg} kg</span>
              <span className="text-xs text-muted">{formatDate(entry.achievedAt, locale, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <NewRecordDialog open={dialogOpen} onClose={() => setDialogOpen(false)} liftId={record.lift.id} />
    </div>
  );
}
