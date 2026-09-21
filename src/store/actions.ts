import type { AppNotification, Booking, Order, PersonalRecord, Result, ScoreType } from '../data/types';
import { getDb, useDemoStore } from './index';
import { nextOnWaitlist } from '../domain/booking';
import { now } from '../lib/clock';

const store = () => useDemoStore.getState();

function notify(userId: string, notification: Omit<AppNotification, 'id' | 'userId' | 'at' | 'read'>): void {
  store().createEntity('notifications', {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    at: now().toISOString(),
    read: false,
    ...notification,
  });
}

export function bookSession(sessionId: string, userId: string, status: Booking['status'] = 'gebucht'): void {
  const db = getDb();
  const existing = db.bookings.find((b) => b.sessionId === sessionId && b.userId === userId);
  if (existing) {
    store().updateEntity('bookings', existing.id, { status, createdAt: now().toISOString() });
    return;
  }
  store().createEntity('bookings', {
    id: `b-${sessionId}-${userId}`,
    sessionId,
    userId,
    status,
    createdAt: now().toISOString(),
  });
}

export function joinWaitlist(sessionId: string, userId: string): void {
  bookSession(sessionId, userId, 'warteliste');
}

/** Storniert und rückt automatisch die erste Person von der Warteliste nach */
export function cancelBooking(sessionId: string, userId: string): { promotedUserId: string | null } {
  const db = getDb();
  const booking = db.bookings.find((b) => b.sessionId === sessionId && b.userId === userId);
  if (!booking) return { promotedUserId: null };

  const wasBooked = booking.status === 'gebucht';
  store().updateEntity('bookings', booking.id, { status: 'storniert' });

  if (!wasBooked) return { promotedUserId: null };

  const next = nextOnWaitlist(
    db.bookings.filter((b) => b.id !== booking.id),
    sessionId,
  );
  if (!next) return { promotedUserId: null };

  store().updateEntity('bookings', next.id, { status: 'gebucht' });
  const session = db.sessions.find((s) => s.id === sessionId);
  const template = db.courseTemplates.find((t) => t.id === session?.templateId);
  notify(next.userId, {
    kind: 'warteliste',
    title: 'Du bist nachgerückt',
    body: `Ein Platz in ${template?.name ?? 'deinem Kurs'} ist frei geworden – du bist jetzt fest gebucht.`,
    link: '/app/buchungen',
  });
  return { promotedUserId: next.userId };
}

export function checkIn(sessionId: string, userId: string, source: 'kiosk' | 'qr' | 'trainer' = 'qr'): void {
  const db = getDb();
  const booking = db.bookings.find((b) => b.sessionId === sessionId && b.userId === userId);
  if (booking) store().updateEntity('bookings', booking.id, { status: 'anwesend' });
  if (db.checkIns.some((c) => c.sessionId === sessionId && c.userId === userId)) return;
  store().createEntity('checkIns', {
    id: `ci-${sessionId}-${userId}`,
    sessionId,
    userId,
    at: now().toISOString(),
    source,
  });
}

export function setAttendance(bookingId: string, status: Booking['status']): void {
  store().updateEntity('bookings', bookingId, { status });
}

export function awardPoints(sessionId: string, points: Record<string, number>, seasonId: string, tenantId: string): void {
  const db = getDb();
  Object.entries(points).forEach(([userId, value]) => {
    const existing = db.leaderboard.find((e) => e.sessionId === sessionId && e.userId === userId);
    if (existing) {
      store().updateEntity('leaderboard', existing.id, { points: value });
    } else {
      store().createEntity('leaderboard', {
        id: `lb-${sessionId}-${userId}`,
        tenantId,
        seasonId,
        sessionId,
        userId,
        points: value,
      });
    }
    notify(userId, {
      kind: 'leaderboard',
      title: 'Punkte gutgeschrieben',
      body: `Für deinen letzten Kurs wurden dir ${value} Punkte gutgeschrieben.`,
      link: '/app/leaderboard',
    });
  });
  store().updateEntity('sessions', sessionId, { pointsGiven: true });
}

export function saveResult(input: {
  sessionId: string;
  userId: string;
  wodId: string | null;
  scoreType: ScoreType;
  value: number;
  display: string;
  rx: boolean;
  note?: string;
}): void {
  const db = getDb();
  const existing = db.results.find((r) => r.sessionId === input.sessionId && r.userId === input.userId);
  const result: Result = {
    id: existing?.id ?? `r-${input.sessionId}-${input.userId}`,
    createdAt: now().toISOString(),
    ...input,
  };
  if (existing) store().updateEntity('results', existing.id, result);
  else store().createEntity('results', result);
}

export function savePersonalRecord(userId: string, liftId: string, valueKg: number, note?: string): void {
  const record: PersonalRecord = {
    id: `pr-${userId}-${liftId}-${Date.now()}`,
    userId,
    liftId,
    valueKg,
    achievedAt: now().toISOString().slice(0, 10),
    note,
  };
  store().createEntity('personalRecords', record);
  notify(userId, {
    kind: 'leaderboard',
    title: 'Neuer persönlicher Rekord',
    body: `${valueKg} kg – stark! Der Wert ist in deinem Verlauf eingetragen.`,
    link: '/app/rekorde',
  });
}

export function placeOrder(userId: string, tenantId: string): Order | null {
  const state = store();
  const db = getDb();
  if (state.cart.length === 0) return null;

  const items = state.cart.map((item) => {
    const article = db.shopArticles.find((a) => a.id === item.articleId);
    return { articleId: item.articleId, qty: item.qty, priceCents: article?.priceCents ?? 0 };
  });

  const order: Order = {
    id: `o-${Date.now()}`,
    tenantId,
    userId,
    number: `CFR-${3000 + Math.floor(Math.random() * 900)}`,
    items,
    totalCents: items.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
    status: 'neu',
    createdAt: now().toISOString(),
  };
  state.createEntity('orders', order);
  state.clearCart();
  notify(userId, {
    kind: 'shop',
    title: 'Bestellung aufgenommen',
    body: `Deine Bestellung ${order.number} liegt bald zur Abholung an der Theke bereit.`,
    link: '/app/bestellungen',
  });
  return order;
}

export function markNotificationRead(id: string): void {
  store().updateEntity('notifications', id, { read: true });
}

export function markAllNotificationsRead(userId: string): void {
  getDb()
    .notifications.filter((n) => n.userId === userId && !n.read)
    .forEach((n) => store().updateEntity('notifications', n.id, { read: true }));
}

/** Admin: Kurs absagen und alle Gebuchten benachrichtigen */
export function cancelSession(sessionId: string, reason: string): void {
  const db = getDb();
  const session = db.sessions.find((s) => s.id === sessionId);
  const template = db.courseTemplates.find((t) => t.id === session?.templateId);
  store().updateEntity('sessions', sessionId, { status: 'abgesagt', cancelReason: reason });

  db.bookings
    .filter((b) => b.sessionId === sessionId && (b.status === 'gebucht' || b.status === 'warteliste'))
    .forEach((b) => {
      notify(b.userId, {
        kind: 'absage',
        title: 'Kurs abgesagt',
        body: `${template?.name ?? 'Ein Kurs'} am ${session?.date ?? ''} wurde abgesagt: ${reason}`,
        link: '/app/buchungen',
      });
    });
}

export function assignWod(sessionId: string, wodId: string | null): void {
  store().updateEntity('sessions', sessionId, { wodId });
}
