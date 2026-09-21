import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock, Clock, Info, MapPin, Users } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, ProgressBar, SectionCard } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { useSession } from '../../components/schedule/useSchedule';
import { sessionTone } from '../../components/schedule/SessionRow';
import { getBookingState } from '../../domain/booking';
import { bookSession, cancelBooking, joinWaitlist } from '../../store/actions';
import { useDb, useDemoStore } from '../../store';
import { now } from '../../lib/clock';
import { formatClock, formatDate, formatTimeRange } from '../../lib/format';
import { courseColor } from '../../lib/courseColors';
import { NotFound } from '../system/Placeholder';

export default function MemberSessionDetail() {
  const { sessionId } = useParams();
  const data = useSession(sessionId);
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!data) return <NotFound />;

  const { session, template, coach, bookings, wod, bookedCount, waitlistCount, freeSpots, myBooking } = data;
  const tenant = db.tenants.find((t) => t.id === session.tenantId)!;
  const membership = db.memberships.find((m) => m.userId === userId);
  const plan = db.plans.find((p) => p.id === membership?.planId) ?? null;

  const state = getBookingState({ session, bookings: db.bookings, userId, membership, plan, tenant, now: now() });
  const status = sessionTone({ ...data, session, template, coachName: '', myBooking, start: state.start, end: state.end, bookedCount, waitlistCount, freeSpots });
  const color = courseColor(template.kind);

  const participants = bookings
    .filter((b) => b.status === 'gebucht' || b.status === 'anwesend')
    .map((b) => db.users.find((u) => u.id === b.userId))
    .filter(Boolean);

  const waitlistUsers = bookings
    .filter((b) => b.status === 'warteliste')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((b) => db.users.find((u) => u.id === b.userId))
    .filter(Boolean);

  const courseLabel = `${template.name} am ${formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}`;

  const handleBook = () => {
    if (!userId) return;
    bookSession(session.id, userId);
    toast(`Du bist für ${courseLabel} angemeldet.`);
  };

  const handleWaitlist = () => {
    if (!userId) return;
    joinWaitlist(session.id, userId);
    toast(`Du stehst auf der Warteliste für ${courseLabel}.`, 'info');
  };

  const handleCancel = () => {
    if (!userId) return;
    const { promotedUserId } = cancelBooking(session.id, userId);
    const promoted = promotedUserId ? db.users.find((u) => u.id === promotedUserId) : null;
    toast(
      promoted
        ? `Buchung storniert – ${promoted.firstName} ${promoted.lastName} ist von der Warteliste nachgerückt.`
        : 'Deine Buchung wurde storniert.',
      'info',
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: '/app/kursplan', label: 'Zurück zum Kursplan' }}
        title={
          <span className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${color.dot}`} aria-hidden />
            {template.name}
          </span>
        }
        subtitle={`${formatDate(session.date, locale, { weekday: 'long', day: '2-digit', month: 'long' })} · ${formatTimeRange(session.startTime, session.durationMin)} Uhr`}
        actions={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      {session.status === 'abgesagt' && (
        <Card className="mb-4 border-danger/50 bg-danger/10">
          <p className="text-sm font-semibold text-danger">Dieser Kurs wurde abgesagt.</p>
          {session.cancelReason && <p className="mt-0.5 text-sm text-muted">{session.cancelReason}</p>}
        </Card>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-muted" />
            <span className="font-semibold">
              {bookedCount} / {session.capacity} Teilnehmer
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={bookedCount} max={session.capacity} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {freeSpots === 0 ? 'Ausgebucht' : freeSpots === 1 ? '1 Platz frei' : `${freeSpots} Plätze frei`}
            {waitlistCount > 0 && ` · ${waitlistCount} auf der Warteliste`}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm">
            {coach && <Avatar name={`${coach.firstName} ${coach.lastName}`} hue={coach.avatarHue} size={32} />}
            <div>
              <p className="font-semibold">
                {coach ? `${coach.firstName} ${coach.lastName}` : 'Trainer offen'}
              </p>
              <p className="text-xs text-muted">
                {session.substitute ? 'Vertretung' : coach?.headline ?? 'Trainer'}
              </p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <MapPin size={12} /> {tenant.street}, {tenant.zip} {tenant.city}
          </p>
        </Card>
      </div>

      {/* Buchungsaktion */}
      <Card className="mb-4">
        {state.canBook && (
          <Button variant="primary" block size="lg" onClick={handleBook}>
            Jetzt einbuchen
          </Button>
        )}
        {state.canJoinWaitlist && (
          <>
            <Button variant="primary" block size="lg" onClick={handleWaitlist}>
              Auf Warteliste setzen
            </Button>
            <p className="mt-2 text-center text-xs text-muted">
              Wird ein Platz frei, rückst du automatisch nach und wirst benachrichtigt.
            </p>
          </>
        )}
        {myBooking?.status === 'gebucht' && (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              <Info size={15} /> Du bist für diesen Kurs angemeldet.
            </div>
            <Button variant="danger" block onClick={() => setConfirmCancel(true)}>
              Buchung stornieren
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Clock size={12} />
              {state.lateCancel
                ? 'Die Stornofrist ist abgelaufen – die Einheit wird angerechnet.'
                : `Kostenfrei stornieren bis ${formatClock(state.cancelDeadline, locale)} Uhr`}
            </p>
          </>
        )}
        {myBooking?.status === 'warteliste' && (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              <Info size={15} /> Du stehst auf Platz {state.waitlistPosition} der Warteliste.
            </div>
            <Button variant="secondary" block onClick={handleCancel}>
              Warteliste verlassen
            </Button>
          </>
        )}
        {state.reason === 'fenster-zu' && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
            <CalendarClock size={15} />
            Buchbar ab {formatDate(state.bookingOpensAt, locale, { day: '2-digit', month: '2-digit' })},{' '}
            {formatClock(state.bookingOpensAt, locale)} Uhr
          </p>
        )}
        {state.reason === 'kontingent-erschoepft' && (
          <p className="text-center text-sm text-warning">
            Dein Kontingent für diesen Monat ist aufgebraucht. Ein Tarifwechsel schafft mehr Einheiten.
          </p>
        )}
        {state.reason === 'vertrag-pausiert' && (
          <p className="text-center text-sm text-warning">Dein Vertrag ist pausiert – Buchungen sind derzeit nicht möglich.</p>
        )}
        {(state.reason === 'vorbei' || state.reason === 'laeuft') && !myBooking && (
          <p className="text-center text-sm text-muted">Dieser Kurs kann nicht mehr gebucht werden.</p>
        )}
      </Card>

      <SectionCard title="Übungen" className="mb-4">
        {wod ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-display text-lg">{wod.name}</span>
              <Badge tone="brand">{wod.kind}</Badge>
              {wod.capMinutes && <Badge>{wod.capMinutes} Min Cap</Badge>}
              {wod.benchmark && <Badge tone="info">Benchmark</Badge>}
            </div>
            <div className="flex flex-col gap-3">
              {wod.blocks.map((block) => (
                <div key={block.label} className="rounded-lg border border-line bg-elevated px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">{block.label}</p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {block.lines.map((line) => (
                      <li key={line} className="text-sm">
                        {line}
                      </li>
                    ))}
                  </ul>
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
          </div>
        ) : (
          <EmptyState
            title="Übungen noch nicht veröffentlicht"
            description="Der Trainer veröffentlicht das Workout üblicherweise ein bis zwei Tage vor dem Kurs."
          />
        )}
      </SectionCard>

      <SectionCard title={`Teilnehmer (${participants.length})`} description={waitlistCount > 0 ? `${waitlistCount} auf der Warteliste` : undefined}>
        {participants.length === 0 ? (
          <p className="text-sm text-muted">Noch niemand angemeldet – sei die oder der Erste.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {participants.map(
              (user) =>
                user && (
                  <li key={user.id} className="flex items-center gap-1.5 rounded-full border border-line bg-elevated py-1 pl-1 pr-3">
                    <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={24} />
                    <span className="text-xs">
                      {user.firstName} {user.lastName.charAt(0)}.
                    </span>
                  </li>
                ),
            )}
          </ul>
        )}
        {waitlistUsers.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="label-base">Warteliste</p>
            <ol className="flex flex-col gap-1">
              {waitlistUsers.map(
                (user, index) =>
                  user && (
                    <li key={user.id} className="flex items-center gap-2 text-xs text-muted">
                      <span className="w-4 tabular-nums">{index + 1}.</span>
                      <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={20} />
                      {user.firstName} {user.lastName.charAt(0)}.
                    </li>
                  ),
              )}
            </ol>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Buchung stornieren?"
        description={
          state.lateCancel
            ? 'Die Stornofrist ist abgelaufen. Die Einheit wird deinem Kontingent angerechnet.'
            : 'Dein Platz wird frei und die erste Person von der Warteliste rückt automatisch nach.'
        }
        confirmLabel="Stornieren"
        tone="danger"
        onConfirm={handleCancel}
      />
    </div>
  );
}
