import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Mail } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Avatar, Badge, Button, Card, LinkButton } from '../../components/ui';
import { Field, Input, Select, Checkbox } from '../../components/ui/form';
import { toast } from '../../components/ui/Toast';
import { DEMO_PERSONAS, useDb, useDemoStore } from '../../store';
import { homeForRole } from '../../components/layout/navigation';
import { formatCurrency } from '../../lib/format';
import { MAIN_TENANT_ID } from '../../data/seed/static';

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const db = useDb();
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2 no-underline">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-display text-sm font-bold text-brand-ink">
          {tenant.initials}
        </span>
        <span className="font-display text-lg font-semibold uppercase tracking-wide">{tenant.name}</span>
      </Link>

      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>

      <Link to="/" className="mt-6 flex items-center gap-1 text-xs text-muted no-underline hover:text-ink">
        <ArrowLeft size={13} /> Zurück zur Website
      </Link>
    </div>
  );
}

export function Login() {
  const db = useDb();
  const navigate = useNavigate();
  const setUser = useDemoStore((s) => s.setUser);
  const [email, setEmail] = useState('anna.berger@example.com');
  const [password, setPassword] = useState('demo1234');

  const signIn = (userId: string) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    setUser(userId);
    toast(`Willkommen zurück, ${user.firstName}!`);
    navigate(homeForRole(user.role));
  };

  return (
    <AuthShell
      title="Anmelden"
      subtitle="Melde dich an, um Kurse zu buchen und deine Ergebnisse zu sehen."
      footer={
        <>
          Noch kein Konto? <Link to="/registrieren">Jetzt Mitglied werden</Link>
        </>
      }
    >
      <Field label="E-Mail" htmlFor="login-mail">
        <Input id="login-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Passwort" htmlFor="login-pw">
        <Input id="login-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <div className="mb-4 flex items-center justify-between">
        <Checkbox label={<span className="text-xs">Angemeldet bleiben</span>} defaultChecked />
        <Link to="/passwort-vergessen" className="text-xs">
          Passwort vergessen?
        </Link>
      </div>
      <Button variant="primary" block size="lg" onClick={() => signIn('u-member-1')}>
        Anmelden
      </Button>

      <div className="mt-6 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Prototyp – direkt als Rolle einsteigen</p>
        <div className="flex flex-col gap-1.5">
          {DEMO_PERSONAS.map((persona) => {
            const user = db.users.find((u) => u.id === persona.id);
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => signIn(persona.id)}
                className="flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2 text-left transition-colors hover:border-brand"
              >
                {user && <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={28} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{persona.label}</span>
                  <span className="block truncate text-[0.7rem] text-muted">{persona.hint}</span>
                </span>
                <Badge tone="neutral">{persona.role}</Badge>
              </button>
            );
          })}
          <Link to="/tv" className="mt-1 rounded-lg border border-line px-2.5 py-2 text-center text-xs font-semibold no-underline text-muted hover:border-brand hover:text-ink">
            Beamer-Anzeige öffnen (ohne Login)
          </Link>
          <Link to="/kiosk" className="rounded-lg border border-line px-2.5 py-2 text-center text-xs font-semibold no-underline text-muted hover:border-brand hover:text-ink">
            Check-in-Kiosk öffnen (ohne Login)
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const db = useDb();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthday: '',
    planId: 'p-flat',
    iban: '',
    accountHolder: '',
    terms: false,
    privacy: false,
  });

  const plan = db.plans.find((p) => p.id === form.planId);
  const steps = ['Konto', 'Tarif', 'Zahlung', 'Bestätigung'];

  return (
    <AuthShell
      title="Mitglied werden"
      subtitle={`Schritt ${step} von 4 · ${steps[step - 1]}`}
      footer={
        <>
          Schon Mitglied? <Link to="/login">Hier anmelden</Link>
        </>
      }
    >
      <div className="mb-5 flex gap-1.5">
        {steps.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={cn('h-1 rounded-full', step > index ? 'bg-brand' : 'bg-elevated')} />
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vorname" htmlFor="reg-first">
              <Input id="reg-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Nachname" htmlFor="reg-last">
              <Input id="reg-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label="E-Mail" htmlFor="reg-mail">
            <Input id="reg-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Passwort" htmlFor="reg-pw" hint="Mindestens 8 Zeichen">
            <Input id="reg-pw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Geburtsdatum" htmlFor="reg-birthday">
            <Input id="reg-birthday" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
          </Field>
          <Button variant="primary" block disabled={!form.firstName || !form.lastName || !form.email} onClick={() => setStep(2)}>
            Weiter
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="mb-4 flex flex-col gap-2">
            {db.plans.map((item) => (
              <label
                key={item.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5',
                  form.planId === item.id ? 'border-brand bg-brand/10' : 'border-line',
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  checked={form.planId === item.id}
                  onChange={() => setForm({ ...form, planId: item.id })}
                  className="mt-1 accent-[rgb(var(--c-brand))]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <span className="text-sm tabular-nums text-brand">{formatCurrency(item.priceCents)}</span>
                  </span>
                  <span className="block text-xs text-muted">{item.description}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mb-4 rounded-lg bg-elevated px-3 py-2 text-xs text-muted">
            Einmalige Aufnahmegebühr: 49 €. Ohne CrossFit-Erfahrung startest du zusätzlich mit dem Fundamentals-Kurs (149 €).
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setStep(3)}>
              Weiter
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <Field label="Zahlungsart" htmlFor="reg-payment">
            <Select id="reg-payment" defaultValue="sepa">
              <option value="sepa">SEPA-Lastschrift</option>
              <option value="card">Kreditkarte</option>
            </Select>
          </Field>
          <Field label="Kontoinhaber" htmlFor="reg-holder">
            <Input id="reg-holder" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder={`${form.firstName} ${form.lastName}`} />
          </Field>
          <Field label="IBAN" htmlFor="reg-iban" hint="Prototyp – es werden keine echten Daten übertragen">
            <Input id="reg-iban" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="DE00 0000 0000 0000 0000 00" />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Zurück
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setStep(4)}>
              Weiter
            </Button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="mb-4 rounded-lg border border-line p-3 text-sm">
            <p className="font-semibold">
              {form.firstName} {form.lastName}
            </p>
            <p className="text-xs text-muted">{form.email}</p>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <span>{plan?.name}</span>
              <span className="font-semibold tabular-nums">{plan ? formatCurrency(plan.priceCents) : ''} / Monat</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Aufnahmegebühr</span>
              <span className="tabular-nums">49,00 €</span>
            </div>
          </div>
          <Checkbox
            checked={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.checked })}
            label={
              <span className="text-xs text-muted">
                Ich akzeptiere die <Link to="/agb">AGB</Link> und die Hausordnung.
              </span>
            }
            className="mb-2"
          />
          <Checkbox
            checked={form.privacy}
            onChange={(e) => setForm({ ...form, privacy: e.target.checked })}
            label={
              <span className="text-xs text-muted">
                Ich habe die <Link to="/datenschutz">Datenschutzerklärung</Link> gelesen.
              </span>
            }
            className="mb-4"
          />
          <p className="mb-4 text-[0.7rem] text-muted">
            Widerrufsbelehrung: Du kannst deine Vertragserklärung innerhalb von 14 Tagen ohne Angabe von Gründen widerrufen.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Zurück
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={!form.terms || !form.privacy}
              onClick={() => {
                toast('Konto angelegt – willkommen in der Box!');
                navigate('/onboarding');
              }}
            >
              Kostenpflichtig anmelden
            </Button>
          </div>
        </>
      )}
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <AuthShell
      title="Passwort vergessen"
      subtitle={sent ? undefined : 'Wir schicken dir einen Link zum Zurücksetzen.'}
      footer={
        <>
          Zurück zur <Link to="/login">Anmeldung</Link>
        </>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Mail size={22} />
          </div>
          <p className="text-sm">
            Wenn ein Konto zu <strong>{email}</strong> existiert, ist die E-Mail unterwegs. Schau auch im Spam-Ordner nach.
          </p>
          <LinkButton to="/passwort-zuruecksetzen" variant="secondary" className="mt-4" block>
            Link öffnen (Prototyp)
          </LinkButton>
        </div>
      ) : (
        <>
          <Field label="E-Mail" htmlFor="forgot-mail">
            <Input id="forgot-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button variant="primary" block disabled={!email} onClick={() => setSent(true)}>
            Link anfordern
          </Button>
        </>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');

  const strength = password.length >= 12 ? 'stark' : password.length >= 8 ? 'ok' : password.length > 0 ? 'zu kurz' : '';
  const matches = password.length > 0 && password === repeat;

  return (
    <AuthShell title="Neues Passwort" subtitle="Wähle ein Passwort mit mindestens 8 Zeichen.">
      <Field
        label="Neues Passwort"
        htmlFor="reset-pw"
        hint={strength ? `Stärke: ${strength}` : undefined}
      >
        <Input id="reset-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Passwort wiederholen" htmlFor="reset-repeat" error={repeat && !matches ? 'Die Passwörter stimmen nicht überein.' : undefined}>
        <Input id="reset-repeat" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </Field>
      <Button
        variant="primary"
        block
        disabled={!matches || password.length < 8}
        onClick={() => {
          toast('Passwort geändert – du kannst dich jetzt anmelden.');
          navigate('/login');
        }}
      >
        Passwort speichern
      </Button>
    </AuthShell>
  );
}

const ONBOARDING_STEPS = ['Willkommen', 'Profil', 'Ziele', 'Erster Kurs'];

export function Onboarding() {
  const db = useDb();
  const navigate = useNavigate();
  const setUser = useDemoStore((s) => s.setUser);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ nickname: '', emergency: '', level: 'einsteiger', goals: [] as string[], times: 'abend' });

  const goalOptions = ['Kraft aufbauen', 'Abnehmen', 'Ausdauer verbessern', 'Technik lernen', 'Wettkampf', 'Ausgleich zum Job'];
  const firstClasses = db.sessions
    .filter((s) => s.status === 'geplant')
    .map((session) => ({ session, template: db.courseTemplates.find((t) => t.id === session.templateId)! }))
    .filter((entry) => entry.template?.kind === 'Fundamentals')
    .slice(0, 3);

  return (
    <AuthShell title="Onboarding" subtitle={`Schritt ${step + 1} von 4 · ${ONBOARDING_STEPS[step]}`}>
      <div className="mb-5 flex gap-1.5">
        {ONBOARDING_STEPS.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={cn('h-1 rounded-full', step >= index ? 'bg-brand' : 'bg-elevated')} />
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <p className="text-sm text-muted">
            Schön, dass du da bist! In vier kurzen Schritten richten wir dein Profil ein, damit dir die richtigen Kurse vorgeschlagen
            werden. Das dauert keine zwei Minuten.
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {['Profil und Notfallkontakt', 'Erfahrung und Ziele', 'Wunschzeiten', 'Ersten Kurs buchen'].map((item, index) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-elevated text-xs">{index + 1}</span>
                {item}
              </li>
            ))}
          </ul>
          <Button variant="primary" block className="mt-5" onClick={() => setStep(1)}>
            Los geht's
          </Button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated text-xs text-muted">Foto</span>
            <Button variant="secondary" size="sm" disabled>
              Profilbild hochladen
            </Button>
          </div>
          <Field label="Anzeigename" htmlFor="ob-nick" hint="So erscheinst du im Leaderboard">
            <Input id="ob-nick" value={profile.nickname} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} />
          </Field>
          <Field label="Notfallkontakt" htmlFor="ob-emergency" hint="Wen sollen wir im Notfall anrufen?">
            <Input id="ob-emergency" value={profile.emergency} onChange={(e) => setProfile({ ...profile, emergency: e.target.value })} placeholder="Name und Telefonnummer" />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>
              Zurück
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>
              Weiter
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Wie viel Erfahrung hast du?" htmlFor="ob-level">
            <Select id="ob-level" value={profile.level} onChange={(e) => setProfile({ ...profile, level: e.target.value })}>
              <option value="einsteiger">Noch nie CrossFit gemacht</option>
              <option value="etwas">Etwas Erfahrung</option>
              <option value="erfahren">Mehrere Jahre Erfahrung</option>
            </Select>
          </Field>
          <Field label="Was willst du erreichen?" hint="Mehrfachauswahl möglich">
            <div className="flex flex-wrap gap-1.5">
              {goalOptions.map((goal) => {
                const active = profile.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        goals: active ? profile.goals.filter((g) => g !== goal) : [...profile.goals, goal],
                      })
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold',
                      active ? 'border-brand bg-brand/15 text-brand' : 'border-line text-muted',
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Wann trainierst du am liebsten?" htmlFor="ob-times">
            <Select id="ob-times" value={profile.times} onChange={(e) => setProfile({ ...profile, times: e.target.value })}>
              <option value="frueh">Früh (06:00 – 09:30)</option>
              <option value="mittag">Mittags (12:00)</option>
              <option value="abend">Abends (17:00 – 20:00)</option>
              <option value="wochenende">Am Wochenende</option>
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setStep(3)}>
              Weiter
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="mb-3 text-sm text-muted">
            {profile.level === 'einsteiger'
              ? 'Für deinen Start empfehlen wir den Fundamentals-Kurs – dort lernst du alle Grundbewegungen in kleiner Gruppe.'
              : 'Such dir einen Kurs aus, in dem wir dich kennenlernen können.'}
          </p>
          <ul className="mb-4 flex flex-col gap-2">
            {firstClasses.map(({ session, template }) => (
              <li key={session.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                <span className="font-display text-lg tabular-nums">{session.startTime}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{template.name}</span>
                  <span className="block text-xs text-muted">{session.date}</span>
                </span>
                <Badge tone="success">frei</Badge>
              </li>
            ))}
            {firstClasses.length === 0 && <p className="text-sm text-muted">Aktuell ist kein Einsteigerkurs terminiert – wir melden uns bei dir.</p>}
          </ul>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Zurück
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              icon={<Check size={16} />}
              onClick={() => {
                setUser('u-member-1');
                toast('Profil eingerichtet – viel Spaß beim Training!');
                navigate('/app');
              }}
            >
              Fertig
            </Button>
          </div>
        </>
      )}
    </AuthShell>
  );
}
