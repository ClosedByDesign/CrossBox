import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, RotateCcw, Settings2, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { DEMO_PERSONAS, useDb, useDemoStore } from '../../store';
import { homeForRole } from './navigation';
import { Avatar, Button } from '../ui';
import { SegmentedControl } from '../ui/form';
import { formatClock, formatDate } from '../../lib/format';
import { now } from '../../lib/clock';
import { ConfirmDialog } from '../ui/Modal';

const TIME_PRESETS = [
  { label: 'Jetzt', minutes: 0 },
  { label: 'Morgen früh', minutes: 60 * 21 },
  { label: 'Nächste Woche', minutes: 60 * 24 * 7 },
];

export function DemoBar() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const db = useDb();

  const userId = useDemoStore((s) => s.userId);
  const setUser = useDemoStore((s) => s.setUser);
  const prefs = useDemoStore((s) => s.prefs);
  const setPrefs = useDemoStore((s) => s.setPrefs);
  const offset = useDemoStore((s) => s.clockOffsetMin);
  const setOffset = useDemoStore((s) => s.setClockOffsetMinutes);
  const resetDemo = useDemoStore((s) => s.resetDemo);

  // In Beamer- und Kiosk-Ansicht stört die Leiste
  if (location.pathname.startsWith('/tv') || location.pathname.startsWith('/kiosk')) return null;

  const switchPersona = (personaId: string) => {
    setUser(personaId);
    const user = db.users.find((u) => u.id === personaId);
    if (user) navigate(homeForRole(user.role));
    setOpen(false);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold shadow-pop lg:bottom-5"
        >
          <Settings2 size={15} className="text-brand" />
          Demo
          {offset !== 0 && <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[0.65rem] text-warning">Zeit ±</span>}
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4 shadow-pop animate-slide-up lg:bottom-5">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-sm uppercase tracking-wide">Demo-Steuerung</p>
              <p className="text-[0.7rem] text-muted">Prototyp mit Beispieldaten – nichts wird wirklich gebucht.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Schließen" className="p-1 text-muted hover:text-ink">
              <X size={16} />
            </button>
          </header>

          <p className="label-base">Rolle wechseln</p>
          <div className="mb-3 flex flex-col gap-1">
            {DEMO_PERSONAS.map((persona) => {
              const user = db.users.find((u) => u.id === persona.id);
              const active = persona.id === userId;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => switchPersona(persona.id)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors',
                    active ? 'border-brand bg-brand/10' : 'border-line hover:bg-elevated',
                  )}
                >
                  {user && <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={28} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{persona.label}</span>
                    <span className="block truncate text-[0.7rem] text-muted">
                      {persona.role} · {persona.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="label-base flex items-center gap-1.5">
            <Clock size={13} /> Demo-Zeit
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setOffset(preset.minutes)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold',
                  offset === preset.minutes ? 'border-brand bg-brand/15 text-brand' : 'border-line text-muted hover:text-ink',
                )}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOffset(offset - 60 * 24)}
              className="rounded-full border border-line px-2.5 py-1 text-[0.7rem] font-semibold text-muted hover:text-ink"
            >
              −1 Tag
            </button>
            <button
              type="button"
              onClick={() => setOffset(offset + 60 * 24)}
              className="rounded-full border border-line px-2.5 py-1 text-[0.7rem] font-semibold text-muted hover:text-ink"
            >
              +1 Tag
            </button>
          </div>
          <p className="mb-3 text-[0.7rem] text-muted">
            Aktuell: {formatDate(now(), prefs.locale, { weekday: 'short', day: '2-digit', month: '2-digit' })},{' '}
            {formatClock(now(), prefs.locale)} Uhr
          </p>

          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="label-base mb-0">Sprache</span>
            <SegmentedControl
              value={prefs.locale}
              onChange={(locale) => setPrefs({ locale })}
              options={[
                { value: 'de', label: 'DE' },
                { value: 'en', label: 'EN' },
              ]}
            />
          </div>

          <Button variant="secondary" size="sm" block icon={<RotateCcw size={14} />} onClick={() => setConfirmReset(true)}>
            Demo zurücksetzen
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Demo zurücksetzen?"
        description="Alle Buchungen, Eingaben und Einstellungen aus dieser Demo werden verworfen und der Ausgangszustand wiederhergestellt."
        confirmLabel="Zurücksetzen"
        tone="danger"
        onConfirm={() => {
          resetDemo();
          navigate('/app');
        }}
      />
    </>
  );
}
