import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { cn } from '../../lib/cn';
import { courseColor } from '../../lib/courseColors';
import { formatTimeRange } from '../../lib/format';
import { Badge, ProgressBar } from '../ui';
import type { EnrichedSession } from './useSchedule';

export function sessionTone(entry: EnrichedSession) {
  if (entry.session.status === 'abgesagt') return { label: 'Abgesagt', tone: 'danger' as const };
  if (entry.session.status === 'laeuft') return { label: 'Läuft gerade', tone: 'live' as const };
  if (entry.session.status === 'vorbei') return { label: 'Vorbei', tone: 'neutral' as const };
  if (entry.freeSpots === 0) return { label: 'Ausgebucht', tone: 'danger' as const };
  if (entry.freeSpots <= 2) return { label: `${entry.freeSpots} Plätze frei`, tone: 'warning' as const };
  return { label: `${entry.freeSpots} Plätze frei`, tone: 'success' as const };
}

export function SessionRow({ entry, to, showDate }: { entry: EnrichedSession; to: string; showDate?: boolean }) {
  const color = courseColor(entry.template.kind);
  const status = sessionTone(entry);
  const cancelled = entry.session.status === 'abgesagt';
  const dateLabel = showDate
    ? new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(entry.start)
    : null;

  return (
    <Link
      to={to}
      className="flex items-stretch gap-3 rounded-xl border border-line bg-surface p-3 no-underline transition-colors hover:border-brand"
    >
      <span className={cn('w-1 shrink-0 rounded-full', color.bar, cancelled && 'opacity-40')} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg tabular-nums leading-none">{entry.session.startTime}</span>
          <span className={cn('truncate font-semibold', cancelled && 'line-through text-muted')}>{entry.template.name}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted">
          {dateLabel && <span className="font-semibold text-ink">{dateLabel} · </span>}
          {formatTimeRange(entry.session.startTime, entry.session.durationMin)} · {entry.coachName}
          {entry.session.substitute && ' (Vertretung)'}
        </div>
        {!cancelled && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-24">
              <ProgressBar value={entry.bookedCount} max={entry.session.capacity} />
            </div>
            <span className="flex items-center gap-1 text-[0.7rem] tabular-nums text-muted">
              <Users size={12} />
              {entry.bookedCount}/{entry.session.capacity}
              {entry.waitlistCount > 0 && ` · ${entry.waitlistCount} WL`}
            </span>
          </div>
        )}
        {cancelled && entry.session.cancelReason && (
          <p className="mt-1 text-xs text-danger">{entry.session.cancelReason}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge tone={status.tone}>{status.label}</Badge>
        {entry.myBooking?.status === 'gebucht' && <Badge tone="success">Gebucht</Badge>}
        {entry.myBooking?.status === 'warteliste' && <Badge tone="warning">Warteliste</Badge>}
        {entry.myBooking?.status === 'anwesend' && <Badge tone="success">Teilgenommen</Badge>}
      </div>
    </Link>
  );
}
