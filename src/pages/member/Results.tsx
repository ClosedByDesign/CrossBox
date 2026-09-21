import { useMemo, useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { Field, Input, Select, Textarea } from '../../components/ui/form';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { saveResult } from '../../store/actions';
import { atTime, now } from '../../lib/clock';
import { formatDate } from '../../lib/format';
import type { ScoreType } from '../../data/types';

const SCORE_LABEL: Record<ScoreType, string> = {
  zeit: 'Zeit (mm:ss)',
  runden: 'Runden + Wiederholungen',
  gewicht: 'Gewicht in kg',
  reps: 'Wiederholungen',
};

function parseScore(type: ScoreType, raw: string): { value: number; display: string } | null {
  if (!raw.trim()) return null;
  if (type === 'zeit') {
    const [minutes, seconds] = raw.split(':').map((part) => Number(part.trim()));
    if (Number.isNaN(minutes)) return null;
    const total = minutes * 60 + (Number.isNaN(seconds) ? 0 : seconds);
    return { value: total, display: `${minutes}:${`${Number.isNaN(seconds) ? 0 : seconds}`.padStart(2, '0')}` };
  }
  const numeric = Number(raw.replace(',', '.'));
  if (Number.isNaN(numeric)) return null;
  const suffix = type === 'gewicht' ? ' kg' : type === 'runden' ? ' Runden' : ' Reps';
  return { value: numeric, display: `${numeric}${suffix}` };
}

export default function Results() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [scoreType, setScoreType] = useState<ScoreType>('zeit');
  const [score, setScore] = useState('');
  const [rx, setRx] = useState(true);
  const [note, setNote] = useState('');

  const { myResults, openSessions } = useMemo(() => {
    const attended = db.bookings
      .filter((b) => b.userId === userId && b.status === 'anwesend')
      .map((b) => db.sessions.find((s) => s.id === b.sessionId))
      .filter((s): s is NonNullable<typeof s> => !!s && !!s.wodId)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      myResults: db.results
        .filter((r) => r.userId === userId)
        .map((result) => {
          const session = db.sessions.find((s) => s.id === result.sessionId);
          const wod = db.wods.find((w) => w.id === result.wodId);
          const template = session ? db.courseTemplates.find((t) => t.id === session.templateId) : null;
          return { result, session, wod, template };
        })
        .filter((entry) => entry.session)
        .sort((a, b) => b.session!.date.localeCompare(a.session!.date)),
      openSessions: attended
        .filter((s) => !db.results.some((r) => r.sessionId === s.id && r.userId === userId))
        .filter((s) => atTime(s.date, s.startTime) < now())
        .slice(0, 10),
    };
  }, [db, userId]);

  const activeSession = openSessions.find((s) => s.id === sessionId) ?? openSessions[0] ?? null;
  const activeWod = activeSession ? db.wods.find((w) => w.id === activeSession.wodId) : null;

  const submit = () => {
    if (!userId || !activeSession) return;
    const parsed = parseScore(scoreType, score);
    if (!parsed) {
      toast('Bitte ein gültiges Ergebnis eintragen.', 'warning');
      return;
    }
    saveResult({
      sessionId: activeSession.id,
      userId,
      wodId: activeSession.wodId,
      scoreType,
      value: parsed.value,
      display: parsed.display,
      rx,
      note: note.trim() || undefined,
    });
    toast(`Ergebnis ${parsed.display} gespeichert.`);
    setScore('');
    setNote('');
    setOpen(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Meine Ergebnisse"
        subtitle="Was du in den Workouts geschafft hast"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setOpen(true)} disabled={openSessions.length === 0}>
            Ergebnis eintragen
          </Button>
        }
      />

      {openSessions.length > 0 && (
        <Card className="mb-4 border-brand/50 bg-brand/10">
          <p className="text-sm font-semibold">
            {openSessions.length} {openSessions.length === 1 ? 'Kurs wartet' : 'Kurse warten'} noch auf dein Ergebnis
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Zuletzt: {db.courseTemplates.find((t) => t.id === openSessions[0].templateId)?.name} am{' '}
            {formatDate(openSessions[0].date, locale)}
          </p>
        </Card>
      )}

      {myResults.length === 0 ? (
        <EmptyState icon={<Activity size={28} />} title="Noch keine Ergebnisse" description="Trage dein erstes Workout-Ergebnis ein." />
      ) : (
        <SectionCard title={`${myResults.length} Ergebnisse`}>
          <ul className="flex flex-col">
            {myResults.slice(0, 40).map(({ result, session, wod, template }) => (
              <li key={result.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{wod?.name ?? template?.name ?? 'Workout'}</p>
                  <p className="text-xs text-muted">
                    {session ? formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                    {result.note ? ` · ${result.note}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={result.rx ? 'brand' : 'neutral'}>{result.rx ? 'RX' : 'Scaled'}</Badge>
                  <span className="font-display text-lg tabular-nums">{result.display}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ergebnis eintragen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={submit}>
              Speichern
            </Button>
          </>
        }
      >
        {openSessions.length === 0 ? (
          <p className="text-sm text-muted">Aktuell wartet kein Kurs auf ein Ergebnis.</p>
        ) : (
          <>
            <Field label="Kurs" htmlFor="session">
              <Select id="session" value={activeSession?.id ?? ''} onChange={(e) => setSessionId(e.target.value)}>
                {openSessions.map((session) => {
                  const template = db.courseTemplates.find((t) => t.id === session.templateId);
                  const wod = db.wods.find((w) => w.id === session.wodId);
                  return (
                    <option key={session.id} value={session.id}>
                      {formatDate(session.date, locale, { day: '2-digit', month: '2-digit' })} · {template?.name}
                      {wod ? ` · ${wod.name}` : ''}
                    </option>
                  );
                })}
              </Select>
            </Field>

            {activeWod && (
              <div className="mb-4 rounded-lg bg-elevated px-3 py-2 text-xs">
                <p className="font-semibold text-brand">{activeWod.name}</p>
                {activeWod.blocks
                  .filter((b) => b.label.toLowerCase().includes('workout'))
                  .flatMap((b) => b.lines)
                  .map((line) => (
                    <p key={line}>{line}</p>
                  ))}
              </div>
            )}

            <Field label="Wertung" htmlFor="score-type">
              <Select id="score-type" value={scoreType} onChange={(e) => setScoreType(e.target.value as ScoreType)}>
                {Object.entries(SCORE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Ergebnis" htmlFor="score" hint={scoreType === 'zeit' ? 'Format mm:ss, z. B. 8:42' : undefined}>
              <Input id="score" value={score} onChange={(e) => setScore(e.target.value)} placeholder={scoreType === 'zeit' ? '8:42' : '12'} />
            </Field>

            <Field label="Skalierung">
              <div className="flex gap-2">
                <Button variant={rx ? 'primary' : 'secondary'} size="sm" onClick={() => setRx(true)}>
                  RX
                </Button>
                <Button variant={!rx ? 'primary' : 'secondary'} size="sm" onClick={() => setRx(false)}>
                  Scaled
                </Button>
              </div>
            </Field>

            <Field label="Notiz" htmlFor="note">
              <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Gewicht reduziert, Pull-ups gebändert" />
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}
