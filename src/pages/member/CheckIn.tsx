import { useMemo } from 'react';
import { CheckCircle2, Clock, QrCode } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { QrMock } from '../../components/ui/QrMock';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { checkIn } from '../../store/actions';
import { atTime, minutesBetween, now } from '../../lib/clock';
import { formatDate, formatTimeRange } from '../../lib/format';

const CHECK_IN_WINDOW_MIN = 30;

export default function CheckIn() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = now();
  const user = db.users.find((u) => u.id === userId);

  const { openNow, history } = useMemo(() => {
    const mine = db.bookings.filter((b) => b.userId === userId);
    const withSession = mine
      .map((booking) => {
        const session = db.sessions.find((s) => s.id === booking.sessionId);
        if (!session) return null;
        const template = db.courseTemplates.find((t) => t.id === session.templateId);
        if (!template) return null;
        return { booking, session, template, start: atTime(session.date, session.startTime) };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    return {
      openNow: withSession.filter(
        (entry) =>
          (entry.booking.status === 'gebucht' || entry.booking.status === 'anwesend') &&
          entry.session.status !== 'abgesagt' &&
          minutesBetween(current, entry.start) <= CHECK_IN_WINDOW_MIN &&
          new Date(entry.start.getTime() + entry.session.durationMin * 60_000) >= current,
      ),
      history: db.checkIns
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 6)
        .map((entry) => {
          const session = db.sessions.find((s) => s.id === entry.sessionId);
          const template = session ? db.courseTemplates.find((t) => t.id === session.templateId) : null;
          return { entry, session, template };
        }),
    };
  }, [db, userId, current]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Check-in" subtitle="Zeig den Code am Terminal in der Box oder checke direkt hier ein." />

      <Card className="mb-4 flex flex-col items-center gap-4 py-6">
        <QrMock token={`${user.id}-${user.nickname}`} size={210} />
        <div className="text-center">
          <p className="font-display text-xl">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-muted">Mitgliedsnummer {user.id.replace('u-member-', 'M-')}</p>
        </div>
        <p className="max-w-sm text-center text-xs text-muted">
          Der Code ist persönlich und ändert sich nicht. Halte ihn beim Betreten der Box an das Terminal – der Check-in ist ab 30 Minuten
          vor Kursbeginn möglich.
        </p>
      </Card>

      <SectionCard title="Jetzt einchecken" className="mb-4">
        {openNow.length === 0 ? (
          <EmptyState
            icon={<Clock size={26} />}
            title="Kein Kurs im Check-in-Fenster"
            description="Der Check-in öffnet 30 Minuten vor Kursbeginn. Tipp: In der Demo-Steuerung kannst du die Zeit vorstellen."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {openNow.map(({ booking, session, template, start }) => {
              const already = booking.status === 'anwesend';
              return (
                <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
                  <div>
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })} ·{' '}
                      {formatTimeRange(session.startTime, session.durationMin)} Uhr
                    </p>
                  </div>
                  {already ? (
                    <Badge tone="success">
                      <CheckCircle2 size={13} /> Eingecheckt
                    </Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<QrCode size={15} />}
                      onClick={() => {
                        checkIn(session.id, user.id, 'qr');
                        toast(`Eingecheckt für ${template.name} um ${session.startTime} Uhr.`);
                      }}
                    >
                      Ich bin da
                    </Button>
                  )}
                  {minutesBetween(current, start) > 0 && !already && (
                    <span className="text-xs text-muted">startet in {Math.round(minutesBetween(current, start))} Min.</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Letzte Check-ins">
        {history.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Check-ins vorhanden.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map(({ entry, session, template }) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                <span className="text-sm">{template?.name ?? 'Kurs'}</span>
                <span className="text-xs text-muted">
                  {session ? formatDate(session.date, locale, { weekday: 'short', day: '2-digit', month: '2-digit' }) : ''} ·{' '}
                  {entry.source === 'kiosk' ? 'Terminal' : entry.source === 'qr' ? 'App' : 'Trainer'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
