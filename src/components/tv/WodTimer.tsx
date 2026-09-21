import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { WodKind } from '../../data/types';

type Mode = 'forTime' | 'amrap' | 'emom' | 'tabata';

const MODE_LABEL: Record<Mode, string> = {
  forTime: 'For Time',
  amrap: 'AMRAP',
  emom: 'EMOM',
  tabata: 'Tabata',
};

export function modeForWod(kind: WodKind): Mode {
  if (kind === 'AMRAP') return 'amrap';
  if (kind === 'EMOM') return 'emom';
  if (kind === 'Tabata') return 'tabata';
  return 'forTime';
}

function format(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const abs = Math.abs(Math.floor(totalSeconds));
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  return `${sign}${minutes}:${`${seconds}`.padStart(2, '0')}`;
}

/** Kurzer Signalton ohne Audiodatei – funktioniert auch im Single-File-Build */
function beep(frequency = 880, duration = 0.12): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => ctx.close();
  } catch {
    /* Ton ist optional */
  }
}

export function WodTimer({
  initialMode = 'forTime',
  capMinutes,
  compact = false,
}: {
  initialMode?: Mode;
  capMinutes?: number | null;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [minutes, setMinutes] = useState(capMinutes ?? 20);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const lastBeep = useRef(-1);

  useEffect(() => {
    setMode(initialMode);
    setMinutes(capMinutes ?? (initialMode === 'tabata' ? 4 : 20));
    setElapsed(0);
    setRunning(false);
    setCountdown(null);
  }, [initialMode, capMinutes]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setRunning(true);
      beep(1180, 0.3);
      return;
    }
    const timer = setTimeout(() => {
      beep(660, 0.1);
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const totalSeconds = minutes * 60;
  const display = useMemo(() => {
    if (mode === 'forTime') return format(elapsed);
    if (mode === 'amrap') return format(Math.max(0, totalSeconds - elapsed));
    if (mode === 'emom') return format(59 - (elapsed % 60));
    // Tabata: 20 s Arbeit, 10 s Pause
    const inCycle = elapsed % 30;
    return format(inCycle < 20 ? 20 - inCycle : 30 - inCycle);
  }, [mode, elapsed, totalSeconds]);

  const subline = useMemo(() => {
    if (mode === 'emom') return `Minute ${Math.floor(elapsed / 60) + 1}${minutes ? ` von ${minutes}` : ''}`;
    if (mode === 'tabata') {
      const round = Math.floor(elapsed / 30) + 1;
      return `${elapsed % 30 < 20 ? 'Arbeit' : 'Pause'} · Runde ${round} von 8`;
    }
    if (mode === 'amrap') return `AMRAP ${minutes} Minuten`;
    return capMinutes ? `Zeitlimit ${capMinutes} Minuten` : 'Auf Zeit';
  }, [mode, elapsed, minutes, capMinutes]);

  const finished =
    (mode === 'amrap' && elapsed >= totalSeconds) ||
    (mode === 'emom' && elapsed >= totalSeconds) ||
    (mode === 'tabata' && elapsed >= 8 * 30) ||
    (mode === 'forTime' && capMinutes != null && elapsed >= capMinutes * 60);

  useEffect(() => {
    if (finished && running) {
      setRunning(false);
      beep(520, 0.6);
    }
  }, [finished, running]);

  // Akustische Marker: jede volle Minute bei EMOM, Wechsel bei Tabata
  useEffect(() => {
    if (!running) return;
    if (mode === 'emom' && elapsed % 60 === 0 && elapsed !== lastBeep.current) {
      lastBeep.current = elapsed;
      beep(980, 0.15);
    }
    if (mode === 'tabata' && (elapsed % 30 === 0 || elapsed % 30 === 20) && elapsed !== lastBeep.current) {
      lastBeep.current = elapsed;
      beep(elapsed % 30 === 0 ? 980 : 700, 0.15);
    }
  }, [elapsed, mode, running]);

  const toggle = useCallback(() => {
    if (running) {
      setRunning(false);
      return;
    }
    if (elapsed === 0) setCountdown(10);
    else setRunning(true);
  }, [running, elapsed]);

  const reset = useCallback(() => {
    setRunning(false);
    setCountdown(null);
    setElapsed(0);
    lastBeep.current = -1;
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'r' || event.key === 'R') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, reset]);

  const isWork = mode !== 'tabata' || elapsed % 30 < 20;

  return (
    <div className={cn('flex flex-col items-center', compact ? 'gap-2' : 'gap-4')}>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {(Object.keys(MODE_LABEL) as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              reset();
            }}
            className={cn(
              'rounded-full border px-3 py-1 font-semibold transition-colors',
              compact ? 'text-xs' : 'text-sm',
              mode === value ? 'border-brand bg-brand/20 text-brand' : 'border-line text-muted hover:text-ink',
            )}
          >
            {MODE_LABEL[value]}
          </button>
        ))}
        {(mode === 'amrap' || mode === 'emom') && (
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Dauer
            <input
              type="number"
              min={1}
              max={60}
              value={minutes}
              onChange={(e) => {
                setMinutes(Number(e.target.value) || 1);
                reset();
              }}
              className="w-16 rounded-md border border-line bg-elevated px-2 py-1 text-center text-ink"
            />
            min
          </label>
        )}
      </div>

      <div
        className={cn(
          'font-display font-bold tabular-nums leading-none transition-colors',
          compact ? 'text-6xl' : 'text-[clamp(4rem,18vw,14rem)]',
          countdown !== null ? 'text-warning' : finished ? 'text-danger' : isWork ? 'text-ink' : 'text-info',
        )}
      >
        {countdown !== null ? countdown : display}
      </div>

      <p className={cn('text-muted', compact ? 'text-xs' : 'text-[clamp(0.9rem,2vw,1.4rem)]')}>
        {countdown !== null ? 'Gleich geht es los …' : finished ? 'Zeit abgelaufen' : subline}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-brand font-bold text-brand-ink transition-transform active:scale-95',
            compact ? 'px-4 py-2 text-sm' : 'px-8 py-3 text-lg',
          )}
        >
          {running ? <Pause size={compact ? 16 : 22} /> : <Play size={compact ? 16 : 22} />}
          {running ? 'Pause' : elapsed === 0 ? 'Start' : 'Weiter'}
        </button>
        <button
          type="button"
          onClick={reset}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-line font-semibold text-muted hover:text-ink',
            compact ? 'px-3 py-2 text-sm' : 'px-6 py-3 text-lg',
          )}
        >
          <RotateCcw size={compact ? 16 : 20} />
          Reset
        </button>
      </div>
      {!compact && <p className="text-xs text-muted">Leertaste: Start/Pause · R: Zurücksetzen</p>}
    </div>
  );
}
