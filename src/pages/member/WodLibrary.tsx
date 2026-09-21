import { useMemo, useState } from 'react';
import { Dumbbell, Search } from 'lucide-react';
import { Badge, Card, Chip, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { Input } from '../../components/ui/form';
import { Modal } from '../../components/ui/Modal';
import { useDb, useDemoStore } from '../../store';
import { toDateKey, today } from '../../lib/clock';
import { formatDate } from '../../lib/format';
import type { Wod } from '../../data/types';

export function WodDetail({ wod, onClose }: { wod: Wod | null; onClose: () => void }) {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);

  const myResults = useMemo(() => {
    if (!wod) return [];
    return db.results
      .filter((r) => r.userId === userId && r.wodId === wod.id)
      .map((result) => ({ result, session: db.sessions.find((s) => s.id === result.sessionId) }))
      .sort((a, b) => (b.session?.date ?? '').localeCompare(a.session?.date ?? ''));
  }, [db, wod, userId]);

  if (!wod) return null;

  return (
    <Modal open={!!wod} onClose={onClose} title={wod.name} size="lg">
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone="brand">{wod.kind}</Badge>
        {wod.capMinutes && <Badge>{wod.capMinutes} Minuten</Badge>}
        {wod.benchmark && <Badge tone="info">Benchmark</Badge>}
      </div>
      {wod.description && <p className="mb-3 text-sm text-muted">{wod.description}</p>}

      <div className="flex flex-col gap-2">
        {wod.blocks.map((block) => (
          <div key={block.label} className="rounded-lg border border-line bg-elevated px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{block.label}</p>
            {block.lines.map((line) => (
              <p key={line} className="text-sm">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      {(wod.scalingRx || wod.scalingScaled) && (
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          {wod.scalingRx && (
            <p className="rounded-lg bg-brand/10 px-3 py-2">
              <strong className="text-brand">RX:</strong> {wod.scalingRx}
            </p>
          )}
          {wod.scalingScaled && (
            <p className="rounded-lg bg-elevated px-3 py-2">
              <strong>Scaled:</strong> {wod.scalingScaled}
            </p>
          )}
        </div>
      )}

      {myResults.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="label-base">Deine Ergebnisse</p>
          <ul className="flex flex-col gap-1">
            {myResults.map(({ result, session }) => (
              <li key={result.id} className="flex items-center justify-between text-sm">
                <span className="text-muted">{session ? formatDate(session.date, locale) : ''}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={result.rx ? 'brand' : 'neutral'}>{result.rx ? 'RX' : 'Scaled'}</Badge>
                  <span className="font-display text-base tabular-nums">{result.display}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

export default function WodLibrary() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'alle' | 'benchmark' | 'box'>('alle');
  const [selected, setSelected] = useState<Wod | null>(null);

  const todayKey = toDateKey(today());
  const todaysWod = db.sessions.filter((s) => s.date === todayKey && s.wodId).map((s) => db.wods.find((w) => w.id === s.wodId))[0];

  const upcoming = useMemo(
    () =>
      db.sessions
        .filter((s) => s.date > todayKey && s.wodId)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4)
        .map((session) => ({ session, wod: db.wods.find((w) => w.id === session.wodId) })),
    [db, todayKey],
  );

  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return db.wods
      .filter((w) => (filter === 'benchmark' ? w.benchmark : filter === 'box' ? !w.benchmark : true))
      .filter((w) => (term ? `${w.name} ${w.kind} ${w.description ?? ''}`.toLowerCase().includes(term) : true));
  }, [db.wods, query, filter]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="WODs" subtitle="Das Workout des Tages und die Bibliothek der Box" />

      {todaysWod && (
        <Card className="mb-4 border-brand/50">
          <p className="label-base mb-1">Heute</p>
          <button type="button" onClick={() => setSelected(todaysWod)} className="text-left">
            <p className="font-display text-2xl">{todaysWod.name}</p>
          </button>
          <div className="mt-2 flex flex-col gap-1">
            {todaysWod.blocks.map((block) => (
              <div key={block.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{block.label}</p>
                {block.lines.map((line) => (
                  <p key={line} className="text-sm">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {upcoming.length > 0 && (
        <SectionCard title="Demnächst" className="mb-4">
          <ul className="flex flex-col gap-1.5">
            {upcoming.map(({ session, wod }) => (
              <li key={session.id} className="flex items-center justify-between gap-3">
                <button type="button" className="text-sm font-semibold hover:text-brand" onClick={() => wod && setSelected(wod)}>
                  {wod?.name}
                </button>
                <span className="text-xs text-muted">
                  {formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="WOD suchen …" className="pl-9" />
        </div>
        <Chip active={filter === 'alle'} onClick={() => setFilter('alle')}>
          Alle
        </Chip>
        <Chip active={filter === 'benchmark'} onClick={() => setFilter('benchmark')}>
          Benchmarks
        </Chip>
        <Chip active={filter === 'box'} onClick={() => setFilter('box')}>
          Aus der Box
        </Chip>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Dumbbell size={26} />} title="Kein WOD gefunden" description="Versuch einen anderen Suchbegriff." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((wod) => (
            <button
              key={wod.id}
              type="button"
              onClick={() => setSelected(wod)}
              className="card p-3 text-left transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{wod.name}</p>
                <Badge tone={wod.benchmark ? 'info' : 'neutral'}>{wod.kind}</Badge>
              </div>
              {wod.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{wod.description}</p>}
            </button>
          ))}
        </div>
      )}

      <WodDetail wod={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
