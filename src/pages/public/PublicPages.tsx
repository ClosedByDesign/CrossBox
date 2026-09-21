import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Check, Clock, Mail, MapPin, Phone, Star, Users } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Badge, Button, Card, LinkButton, ProgressBar, SectionCard } from '../../components/ui';
import { Field, Input, Textarea, Checkbox } from '../../components/ui/form';
import { toast } from '../../components/ui/Toast';
import { WeekGrid } from '../../components/schedule/WeekGrid';
import { emptyFilters, groupByDay, useWeekSessions } from '../../components/schedule/useSchedule';
import { useDb, useDemoStore } from '../../store';
import { addDays, atTime, now, startOfWeek, toDateKey, today } from '../../lib/clock';
import { formatCurrency, formatDate, formatTimeRange } from '../../lib/format';
import { courseColor } from '../../lib/courseColors';
import { MAIN_TENANT_ID } from '../../data/seed/static';
import { isCoach } from '../../data/types';

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('mx-auto max-w-6xl px-4 py-12 sm:py-16', className)}>{children}</section>;
}

/* ------------------------------------------------------------ Startseite */

export function Home() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = now();
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;

  const todaysClasses = useMemo(() => {
    const todayKey = toDateKey(today());
    return db.sessions
      .filter((s) => s.date === todayKey && s.status !== 'abgesagt')
      .map((session) => {
        const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
        const coach = db.users.find((u) => u.id === session.coachId);
        const booked = db.bookings.filter((b) => b.sessionId === session.id && (b.status === 'gebucht' || b.status === 'anwesend')).length;
        return { session, template, coach, booked, start: atTime(session.date, session.startTime) };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [db]);

  const coaches = db.users.filter((u) => isCoach(u) && u.tenantId === MAIN_TENANT_ID);
  const plans = db.plans.slice(0, 3);
  const memberCount = db.users.filter((u) => u.role === 'member' && u.status === 'aktiv').length;
  const weeklyClasses = db.courseTemplates.filter((t) => t.active).reduce((sum, t) => sum + t.weekdays.length, 0);

  const testimonials = [
    { name: 'Jonas, seit 3 Jahren dabei', quote: 'Ich bin ohne jede Sporterfahrung angefangen. Nach dem Fundamentals-Kurs war ich sofort drin – und habe seitdem keine Woche ausgelassen.' },
    { name: 'Mia, Mitglied seit 2022', quote: 'Der Kursplan ist in zwei Klicks gebucht, das Workout steht morgens schon in der App. Genau so soll das sein.' },
    { name: 'Paul, Frühtrainierer', quote: 'Um 06:00 die Box aufsperren, um 07:15 am Schreibtisch. Die Trainer holen jeden ab, egal auf welchem Niveau.' },
  ];

  return (
    <>
      {/* Hero */}
      <div className="border-b border-line bg-surface">
        <Section className="py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-brand">CrossFit in {tenant.city}</p>
              <h1 className="text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
                Stärker werden.
                <br />
                Gemeinsam.
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted">
                {weeklyClasses} betreute Kurse pro Woche, von 06:00 bis 21:00 Uhr. Kleine Gruppen, echte Technikkorrektur und ein
                Trainingsplan, dem du folgen kannst – egal, ob du gerade anfängst oder seit Jahren dabei bist.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton to="/probetraining" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                  Kostenloses Probetraining
                </LinkButton>
                <LinkButton to="/kursplan" variant="secondary" size="lg">
                  Kursplan ansehen
                </LinkButton>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Users size={16} className="text-brand" /> {memberCount} Mitglieder
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={16} className="text-brand" /> {weeklyClasses} Kurse pro Woche
                </span>
                <span className="flex items-center gap-2">
                  <Star size={16} className="text-brand" /> seit {new Date(tenant.since).getFullYear()}
                </span>
              </div>
            </div>

            <Card className="lg:ml-auto lg:max-w-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg">Heute in der Box</h2>
                <span className="text-xs text-muted">{formatDate(current, locale, { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
              </div>
              <ul className="flex flex-col">
                {todaysClasses.slice(0, 6).map(({ session, template, coach, booked, start }) => {
                  const running = start <= current && new Date(start.getTime() + session.durationMin * 60_000) >= current;
                  const free = session.capacity - booked;
                  return (
                    <li key={session.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                      <span className="font-display text-base tabular-nums">{session.startTime}</span>
                      <span className={cn('h-2 w-2 rounded-full', courseColor(template.kind).dot)} />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {template.name}
                        <span className="block text-xs text-muted">{coach?.firstName}</span>
                      </span>
                      {running ? (
                        <Badge tone="live">läuft</Badge>
                      ) : free > 0 ? (
                        <span className="text-xs text-success">{free} frei</span>
                      ) : (
                        <span className="text-xs text-danger">voll</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Link to="/kursplan" className="mt-3 inline-block text-sm">
                Ganzen Wochenplan ansehen →
              </Link>
            </Card>
          </div>
        </Section>
      </div>

      {/* Kursarten */}
      <Section>
        <h2 className="text-3xl">Unsere Kurse</h2>
        <p className="mt-1 max-w-2xl text-muted">
          Vom Einsteigerkurs bis zur Wettkampfvorbereitung – jeder Kurs wird von einem Trainer geleitet, der dich kennt.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(new Map(db.courseTemplates.map((t) => [t.kind, t])).values()).map((template) => (
            <Card key={template.kind} className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', courseColor(template.kind).dot)} />
                <h3 className="text-base">{template.kind}</h3>
              </div>
              <p className="flex-1 text-sm text-muted">{template.description}</p>
              <p className="mt-3 text-xs text-muted">
                {template.durationMin} Minuten · {template.level} · max. {template.capacity} Teilnehmer
              </p>
            </Card>
          ))}
        </div>
        <LinkButton to="/kurse" variant="secondary" className="mt-6">
          Alle Kursarten im Detail
        </LinkButton>
      </Section>

      {/* Trainer */}
      <div className="border-y border-line bg-surface">
        <Section>
          <h2 className="text-3xl">Das Team</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.slice(0, 3).map((coach) => (
              <Card key={coach.id}>
                <div
                  className="mb-3 h-32 rounded-lg"
                  style={{ background: `linear-gradient(140deg, hsl(${coach.avatarHue} 55% 40%), hsl(${(coach.avatarHue + 45) % 360} 45% 25%))` }}
                />
                <h3 className="text-lg">
                  {coach.firstName} {coach.lastName}
                </h3>
                <p className="text-xs text-brand">{coach.headline}</p>
                <p className="mt-2 text-sm text-muted">{coach.bio}</p>
              </Card>
            ))}
          </div>
          <LinkButton to="/trainer" variant="secondary" className="mt-6">
            Ganzes Trainerteam
          </LinkButton>
        </Section>
      </div>

      {/* Preise */}
      <Section>
        <h2 className="text-3xl">Mitgliedschaften</h2>
        <p className="mt-1 text-muted">Keine versteckten Kosten. Monatlich abgebucht, jederzeit wechselbar.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={cn('flex flex-col', plan.highlight && 'border-brand ring-1 ring-brand')}>
              {plan.highlight && <Badge tone="brand" className="mb-2 self-start">Beliebteste Wahl</Badge>}
              <h3 className="text-xl">{plan.name}</h3>
              <p className="mt-1 font-display text-3xl text-brand">{formatCurrency(plan.priceCents, locale)}</p>
              <p className="text-xs text-muted">{plan.interval === 'monat' ? 'pro Monat' : 'einmalig'}</p>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>
              <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <LinkButton to="/preise" variant="secondary" className="mt-6">
          Alle Tarife vergleichen
        </LinkButton>
      </Section>

      {/* Stimmen */}
      <div className="border-y border-line bg-surface">
        <Section>
          <h2 className="text-3xl">Was unsere Mitglieder sagen</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name}>
                <div className="mb-2 flex gap-0.5 text-brand">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm">„{item.quote}“</p>
                <p className="mt-2 text-xs text-muted">{item.name}</p>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      {/* CTA */}
      <Section className="text-center">
        <h2 className="text-3xl">Komm vorbei und probier es aus</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted">
          Das erste Training ist kostenlos und unverbindlich. Du brauchst nur Sportzeug und etwas zu trinken – um alles andere kümmern
          wir uns.
        </p>
        <LinkButton to="/probetraining" variant="primary" size="lg" className="mt-6">
          Probetraining vereinbaren
        </LinkButton>
      </Section>
    </>
  );
}

/* ----------------------------------------------------- Öffentlicher Plan */

export function PublicSchedule() {
  const locale = useDemoStore((s) => s.prefs.locale);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDays(startOfWeek(today()), weekOffset * 7), [weekOffset]);
  const sessions = useWeekSessions(weekStart, emptyFilters);
  const [selectedDay, setSelectedDay] = useState(toDateKey(today()));

  const daysInWeek = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));
  const activeDay = daysInWeek.includes(selectedDay) ? selectedDay : daysInWeek[0];
  const daySessions = groupByDay(sessions).get(activeDay) ?? [];

  return (
    <Section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Kursplan</h1>
          <p className="mt-1 text-muted">
            {formatDate(weekStart, locale, { day: '2-digit', month: 'long' })} –{' '}
            {formatDate(addDays(weekStart, 6), locale, { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            ← Woche
          </Button>
          <Button variant={weekOffset === 0 ? 'primary' : 'secondary'} size="sm" onClick={() => setWeekOffset(0)}>
            Diese Woche
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Woche →
          </Button>
        </div>
      </div>

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-brand/40 bg-brand/5">
        <p className="text-sm">Zum Buchen brauchst du ein Mitgliedskonto – oder du kommst zum kostenlosen Probetraining.</p>
        <div className="flex gap-2">
          <LinkButton to="/login" variant="secondary" size="sm">
            Anmelden
          </LinkButton>
          <LinkButton to="/probetraining" variant="primary" size="sm">
            Probetraining
          </LinkButton>
        </div>
      </Card>

      <div className="hidden md:block">
        <WeekGrid weekStart={weekStart} sessions={sessions} linkBase="/kursplan" />
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
        <ul className="flex flex-col gap-2">
          {daySessions.map((entry) => (
            <li key={entry.session.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
              <span className="font-display text-lg tabular-nums">{entry.session.startTime}</span>
              <span className={cn('h-8 w-1 rounded-full', courseColor(entry.template.kind).bar)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{entry.template.name}</span>
                <span className="block text-xs text-muted">
                  {formatTimeRange(entry.session.startTime, entry.session.durationMin)} · {entry.coachName}
                </span>
              </span>
              <span className="text-xs text-muted">{entry.freeSpots > 0 ? `${entry.freeSpots} frei` : 'voll'}</span>
            </li>
          ))}
          {daySessions.length === 0 && <p className="text-sm text-muted">An diesem Tag finden keine Kurse statt.</p>}
        </ul>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- Kursarten */

export function Classes() {
  const db = useDb();
  const kinds = Array.from(new Map(db.courseTemplates.map((t) => [t.kind, t])).values());

  return (
    <Section>
      <h1 className="text-3xl">Kursangebot</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Alle Kurse dauern zwischen 45 und 90 Minuten und werden durchgehend betreut. Wenn du neu bist, starte mit Fundamentals.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {kinds.map((template) => {
          const times = db.courseTemplates.filter((t) => t.kind === template.kind);
          const coach = db.users.find((u) => u.id === template.coachId);
          return (
            <Card key={template.kind}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={cn('h-3 w-3 rounded-full', courseColor(template.kind).dot)} />
                    <h2 className="text-xl">{template.kind}</h2>
                    <Badge tone={template.level === 'Einsteiger' ? 'success' : template.level === 'Fortgeschritten' ? 'warning' : 'neutral'}>
                      {template.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted">{template.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    {template.durationMin} Minuten · max. {template.capacity} Teilnehmer · meist {coach?.firstName} {coach?.lastName}
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Termine</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {times.map((item) =>
                      item.weekdays.map((day) => (
                        <li
                          key={`${item.id}-${day}`}
                          className="rounded-md bg-elevated px-2 py-1 text-xs tabular-nums"
                        >
                          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][day - 1]} {item.startTime}
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Preise */

export function Pricing() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);

  return (
    <Section>
      <h1 className="text-3xl">Mitgliedschaften</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Alle Preise verstehen sich pro Monat inklusive Mehrwertsteuer. Einmalige Aufnahmegebühr: 49 €. Pausieren ist bis zu drei Monate
        im Jahr kostenfrei möglich.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.plans.map((plan) => (
          <Card key={plan.id} className={cn('flex flex-col', plan.highlight && 'border-brand ring-1 ring-brand')}>
            {plan.highlight && <Badge tone="brand" className="mb-2 self-start">Beliebteste Wahl</Badge>}
            <h2 className="text-xl">{plan.name}</h2>
            <p className="mt-1 font-display text-3xl text-brand">{formatCurrency(plan.priceCents, locale)}</p>
            <p className="text-xs text-muted">{plan.interval === 'monat' ? 'pro Monat' : 'einmalig'}</p>
            <p className="mt-2 text-sm text-muted">{plan.description}</p>
            <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
              Mindestlaufzeit: {plan.minTermMonths > 0 ? `${plan.minTermMonths} Monate` : 'keine'} · Kündigungsfrist 1 Monat
            </p>
            <LinkButton to="/registrieren" variant={plan.highlight ? 'primary' : 'secondary'} className="mt-3" block>
              Mitglied werden
            </LinkButton>
          </Card>
        ))}
      </div>

      <SectionCard title="Häufige Fragen zu den Preisen" className="mt-8">
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-semibold">Gibt es eine Mindestlaufzeit?</dt>
            <dd className="text-muted">Je nach Tarif zwischen 3 und 12 Monaten. Der 10er-Block ist komplett ohne Laufzeit.</dd>
          </div>
          <div>
            <dt className="font-semibold">Was ist, wenn ich verletzt bin?</dt>
            <dd className="text-muted">Dann pausieren wir deinen Vertrag – bis zu drei Monate im Jahr kostenfrei, die Laufzeit verlängert sich entsprechend.</dd>
          </div>
          <div>
            <dt className="font-semibold">Brauche ich den Fundamentals-Kurs?</dt>
            <dd className="text-muted">Ohne CrossFit-Erfahrung ja. Er dauert sechs Termine und kostet einmalig 149 €, danach kannst du alle Kurse besuchen.</dd>
          </div>
        </dl>
      </SectionCard>
    </Section>
  );
}

/* --------------------------------------------------------------- Trainer */

export function Trainers() {
  const db = useDb();
  const coaches = db.users.filter((u) => isCoach(u) && u.tenantId === MAIN_TENANT_ID);

  return (
    <Section>
      <h1 className="text-3xl">Trainerteam</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Alle unsere Trainer sind lizenziert und bilden sich regelmäßig weiter. Wichtiger noch: Sie kennen dich und deine Ziele.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((coach) => {
          const classes = db.courseTemplates.filter((t) => t.coachId === coach.id);
          return (
            <Card key={coach.id}>
              <div
                className="mb-3 h-36 rounded-lg"
                style={{ background: `linear-gradient(140deg, hsl(${coach.avatarHue} 55% 42%), hsl(${(coach.avatarHue + 45) % 360} 45% 24%))` }}
              />
              <h2 className="text-lg">
                {coach.firstName} {coach.lastName}
              </h2>
              <p className="text-xs text-brand">{coach.headline}</p>
              <p className="mt-2 text-sm text-muted">{coach.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {coach.certifications?.map((cert) => (
                  <Badge key={cert} tone="info">
                    {cert}
                  </Badge>
                ))}
              </div>
              {classes.length > 0 && (
                <p className="mt-3 text-xs text-muted">
                  Kurse: {Array.from(new Set(classes.map((c) => c.name))).join(', ')}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- Über uns */

export function About() {
  const db = useDb();
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;

  return (
    <Section>
      <h1 className="text-3xl">Über uns</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted">
          <p>
            {tenant.name} gibt es seit {new Date(tenant.since).getFullYear()}. Angefangen haben wir mit einer Handvoll Leuten in einer
            alten Lagerhalle am Rhein – heute trainieren bei uns über {db.users.filter((u) => u.role === 'member').length} Mitglieder,
            vom Studenten bis zur Großmutter, vom Anfänger bis zum Regionalwettkämpfer.
          </p>
          <p>
            Uns eint eine Überzeugung: Training muss zu deinem Leben passen, nicht umgekehrt. Deshalb starten unsere Kurse ab 06:00 Uhr
            und laufen bis 21:00 Uhr, deshalb skalieren wir jedes Workout auf dein Niveau, und deshalb kennt jeder Trainer deinen Namen.
          </p>
          <p>
            Auf 720 m² findest du zwölf Rig-Stationen, acht Ruderergometer, vier Bikes, Gewichtheberplattformen und eine Außenfläche
            direkt am Wasser. Duschen, Umkleiden und Kaffee gibt es selbstverständlich auch.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Technik zuerst', text: 'Erst die Bewegung, dann das Gewicht. Immer.' },
              { title: 'Jeder ist willkommen', text: 'Wir skalieren jedes Workout – niemand bleibt zurück.' },
              { title: 'Gemeinsam statt allein', text: 'Der letzte im Workout bekommt den lautesten Applaus.' },
            ].map((value) => (
              <Card key={value.title}>
                <p className="font-display text-base text-ink">{value.title}</p>
                <p className="mt-1 text-xs">{value.text}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <h2 className="text-lg">Die Box in Zahlen</h2>
          <dl className="mt-3 flex flex-col gap-3 text-sm">
            {[
              ['Gegründet', new Date(tenant.since).getFullYear().toString()],
              ['Fläche', '720 m²'],
              ['Kurse pro Woche', String(db.courseTemplates.filter((t) => t.active).reduce((sum, t) => sum + t.weekdays.length, 0))],
              ['Trainer', String(db.users.filter((u) => isCoach(u) && u.tenantId === MAIN_TENANT_ID).length)],
              ['Mitglieder', String(db.users.filter((u) => u.role === 'member' && u.status === 'aktiv').length)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                <dt className="text-muted">{label}</dt>
                <dd className="font-display text-lg">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------- Probetraining */

export function Trial() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const createEntity = useDemoStore((s) => s.createEntity);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', consent: false });

  const upcoming = useMemo(() => {
    const current = now();
    return db.sessions
      .filter((s) => s.status === 'geplant' && atTime(s.date, s.startTime) > current)
      .map((session) => {
        const template = db.courseTemplates.find((t) => t.id === session.templateId)!;
        const booked = db.bookings.filter((b) => b.sessionId === session.id && (b.status === 'gebucht' || b.status === 'anwesend')).length;
        return { session, template, free: session.capacity - booked };
      })
      .filter((entry) => entry.free > 0 && (entry.template.kind === 'WOD' || entry.template.kind === 'Fundamentals'))
      .sort((a, b) => (a.session.date + a.session.startTime).localeCompare(b.session.date + b.session.startTime))
      .slice(0, 8);
  }, [db]);

  const selected = upcoming.find((entry) => entry.session.id === sessionId);

  return (
    <Section className="max-w-3xl">
      <h1 className="text-3xl">Kostenloses Probetraining</h1>
      <p className="mt-1 text-muted">
        Such dir einen Termin aus, hinterlass uns deine Kontaktdaten – wir melden uns innerhalb eines Tages und erklären dir alles
        Weitere. Mitbringen musst du nur Sportzeug.
      </p>

      <div className="mb-6 mt-6 flex items-center gap-2">
        {[1, 2, 3].map((value) => (
          <div key={value} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm',
                step >= value ? 'bg-brand text-brand-ink' : 'bg-elevated text-muted',
              )}
            >
              {value}
            </span>
            <span className={cn('text-xs', step >= value ? 'text-ink' : 'text-muted')}>
              {value === 1 ? 'Termin' : value === 2 ? 'Kontakt' : 'Fertig'}
            </span>
            {value < 3 && <span className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h2 className="text-lg">Wann passt es dir?</h2>
          <p className="mb-3 text-sm text-muted">Diese Kurse eignen sich gut zum Einstieg:</p>
          <ul className="flex flex-col gap-2">
            {upcoming.map(({ session, template, free }) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setSessionId(session.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    sessionId === session.id ? 'border-brand bg-brand/10' : 'border-line hover:border-brand/50',
                  )}
                >
                  <span className="font-display text-lg tabular-nums">{session.startTime}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{template.name}</span>
                    <span className="block text-xs text-muted">
                      {formatDate(session.date, locale, { weekday: 'long', day: '2-digit', month: 'long' })} ·{' '}
                      {formatTimeRange(session.startTime, session.durationMin)}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-success">{free === 1 ? '1 Platz frei' : `${free} Plätze frei`}</span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="primary" className="mt-4" disabled={!sessionId} onClick={() => setStep(2)}>
            Weiter
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="text-lg">Deine Kontaktdaten</h2>
          {selected && (
            <p className="mb-3 rounded-lg bg-brand/10 px-3 py-2 text-sm">
              Gewählter Termin: <strong>{selected.template.name}</strong> am{' '}
              {formatDate(selected.session.date, locale, { weekday: 'long', day: '2-digit', month: 'long' })} um{' '}
              {selected.session.startTime} Uhr
            </p>
          )}
          <Field label="Name" htmlFor="trial-name">
            <Input id="trial-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-Mail" htmlFor="trial-mail">
              <Input id="trial-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefon (optional)" htmlFor="trial-phone">
              <Input id="trial-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Erzähl uns kurz von dir (optional)" htmlFor="trial-message" hint="Sporterfahrung, Ziele, Einschränkungen">
            <Textarea id="trial-message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </Field>
          <Checkbox
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            label={
              <span className="text-xs text-muted">
                Ich bin damit einverstanden, dass meine Angaben zur Kontaktaufnahme gespeichert werden. Mehr dazu in der{' '}
                <Link to="/datenschutz">Datenschutzerklärung</Link>.
              </span>
            }
          />
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button
              variant="primary"
              disabled={!form.name || !form.email || !form.consent}
              onClick={() => {
                createEntity('trialRequests', {
                  id: `tr-${Date.now()}`,
                  tenantId: MAIN_TENANT_ID,
                  name: form.name,
                  email: form.email,
                  phone: form.phone || undefined,
                  preferredDate: selected?.session.date,
                  message: form.message || undefined,
                  status: 'neu',
                  createdAt: now().toISOString(),
                });
                toast('Anfrage gesendet – wir melden uns innerhalb eines Tages.');
                setStep(3);
              }}
            >
              Anfrage senden
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={28} />
          </div>
          <h2 className="text-2xl">Bis bald in der Box!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Wir haben deine Anfrage erhalten und melden uns per E-Mail bei dir. Komm bitte 15 Minuten früher, damit wir dir alles zeigen
            können. Mitbringen: Sportzeug, Hallenschuhe, Handtuch und etwas zu trinken.
          </p>
          {selected && (
            <p className="mt-3 text-sm">
              <strong>{selected.template.name}</strong> am{' '}
              {formatDate(selected.session.date, locale, { weekday: 'long', day: '2-digit', month: 'long' })} um{' '}
              {selected.session.startTime} Uhr
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Zur Startseite
            </Button>
            <Button variant="primary" onClick={() => navigate('/kursplan')}>
              Kursplan ansehen
            </Button>
          </div>
        </Card>
      )}
    </Section>
  );
}

/* --------------------------------------------------------------- Kontakt */

export function Contact() {
  const db = useDb();
  const createEntity = useDemoStore((s) => s.createEntity);
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  return (
    <Section>
      <h1 className="text-3xl">Kontakt & Anfahrt</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-lg">So erreichst du uns</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={17} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  {tenant.street}
                  <br />
                  {tenant.zip} {tenant.city}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={17} className="shrink-0 text-brand" />
                {tenant.phone}
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={17} className="shrink-0 text-brand" />
                {tenant.email}
              </li>
            </ul>
            <div className="mt-4 h-44 rounded-lg border border-line bg-elevated p-3">
              <svg viewBox="0 0 320 160" className="h-full w-full" role="img" aria-label="Schematische Anfahrtskarte">
                <rect width="320" height="160" fill="rgb(var(--c-elevated))" />
                <path d="M0 110 L320 92" stroke="rgb(var(--c-line))" strokeWidth="14" />
                <path d="M60 0 L96 160" stroke="rgb(var(--c-line))" strokeWidth="9" />
                <path d="M235 0 L210 160" stroke="rgb(var(--c-line))" strokeWidth="9" />
                <path d="M0 40 Q160 70 320 30" stroke="rgb(var(--c-info) / 0.5)" strokeWidth="16" fill="none" />
                <text x="14" y="34" fontSize="9" fill="rgb(var(--c-muted))">Rhein</text>
                <circle cx="168" cy="104" r="9" fill="rgb(var(--c-brand))" />
                <text x="182" y="108" fontSize="11" fill="rgb(var(--c-ink))" fontWeight="bold">
                  {tenant.name.replace('CrossFit ', '')}
                </text>
                <text x="100" y="150" fontSize="9" fill="rgb(var(--c-muted))">Hafenstraße</text>
              </svg>
            </div>
            <p className="mt-2 text-xs text-muted">
              Straßenbahn Linie 16 bis „Ubierring“, von dort 4 Minuten zu Fuß. Kostenlose Parkplätze direkt vor der Box.
            </p>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg">
              <Clock size={18} className="text-brand" /> Öffnungszeiten
            </h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {weekdays.map((label, index) => {
                const hours = tenant.openingHours.find((h) => h.weekday === index + 1);
                return (
                  <li key={label} className="flex items-center justify-between border-b border-line pb-1.5 last:border-0">
                    <span>{label}</span>
                    <span className="tabular-nums text-muted">{hours ? `${hours.from} – ${hours.to}` : 'geschlossen'}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg">Schreib uns</h2>
          <p className="mb-3 text-sm text-muted">Wir antworten in der Regel innerhalb eines Werktags.</p>
          <Field label="Name" htmlFor="contact-name">
            <Input id="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="E-Mail" htmlFor="contact-mail">
            <Input id="contact-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Nachricht" htmlFor="contact-message">
            <Textarea id="contact-message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </Field>
          <Button
            variant="primary"
            disabled={!form.name || !form.email || !form.message}
            onClick={() => {
              createEntity('supportTickets', {
                id: `st-${Date.now()}`,
                tenantId: MAIN_TENANT_ID,
                subject: `Kontaktformular: ${form.name}`,
                status: 'offen',
                priority: 'normal',
                createdAt: now().toISOString(),
                messages: [
                  { id: `stm-${Date.now()}`, from: 'box', authorName: form.name, body: form.message, at: now().toISOString() },
                ],
              });
              setForm({ name: '', email: '', message: '' });
              toast('Nachricht gesendet – sie liegt jetzt im Posteingang der Box.');
            }}
          >
            Nachricht senden
          </Button>
        </Card>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------- FAQ */

const FAQ_ITEMS = [
  {
    category: 'Einstieg',
    question: 'Ich habe noch nie CrossFit gemacht – kann ich trotzdem kommen?',
    answer:
      'Ja, und zwar genau deshalb. Fast alle bei uns haben ohne Vorerfahrung angefangen. Du startest mit dem Fundamentals-Kurs über sechs Termine, dort lernst du alle Grundbewegungen in kleiner Gruppe.',
  },
  {
    category: 'Einstieg',
    question: 'Muss ich fit sein, um anzufangen?',
    answer: 'Nein. Jedes Workout wird auf dein Niveau angepasst – das nennen wir Skalieren. Fit wirst du bei uns, nicht vorher.',
  },
  {
    category: 'Einstieg',
    question: 'Was soll ich mitbringen?',
    answer: 'Sportkleidung, saubere Hallenschuhe, ein Handtuch und etwas zu trinken. Alles Weitere stellen wir.',
  },
  {
    category: 'Mitgliedschaft',
    question: 'Wie lange bin ich gebunden?',
    answer: 'Je nach Tarif drei bis zwölf Monate. Der 10er-Block läuft ganz ohne Laufzeit, die flexible Flat ist monatlich kündbar.',
  },
  {
    category: 'Mitgliedschaft',
    question: 'Kann ich meine Mitgliedschaft pausieren?',
    answer: 'Ja, bis zu drei Monate pro Jahr kostenfrei – bei Urlaub, Verletzung oder wenn es beruflich gerade nicht passt.',
  },
  {
    category: 'Training',
    question: 'Wie buche ich einen Kurs?',
    answer: 'Über die App oder die Website. Kurse sind sieben Tage im Voraus buchbar, Stornieren ist bis zwei Stunden vorher kostenfrei möglich.',
  },
  {
    category: 'Training',
    question: 'Was passiert, wenn ein Kurs ausgebucht ist?',
    answer: 'Dann setzt du dich auf die Warteliste. Storniert jemand, rückst du automatisch nach und bekommst eine Benachrichtigung.',
  },
  {
    category: 'Training',
    question: 'Gibt es Umkleiden und Duschen?',
    answer: 'Ja, getrennte Umkleiden mit Duschen und abschließbaren Spinden. Handtücher bringst du selbst mit.',
  },
  {
    category: 'Kündigung',
    question: 'Wie kündige ich?',
    answer: 'Direkt in der App unter Mitgliedschaft, mit einem Monat Frist zum Laufzeitende. Kein Brief, kein Anruf nötig.',
  },
];

export function Faq() {
  const [category, setCategory] = useState('alle');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const categories = ['alle', ...Array.from(new Set(FAQ_ITEMS.map((item) => item.category)))];
  const items = FAQ_ITEMS.filter((item) => category === 'alle' || item.category === category);

  return (
    <Section className="max-w-3xl">
      <h1 className="text-3xl">Häufige Fragen</h1>
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold',
              category === item ? 'border-brand bg-brand/15 text-brand' : 'border-line text-muted hover:text-ink',
            )}
          >
            {item === 'alle' ? 'Alle' : item}
          </button>
        ))}
      </div>
      <Card className="p-0">
        {items.map((item, index) => (
          <div key={item.question} className="border-b border-line last:border-0">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-sm font-semibold">{item.question}</span>
              <span className="text-xl text-muted">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && <p className="px-4 pb-4 text-sm text-muted">{item.answer}</p>}
          </div>
        ))}
      </Card>
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">Deine Frage war nicht dabei?</p>
        <LinkButton to="/kontakt" variant="primary" size="sm">
          Schreib uns
        </LinkButton>
      </Card>
    </Section>
  );
}

/* ------------------------------------------------------------ Rechtliches */

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section className="max-w-3xl">
      <h1 className="text-3xl">{title}</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted">{children}</div>
      <Card className="mt-8 border-warning/40 bg-warning/10 text-xs text-warning">
        Dieser Text ist ein Platzhalter für den Prototyp und ersetzt keine Rechtsberatung. Vor dem Livegang müssen die Angaben von einer
        Fachperson geprüft werden.
      </Card>
    </Section>
  );
}

export function Imprint() {
  const db = useDb();
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;
  return (
    <LegalPage title="Impressum">
      <div>
        <p className="font-semibold text-ink">Angaben gemäß § 5 TMG</p>
        <p>
          {tenant.name} GmbH
          <br />
          {tenant.street}
          <br />
          {tenant.zip} {tenant.city}
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">Vertreten durch</p>
        <p>Petra Vogel (Geschäftsführerin)</p>
      </div>
      <div>
        <p className="font-semibold text-ink">Kontakt</p>
        <p>
          Telefon: {tenant.phone}
          <br />
          E-Mail: {tenant.email}
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">Registereintrag</p>
        <p>Eingetragen im Handelsregister, Amtsgericht Köln, HRB 123456</p>
      </div>
      <div>
        <p className="font-semibold text-ink">Umsatzsteuer-ID</p>
        <p>DE123456789</p>
      </div>
      <div>
        <p className="font-semibold text-ink">Verbraucherstreitbeilegung</p>
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </div>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <div>
        <p className="font-semibold text-ink">1. Verantwortliche Stelle</p>
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist der im Impressum genannte Betreiber.</p>
      </div>
      <div>
        <p className="font-semibold text-ink">2. Welche Daten wir verarbeiten</p>
        <p>
          Bei der Mitgliedschaft: Name, Anschrift, Geburtsdatum, Kontaktdaten, Zahlungsdaten sowie Buchungs- und Anwesenheitsdaten. Bei
          Kontakt- und Probetrainingsanfragen: die von dir angegebenen Kontaktdaten und dein Nachrichtentext.
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">3. Zweck und Rechtsgrundlage</p>
        <p>
          Die Verarbeitung erfolgt zur Erfüllung des Mitgliedschaftsvertrags (Art. 6 Abs. 1 lit. b DSGVO), zur Erfüllung gesetzlicher
          Pflichten (lit. c) sowie auf Grundlage deiner Einwilligung (lit. a), etwa bei optionalen Cookies.
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">4. Speicherdauer</p>
        <p>
          Vertrags- und Abrechnungsdaten werden nach Ende der Mitgliedschaft entsprechend den handels- und steuerrechtlichen Fristen
          aufbewahrt, Trainingsdaten auf Wunsch früher gelöscht.
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">5. Deine Rechte</p>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
          Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen.
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">6. Cookies</p>
        <p>
          Wir setzen technisch notwendige Cookies ein, damit Anmeldung und Buchung funktionieren. Optionale Statistik-Cookies werden nur
          mit deiner Einwilligung gesetzt; deine Auswahl kannst du jederzeit ändern.
        </p>
      </div>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <div>
        <p className="font-semibold text-ink">§ 1 Geltungsbereich</p>
        <p>Diese Bedingungen gelten für alle Mitgliedschaften, Kursbuchungen und Käufe im Shop der Box.</p>
      </div>
      <div>
        <p className="font-semibold text-ink">§ 2 Mitgliedschaft und Laufzeit</p>
        <p>
          Die Mitgliedschaft beginnt mit dem vereinbarten Datum und läuft über die im gewählten Tarif genannte Mindestlaufzeit. Sie
          verlängert sich danach monatlich, sofern nicht mit einer Frist von einem Monat gekündigt wird.
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">§ 3 Kursbuchung und Stornierung</p>
        <p>
          Kurse sind sieben Tage im Voraus buchbar. Eine kostenfreie Stornierung ist bis zwei Stunden vor Kursbeginn möglich. Bei späterer
          Absage oder Nichterscheinen wird die Einheit angerechnet.
        </p>
      </div>
      <div>
        <p className="font-semibold text-ink">§ 4 Pausieren</p>
        <p>Die Mitgliedschaft kann bis zu drei Monate pro Kalenderjahr kostenfrei pausiert werden. Die Laufzeit verlängert sich entsprechend.</p>
      </div>
      <div>
        <p className="font-semibold text-ink">§ 5 Hausordnung und Haftung</p>
        <p>
          Die Teilnahme erfolgt auf eigene Verantwortung. Anweisungen der Trainer ist Folge zu leisten. Für mitgebrachte Wertsachen wird
          keine Haftung übernommen.
        </p>
      </div>
    </LegalPage>
  );
}

/* Kleine Hilfskomponente, die in Home verwendet wird */
export function CapacityHint({ booked, capacity }: { booked: number; capacity: number }) {
  return (
    <div className="w-20">
      <ProgressBar value={booked} max={capacity} />
    </div>
  );
}
