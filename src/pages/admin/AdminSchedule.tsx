import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarOff, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Field, Input, Select } from '../../components/ui/form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { WeekGrid } from '../../components/schedule/WeekGrid';
import { SessionRow } from '../../components/schedule/SessionRow';
import { emptyFilters, groupByDay, useWeekSessions } from '../../components/schedule/useSchedule';
import { useDb, useDemoStore } from '../../store';
import { addDays, isoWeekNumber, startOfWeek, toDateKey, today } from '../../lib/clock';
import { formatDate, formatTimeRange } from '../../lib/format';
import { courseColor } from '../../lib/courseColors';
import type { CourseTemplate, ScheduleException, Weekday } from '../../data/types';
import { isCoach } from '../../data/types';
import { MAIN_TENANT_ID } from '../../data/seed/static';

const WEEKDAY_LABEL: Record<number, string> = { 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa', 7: 'So' };

/* ------------------------------------------------------- Kursplanung */

export function AdminSchedule() {
  const locale = useDemoStore((s) => s.prefs.locale);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDays(startOfWeek(today()), weekOffset * 7), [weekOffset]);
  const sessions = useWeekSessions(weekStart, emptyFilters);

  const [selectedDay, setSelectedDay] = useState(toDateKey(today()));
  const daysInWeek = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));
  const activeDay = daysInWeek.includes(selectedDay) ? selectedDay : daysInWeek[0];
  const daySessions = groupByDay(sessions).get(activeDay) ?? [];

  const cancelled = sessions.filter((s) => s.session.status === 'abgesagt').length;
  const full = sessions.filter((s) => s.freeSpots === 0 && s.session.status !== 'abgesagt').length;

  return (
    <>
      <PageHeader
        title="Kursplanung"
        subtitle={`KW ${isoWeekNumber(weekStart)} · ${formatDate(weekStart, locale, { day: '2-digit', month: 'short' })} – ${formatDate(addDays(weekStart, 6), locale, { day: '2-digit', month: 'short' })} · ${sessions.length} Termine`}
        actions={
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setWeekOffset((w) => w - 1)} icon={<ChevronLeft size={15} />} aria-label="Vorherige Woche" />
            <Button size="sm" variant={weekOffset === 0 ? 'primary' : 'secondary'} onClick={() => setWeekOffset(0)}>
              Heute
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setWeekOffset((w) => w + 1)} icon={<ChevronRight size={15} />} aria-label="Nächste Woche" />
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <Badge tone="neutral">{sessions.length} Termine</Badge>
        {full > 0 && <Badge tone="danger">{full} ausgebucht</Badge>}
        {cancelled > 0 && <Badge tone="warning">{cancelled} abgesagt</Badge>}
        <span className="text-muted">Termine entstehen automatisch aus den Kursarten – Ausnahmen pflegst du unter „Feiertage & Absagen“.</span>
      </div>

      <div className="hidden md:block">
        <WeekGrid weekStart={weekStart} sessions={sessions} linkBase="/admin/kurs" />
      </div>
      <div className="md:hidden">
        <div className="mb-3 flex gap-1 overflow-x-auto">
          {daysInWeek.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`min-w-[2.6rem] flex-1 rounded-xl border px-1 py-2 text-center ${day === activeDay ? 'border-brand bg-brand/15 text-brand' : 'border-line'}`}
            >
              <span className="block text-[0.65rem] uppercase">{WEEKDAY_LABEL[index + 1]}</span>
              <span className="block font-display text-lg leading-none">{Number(day.slice(-2))}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {daySessions.length === 0 ? (
            <EmptyState title="Keine Kurse an diesem Tag" />
          ) : (
            daySessions.map((entry) => <SessionRow key={entry.session.id} entry={entry} to={`/admin/kurs/${entry.session.id}`} />)
          )}
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------------------- Kursarten */

export function AdminCourseTypes() {
  const db = useDb();
  const navigate = useNavigate();

  const rows = db.courseTemplates.filter((t) => t.tenantId === MAIN_TENANT_ID);

  const columns: Column<CourseTemplate>[] = [
    {
      key: 'name',
      header: 'Kursart',
      value: (row) => row.name,
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${courseColor(row.kind).dot}`} />
          <span className="font-semibold">{row.name}</span>
        </span>
      ),
    },
    { key: 'kind', header: 'Typ', value: (row) => row.kind, sortable: true, render: (row) => <Badge>{row.kind}</Badge>, hideOnMobile: true },
    {
      key: 'weekdays',
      header: 'Wochentage',
      value: (row) => row.weekdays.join(','),
      render: (row) => <span className="text-muted">{row.weekdays.map((d) => WEEKDAY_LABEL[d]).join(', ')}</span>,
    },
    { key: 'time', header: 'Uhrzeit', value: (row) => row.startTime, sortable: true, render: (row) => <span className="tabular-nums">{formatTimeRange(row.startTime, row.durationMin)}</span> },
    { key: 'capacity', header: 'Plätze', value: (row) => row.capacity, sortable: true, render: (row) => <span className="tabular-nums">{row.capacity}</span> },
    {
      key: 'coach',
      header: 'Trainer',
      value: (row) => row.coachId,
      render: (row) => {
        const coach = db.users.find((u) => u.id === row.coachId);
        return <span className="text-muted">{coach ? `${coach.firstName} ${coach.lastName}` : '—'}</span>;
      },
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      value: (row) => (row.active ? 'aktiv' : 'inaktiv'),
      render: (row) => <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Aktiv' : 'Pausiert'}</Badge>,
    },
  ];

  const weekly = rows.filter((r) => r.active).reduce((sum, r) => sum + r.weekdays.length, 0);

  return (
    <>
      <PageHeader
        title="Kursarten"
        subtitle={`${rows.length} Vorlagen · ergeben ${weekly} Termine pro Woche`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => navigate('/admin/kursarten/neu')}>
            Neue Kursart
          </Button>
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/kursarten/${row.id}`)}
        searchPlaceholder="Kursart suchen …"
      />
    </>
  );
}

export function AdminCourseTypeEdit() {
  const { templateId } = useParams();
  const db = useDb();
  const navigate = useNavigate();
  const createEntity = useDemoStore((s) => s.createEntity);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const removeEntity = useDemoStore((s) => s.removeEntity);

  const existing = db.courseTemplates.find((t) => t.id === templateId);
  const [form, setForm] = useState<Omit<CourseTemplate, 'id' | 'tenantId'>>({
    name: existing?.name ?? '',
    kind: existing?.kind ?? 'WOD',
    description: existing?.description ?? '',
    level: existing?.level ?? 'Alle Level',
    weekdays: existing?.weekdays ?? [1],
    startTime: existing?.startTime ?? '18:00',
    durationMin: existing?.durationMin ?? 60,
    capacity: existing?.capacity ?? 14,
    coachId: existing?.coachId ?? db.users.find(isCoach)?.id ?? '',
    active: existing?.active ?? true,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const coaches = db.users.filter(isCoach);
  const conflicts = db.courseTemplates.filter(
    (t) =>
      t.id !== templateId &&
      t.active &&
      t.coachId === form.coachId &&
      t.startTime === form.startTime &&
      t.weekdays.some((d) => form.weekdays.includes(d)),
  );

  const save = () => {
    if (!form.name.trim()) {
      toast('Bitte einen Namen vergeben.', 'warning');
      return;
    }
    if (existing) {
      updateEntity('courseTemplates', existing.id, form);
      toast(`${form.name} aktualisiert – die Termine wurden neu berechnet.`);
    } else {
      createEntity('courseTemplates', { id: `ct-${Date.now()}`, tenantId: MAIN_TENANT_ID, ...form });
      toast(`${form.name} angelegt – ${form.weekdays.length} Termine pro Woche.`);
    }
    navigate('/admin/kursarten');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        back={{ to: '/admin/kursarten', label: 'Zurück zu den Kursarten' }}
        title={existing ? `${existing.name} bearbeiten` : 'Neue Kursart'}
        subtitle="Aus einer Kursart entstehen automatisch alle wiederkehrenden Termine."
      />

      <Card className="mb-4">
        <Field label="Name" htmlFor="name">
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z. B. WOD" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Typ" htmlFor="kind">
            <Select id="kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CourseTemplate['kind'] })}>
              {['WOD', 'Open Gym', 'Weightlifting', 'Gymnastics', 'Endurance', 'Mobility', 'Teens', 'Fundamentals', 'Partner-WOD'].map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Level" htmlFor="level">
            <Select id="level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as CourseTemplate['level'] })}>
              <option value="Alle Level">Alle Level</option>
              <option value="Einsteiger">Einsteiger</option>
              <option value="Fortgeschritten">Fortgeschritten</option>
            </Select>
          </Field>
        </div>

        <Field label="Beschreibung" htmlFor="description">
          <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>

        <Field label="Wochentage">
          <div className="flex flex-wrap gap-1.5">
            {([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((day) => {
              const active = form.weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      weekdays: active ? form.weekdays.filter((d) => d !== day) : [...form.weekdays, day].sort(),
                    })
                  }
                  className={`h-10 w-12 rounded-lg border text-sm font-semibold ${active ? 'border-brand bg-brand/15 text-brand' : 'border-line text-muted'}`}
                >
                  {WEEKDAY_LABEL[day]}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Startzeit" htmlFor="start">
            <Input id="start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </Field>
          <Field label="Dauer (Min.)" htmlFor="duration">
            <Input
              id="duration"
              type="number"
              min={15}
              step={5}
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
            />
          </Field>
          <Field label="Max. Teilnehmer" htmlFor="capacity">
            <Input
              id="capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </Field>
        </div>

        <Field label="Trainer" htmlFor="coach" error={conflicts.length > 0 ? `${conflicts[0].name} liegt zur selben Zeit auf demselben Trainer.` : undefined}>
          <Select id="coach" value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })}>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName} {coach.lastName}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="active">
          <Select id="active" value={form.active ? 'aktiv' : 'inaktiv'} onChange={(e) => setForm({ ...form, active: e.target.value === 'aktiv' })}>
            <option value="aktiv">Aktiv – Termine werden erzeugt</option>
            <option value="inaktiv">Pausiert – keine neuen Termine</option>
          </Select>
        </Field>

        <div className="rounded-lg bg-elevated px-3 py-2 text-xs text-muted">
          Ergibt <strong className="text-ink">{form.weekdays.length} Termine pro Woche</strong> mit je {form.capacity} Plätzen ·{' '}
          {formatTimeRange(form.startTime, form.durationMin)} Uhr
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={save}>
          Speichern
        </Button>
        <Button variant="secondary" onClick={() => navigate('/admin/kursarten')}>
          Abbrechen
        </Button>
        {existing && (
          <Button variant="danger" className="ml-auto" onClick={() => setDeleteOpen(true)}>
            Kursart löschen
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Kursart löschen?"
        description="Künftige Termine dieser Kursart entfallen. Bereits stattgefundene Kurse und ihre Ergebnisse bleiben erhalten."
        confirmLabel="Löschen"
        tone="danger"
        onConfirm={() => {
          if (existing) removeEntity('courseTemplates', existing.id);
          toast('Kursart gelöscht.', 'info');
          navigate('/admin/kursarten');
        }}
      />
    </div>
  );
}

/* ------------------------------------------------- Feiertage/Absagen */

export function AdminExceptions() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const createEntity = useDemoStore((s) => s.createEntity);
  const removeEntity = useDemoStore((s) => s.removeEntity);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: toDateKey(today()), templateId: '', kind: 'feiertag' as ScheduleException['kind'], reason: '', substituteCoachId: '' });

  const rows = [...db.scheduleExceptions].sort((a, b) => b.date.localeCompare(a.date));
  const coaches = db.users.filter(isCoach);

  const kindLabel = { feiertag: 'Feiertag / geschlossen', absage: 'Einzelne Absage', vertretung: 'Vertretung' };
  const kindTone = { feiertag: 'danger', absage: 'warning', vertretung: 'info' } as const;

  return (
    <>
      <PageHeader
        title="Feiertage & Absagen"
        subtitle="Ausnahmen wirken auf die automatisch erzeugten Termine"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setOpen(true)}>
            Ausnahme anlegen
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={<CalendarOff size={28} />} title="Keine Ausnahmen hinterlegt" />
      ) : (
        <Card className="p-0">
          <ul>
            {rows.map((exception) => {
              const template = exception.templateId ? db.courseTemplates.find((t) => t.id === exception.templateId) : null;
              const substitute = exception.substituteCoachId ? db.users.find((u) => u.id === exception.substituteCoachId) : null;
              return (
                <li key={exception.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                  <span className="font-display text-lg tabular-nums">
                    {formatDate(exception.date, locale, { day: '2-digit', month: '2-digit' })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{exception.reason}</p>
                    <p className="text-xs text-muted">
                      {template ? template.name : 'Alle Kurse des Tages'}
                      {substitute ? ` · Vertretung: ${substitute.firstName} ${substitute.lastName}` : ''}
                    </p>
                  </div>
                  <Badge tone={kindTone[exception.kind]}>{kindLabel[exception.kind]}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      removeEntity('scheduleExceptions', exception.id);
                      toast('Ausnahme entfernt – die Termine gelten wieder regulär.', 'info');
                    }}
                  >
                    Entfernen
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ausnahme anlegen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.reason.trim()) {
                  toast('Bitte einen Grund angeben.', 'warning');
                  return;
                }
                createEntity('scheduleExceptions', {
                  id: `ex-${Date.now()}`,
                  tenantId: MAIN_TENANT_ID,
                  date: form.date,
                  templateId: form.templateId || null,
                  kind: form.kind,
                  reason: form.reason,
                  substituteCoachId: form.kind === 'vertretung' ? form.substituteCoachId || undefined : undefined,
                });
                toast('Ausnahme gespeichert – der Kursplan wurde aktualisiert.');
                setOpen(false);
              }}
            >
              Speichern
            </Button>
          </>
        }
      >
        <Field label="Art" htmlFor="kind">
          <Select id="kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ScheduleException['kind'] })}>
            <option value="feiertag">Feiertag / Box geschlossen</option>
            <option value="absage">Einzelnen Kurs absagen</option>
            <option value="vertretung">Trainer vertreten</option>
          </Select>
        </Field>
        <Field label="Datum" htmlFor="date">
          <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Kurs" htmlFor="template" hint={form.kind === 'feiertag' ? 'Bei Feiertagen entfallen alle Kurse des Tages.' : undefined}>
          <Select id="template" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} disabled={form.kind === 'feiertag'}>
            <option value="">Alle Kurse des Tages</option>
            {db.courseTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} · {template.startTime}
              </option>
            ))}
          </Select>
        </Field>
        {form.kind === 'vertretung' && (
          <Field label="Vertretung durch" htmlFor="substitute">
            <Select id="substitute" value={form.substituteCoachId} onChange={(e) => setForm({ ...form, substituteCoachId: e.target.value })}>
              <option value="">Bitte wählen</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Grund" htmlFor="reason">
          <Input id="reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="z. B. Tag der Deutschen Einheit" />
        </Field>
      </Modal>

      <SectionCard title="So funktioniert es" className="mt-4">
        <p className="text-sm text-muted">
          Der Kursplan entsteht automatisch aus den Kursarten. Ausnahmen legen sich darüber: Ein Feiertag sagt alle Kurse des Tages ab,
          eine Einzelabsage nur einen Termin, eine Vertretung tauscht den Trainer. Betroffene Mitglieder werden benachrichtigt.
        </p>
      </SectionCard>
    </>
  );
}
