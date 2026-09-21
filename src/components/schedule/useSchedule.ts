import { useMemo } from 'react';
import type { Booking, CourseTemplate, Session } from '../../data/types';
import { useDb, useDemoStore } from '../../store';
import { addDays, atTime, startOfWeek, toDateKey } from '../../lib/clock';

export interface EnrichedSession {
  session: Session;
  template: CourseTemplate;
  coachName: string;
  start: Date;
  end: Date;
  bookedCount: number;
  waitlistCount: number;
  freeSpots: number;
  myBooking: Booking | null;
}

export interface ScheduleFilters {
  kind: string;
  coachId: string;
  onlyFree: boolean;
  onlyMine: boolean;
}

export const emptyFilters: ScheduleFilters = { kind: 'alle', coachId: 'alle', onlyFree: false, onlyMine: false };

/** Alle Termine einer Woche, angereichert um Trainer, Auslastung und eigene Buchung */
export function useWeekSessions(weekStart: Date, filters: ScheduleFilters = emptyFilters) {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);

  return useMemo(() => {
    const from = toDateKey(startOfWeek(weekStart));
    const to = toDateKey(addDays(startOfWeek(weekStart), 6));
    const templates = new Map(db.courseTemplates.map((t) => [t.id, t]));
    const users = new Map(db.users.map((u) => [u.id, u]));

    const bookingsBySession = new Map<string, Booking[]>();
    db.bookings.forEach((booking) => {
      const list = bookingsBySession.get(booking.sessionId);
      if (list) list.push(booking);
      else bookingsBySession.set(booking.sessionId, [booking]);
    });

    const result: EnrichedSession[] = [];

    db.sessions.forEach((session) => {
      if (session.date < from || session.date > to) return;
      const template = templates.get(session.templateId);
      if (!template) return;

      const bookings = bookingsBySession.get(session.id) ?? [];
      const booked = bookings.filter((b) => b.status === 'gebucht' || b.status === 'anwesend').length;
      const waitlist = bookings.filter((b) => b.status === 'warteliste').length;
      const myBooking = bookings.find((b) => b.userId === userId && b.status !== 'storniert') ?? null;

      if (filters.kind !== 'alle' && template.kind !== filters.kind) return;
      if (filters.coachId !== 'alle' && session.coachId !== filters.coachId) return;
      if (filters.onlyFree && (booked >= session.capacity || session.status === 'abgesagt')) return;
      if (filters.onlyMine && !myBooking) return;

      const coach = users.get(session.coachId);
      result.push({
        session,
        template,
        coachName: coach ? `${coach.firstName} ${coach.lastName}` : '—',
        start: atTime(session.date, session.startTime),
        end: atTime(session.date, session.startTime),
        bookedCount: booked,
        waitlistCount: waitlist,
        freeSpots: Math.max(0, session.capacity - booked),
        myBooking,
      });
    });

    result.forEach((entry) => {
      entry.end = new Date(entry.start.getTime() + entry.session.durationMin * 60_000);
    });

    result.sort((a, b) => a.start.getTime() - b.start.getTime());
    return result;
  }, [db, weekStart, userId, filters.kind, filters.coachId, filters.onlyFree, filters.onlyMine]);
}

export function groupByDay(sessions: EnrichedSession[]): Map<string, EnrichedSession[]> {
  const map = new Map<string, EnrichedSession[]>();
  sessions.forEach((entry) => {
    const list = map.get(entry.session.date);
    if (list) list.push(entry);
    else map.set(entry.session.date, [entry]);
  });
  return map;
}

/** Einzelner Termin mit denselben Zusatzinformationen */
export function useSession(sessionId: string | undefined) {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);

  return useMemo(() => {
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const template = db.courseTemplates.find((t) => t.id === session.templateId);
    if (!template) return null;
    const bookings = db.bookings.filter((b) => b.sessionId === session.id);
    const coach = db.users.find((u) => u.id === session.coachId);
    const booked = bookings.filter((b) => b.status === 'gebucht' || b.status === 'anwesend').length;

    return {
      session,
      template,
      coach,
      bookings,
      start: atTime(session.date, session.startTime),
      end: new Date(atTime(session.date, session.startTime).getTime() + session.durationMin * 60_000),
      bookedCount: booked,
      waitlistCount: bookings.filter((b) => b.status === 'warteliste').length,
      freeSpots: Math.max(0, session.capacity - booked),
      myBooking: bookings.find((b) => b.userId === userId && b.status !== 'storniert') ?? null,
      wod: db.wods.find((w) => w.id === session.wodId) ?? null,
    };
  }, [db, sessionId, userId]);
}
