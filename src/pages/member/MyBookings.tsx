import { useMemo } from 'react';
import { CalendarX2 } from 'lucide-react';
import { EmptyState, LinkButton, PageHeader } from '../../components/ui';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { SessionRow } from '../../components/schedule/SessionRow';
import type { EnrichedSession } from '../../components/schedule/useSchedule';
import { useDb, useDemoStore } from '../../store';
import { atTime, now } from '../../lib/clock';

export default function MyBookings() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const current = now();

  const groups = useMemo(() => {
    const templates = new Map(db.courseTemplates.map((t) => [t.id, t]));
    const users = new Map(db.users.map((u) => [u.id, u]));

    const enrich = (sessionId: string, bookingId: string): EnrichedSession | null => {
      const session = db.sessions.find((s) => s.id === sessionId);
      const template = session ? templates.get(session.templateId) : null;
      if (!session || !template) return null;
      const sessionBookings = db.bookings.filter((b) => b.sessionId === session.id);
      const booked = sessionBookings.filter((b) => b.status === 'gebucht' || b.status === 'anwesend').length;
      const coach = users.get(session.coachId);
      const start = atTime(session.date, session.startTime);
      return {
        session,
        template,
        coachName: coach ? `${coach.firstName} ${coach.lastName}` : '—',
        start,
        end: new Date(start.getTime() + session.durationMin * 60_000),
        bookedCount: booked,
        waitlistCount: sessionBookings.filter((b) => b.status === 'warteliste').length,
        freeSpots: Math.max(0, session.capacity - booked),
        myBooking: sessionBookings.find((b) => b.id === bookingId) ?? null,
      };
    };

    const mine = db.bookings
      .filter((b) => b.userId === userId)
      .map((b) => enrich(b.sessionId, b.id))
      .filter((v): v is EnrichedSession => v !== null);

    const upcoming = mine
      .filter((e) => e.myBooking?.status === 'gebucht' && e.start > current)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const waitlist = mine
      .filter((e) => e.myBooking?.status === 'warteliste' && e.start > current)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const past = mine
      .filter((e) => (e.myBooking?.status === 'anwesend' || e.myBooking?.status === 'no-show') && e.start <= current)
      .sort((a, b) => b.start.getTime() - a.start.getTime());
    const cancelled = mine
      .filter((e) => e.myBooking?.status === 'storniert')
      .sort((a, b) => b.start.getTime() - a.start.getTime());

    return { upcoming, waitlist, past, cancelled };
  }, [db, userId, current]);

  const tabs: TabDef[] = [
    { key: 'kommend', label: 'Kommend', count: groups.upcoming.length },
    { key: 'warteliste', label: 'Warteliste', count: groups.waitlist.length },
    { key: 'vergangen', label: 'Vergangen', count: groups.past.length },
    { key: 'storniert', label: 'Storniert', count: groups.cancelled.length },
  ];
  const active = useActiveTab(tabs);
  const list = groups[active === 'kommend' ? 'upcoming' : active === 'warteliste' ? 'waitlist' : active === 'vergangen' ? 'past' : 'cancelled'];

  const noShows = groups.past.filter((e) => e.myBooking?.status === 'no-show').length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Meine Buchungen"
        subtitle={noShows > 0 ? `${noShows} Mal nicht erschienen in den letzten Wochen` : 'Alle deine Kurse auf einen Blick'}
        actions={<LinkButton to="/app/kursplan" variant="primary" size="sm">Kurs buchen</LinkButton>}
      />
      <Tabs tabs={tabs} />

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 size={28} />}
          title="Keine Einträge"
          description={
            active === 'kommend'
              ? 'Du hast aktuell keinen Kurs gebucht.'
              : active === 'warteliste'
                ? 'Du stehst auf keiner Warteliste.'
                : 'Hier ist noch nichts zu sehen.'
          }
          action={active === 'kommend' ? <LinkButton to="/app/kursplan" variant="primary" size="sm">Zum Kursplan</LinkButton> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {list.slice(0, 40).map((entry) => (
            <SessionRow key={entry.session.id} entry={entry} to={`/app/kurs/${entry.session.id}`} showDate />
          ))}
        </div>
      )}
    </div>
  );
}
