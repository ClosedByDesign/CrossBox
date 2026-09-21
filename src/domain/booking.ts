import type { Booking, Membership, Plan, Session, Tenant } from '../data/types';
import { atTime, minutesBetween } from '../lib/clock';

export type BookingBlockReason =
  | 'ok'
  | 'abgesagt'
  | 'vorbei'
  | 'laeuft'
  | 'fenster-zu'
  | 'ausgebucht'
  | 'gebucht'
  | 'warteliste'
  | 'vertrag-pausiert'
  | 'vertrag-gekuendigt'
  | 'kontingent-erschoepft';

export interface BookingState {
  start: Date;
  end: Date;
  freeSpots: number;
  bookedCount: number;
  waitlistCount: number;
  waitlistPosition: number | null;
  myBooking: Booking | null;
  isFull: boolean;
  canBook: boolean;
  canJoinWaitlist: boolean;
  canCancel: boolean;
  canCheckIn: boolean;
  lateCancel: boolean;
  bookingOpensAt: Date;
  cancelDeadline: Date;
  reason: BookingBlockReason;
}

const CHECK_IN_WINDOW_MIN = 30;

/**
 * Einzige Wahrheit für Buchungsfenster, Stornofrist, Warteliste, Kontingent und
 * Check-in. Kursplan, Kursdetail und jeder Bestätigungsdialog lesen denselben
 * Zustand – so kann die Oberfläche nicht auseinanderlaufen.
 */
export function getBookingState(params: {
  session: Session;
  bookings: Booking[];
  userId: string | null;
  membership?: Membership | null;
  plan?: Plan | null;
  tenant: Tenant;
  now: Date;
}): BookingState {
  const { session, bookings, userId, membership, plan, tenant, now } = params;

  const sessionBookings = bookings.filter((b) => b.sessionId === session.id);
  const active = sessionBookings.filter((b) => b.status === 'gebucht' || b.status === 'anwesend');
  const waitlist = sessionBookings
    .filter((b) => b.status === 'warteliste')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const myBooking = userId ? sessionBookings.find((b) => b.userId === userId) ?? null : null;
  const start = atTime(session.date, session.startTime);
  const end = new Date(start.getTime() + session.durationMin * 60_000);

  const bookedCount = active.length;
  const freeSpots = Math.max(0, session.capacity - bookedCount);
  const isFull = freeSpots === 0;

  const bookingOpensAt = new Date(start.getTime() - tenant.bookingWindowDays * 86_400_000);
  const cancelDeadline = new Date(start.getTime() - tenant.cancelDeadlineHours * 3_600_000);

  const waitlistPosition =
    myBooking?.status === 'warteliste' ? waitlist.findIndex((b) => b.id === myBooking.id) + 1 : null;

  const minutesToStart = minutesBetween(now, start);
  const canCheckIn =
    !!myBooking &&
    (myBooking.status === 'gebucht' || myBooking.status === 'anwesend') &&
    minutesToStart <= CHECK_IN_WINDOW_MIN &&
    now <= end &&
    session.status !== 'abgesagt';

  const state: BookingState = {
    start,
    end,
    freeSpots,
    bookedCount,
    waitlistCount: waitlist.length,
    waitlistPosition,
    myBooking,
    isFull,
    canBook: false,
    canJoinWaitlist: false,
    canCancel: false,
    canCheckIn,
    lateCancel: false,
    bookingOpensAt,
    cancelDeadline,
    reason: 'ok',
  };

  if (session.status === 'abgesagt') return { ...state, reason: 'abgesagt' };
  if (end <= now) return { ...state, reason: 'vorbei' };
  if (start <= now) return { ...state, reason: 'laeuft' };
  if (!userId) return state;

  if (myBooking?.status === 'gebucht') {
    return {
      ...state,
      reason: 'gebucht',
      canCancel: true,
      lateCancel: now > cancelDeadline,
    };
  }

  if (myBooking?.status === 'warteliste') {
    return { ...state, reason: 'warteliste', canCancel: true };
  }

  if (membership?.status === 'pausiert') return { ...state, reason: 'vertrag-pausiert' };
  if (membership?.status === 'gekuendigt') return { ...state, reason: 'vertrag-gekuendigt' };

  if (plan?.sessionsPerMonth != null && membership && membership.usedThisMonth >= plan.sessionsPerMonth) {
    return { ...state, reason: 'kontingent-erschoepft' };
  }

  if (now < bookingOpensAt) return { ...state, reason: 'fenster-zu' };

  if (isFull) {
    return { ...state, reason: 'ausgebucht', canJoinWaitlist: tenant.waitlistEnabled };
  }

  return { ...state, canBook: true };
}

/** Wer rückt nach, wenn ein Platz frei wird? */
export function nextOnWaitlist(bookings: Booking[], sessionId: string): Booking | null {
  return (
    bookings
      .filter((b) => b.sessionId === sessionId && b.status === 'warteliste')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null
  );
}
