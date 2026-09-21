import type {
  AppNotification,
  Booking,
  CheckIn,
  CourseTemplate,
  Invoice,
  LeaderboardEntry,
  Lift,
  Membership,
  PersonalRecord,
  Plan,
  Result,
  Session,
  ShopArticle,
  Order,
  User,
  Wod,
} from '../types';
import { rng, shuffle } from '../rng';
import { addDays, atTime, toDateKey } from '../../lib/clock';

/** Stabiler Hash, damit jede Session reproduzierbar dieselbe Historie bekommt */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** "Trainingsfleiß" je Mitglied – bestimmt, wie oft es in Kursen auftaucht */
function activityLevel(userId: string): number {
  return 0.2 + (hash(userId) % 1000) / 1250; // 0,2 … 1,0
}

const PRIME_TIMES = new Set(['17:00', '18:00', '19:00']);
const QUIET_TIMES = new Set(['06:00', '08:30', '12:00', '20:00']);

function targetFillRate(session: Session, template: CourseTemplate, random: () => number): number {
  let base = 0.62;
  if (PRIME_TIMES.has(session.startTime)) base = 0.95;
  else if (QUIET_TIMES.has(session.startTime)) base = 0.55;
  if (template.kind === 'Open Gym') base -= 0.15;
  if (template.kind === 'Fundamentals') base = 0.8;
  if (template.kind === 'Partner-WOD') base = 0.98;
  if (template.kind === 'Mobility') base = 0.5;
  return Math.max(0.25, Math.min(1.25, base + (random() - 0.5) * 0.3));
}

export interface HistoryInput {
  sessions: Session[];
  templates: CourseTemplate[];
  members: User[];
  plans: Plan[];
  lifts: Lift[];
  wods: Wod[];
  articles: ShopArticle[];
  currentMemberId: string;
  tenantId: string;
  seasonId: string;
  now: Date;
}

export interface HistoryOutput {
  bookings: Booking[];
  checkIns: CheckIn[];
  results: Result[];
  leaderboard: LeaderboardEntry[];
  memberships: Membership[];
  invoices: Invoice[];
  personalRecords: PersonalRecord[];
  orders: Order[];
  notifications: AppNotification[];
  sessions: Session[];
}

export function generateHistory(input: HistoryInput): HistoryOutput {
  const { sessions, templates, members, plans, lifts, articles, currentMemberId, tenantId, seasonId, now } = input;
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const activeMembers = members.filter((m) => m.status !== 'inaktiv');

  const bookings: Booking[] = [];
  const checkIns: CheckIn[] = [];
  const results: Result[] = [];
  const leaderboard: LeaderboardEntry[] = [];
  const decoratedSessions = sessions.map((s) => ({ ...s }));

  // Die zwei jüngsten vergangenen Kurse bleiben ohne Punkte, damit die
  // Punktevergabe in der Demo live vorgeführt werden kann.
  const pastWithWod = decoratedSessions
    .filter((s) => s.status === 'vorbei' && s.wodId)
    .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));
  const openPointIds = new Set(pastWithWod.slice(-2).map((s) => s.id));

  // Niemand besucht mehrere Kurse am selben Tag – hält Besuchszahlen realistisch
  const bookedPerDay = new Set<string>();

  for (const session of decoratedSessions) {
    const template = templateById.get(session.templateId);
    if (!template || session.status === 'abgesagt') continue;

    const random = rng(hash(session.id));
    const start = atTime(session.date, session.startTime);
    const fill = targetFillRate(session, template, random);
    const seats = Math.min(Math.round(session.capacity * fill), session.capacity + 4);

    const ranked = shuffle(random, activeMembers)
      .filter((m) => !bookedPerDay.has(`${m.id}|${session.date}`))
      .map((m) => ({ member: m, score: activityLevel(m.id) * (0.4 + random() * 0.8) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(0, seats))
      .map((entry) => entry.member);

    let booked = 0;
    ranked.forEach((member) => {
      bookedPerDay.add(`${member.id}|${session.date}`);
      const onWaitlist = booked >= session.capacity;
      if (!onWaitlist) booked++;

      let status: Booking['status'];
      if (session.status === 'vorbei') {
        const roll = random();
        status = roll < 0.06 ? 'no-show' : roll < 0.12 ? 'storniert' : 'anwesend';
      } else {
        status = onWaitlist ? 'warteliste' : 'gebucht';
      }

      bookings.push({
        id: `b-${session.id}-${member.id}`,
        sessionId: session.id,
        userId: member.id,
        status,
        createdAt: addDays(start, -Math.ceil(random() * 5)).toISOString(),
      });

      if (status === 'anwesend') {
        checkIns.push({
          id: `ci-${session.id}-${member.id}`,
          sessionId: session.id,
          userId: member.id,
          at: new Date(start.getTime() - Math.round(random() * 12) * 60_000).toISOString(),
          source: random() < 0.6 ? 'kiosk' : random() < 0.8 ? 'qr' : 'trainer',
        });
      }
    });

    // Ergebnisse und Punkte nur für vergangene Kurse mit WOD
    if (session.status === 'vorbei' && session.wodId) {
      const attendees = bookings.filter((b) => b.sessionId === session.id && b.status === 'anwesend');
      const awardPoints = !openPointIds.has(session.id);
      if (awardPoints) session.pointsGiven = true;

      attendees.forEach((booking) => {
        if (random() < 0.62) {
          const seconds = 300 + Math.round(random() * 480);
          results.push({
            id: `r-${session.id}-${booking.userId}`,
            sessionId: session.id,
            userId: booking.userId,
            wodId: session.wodId,
            scoreType: 'zeit',
            value: seconds,
            display: `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, '0')}`,
            rx: random() < 0.55,
            createdAt: new Date(start.getTime() + 75 * 60_000).toISOString(),
          });
        }
        if (awardPoints) {
          leaderboard.push({
            id: `lb-${session.id}-${booking.userId}`,
            tenantId,
            seasonId,
            sessionId: session.id,
            userId: booking.userId,
            points: 8 + Math.round(random() * 22),
          });
        }
      });
    }
  }

  ensureCurrentMemberStory(decoratedSessions, bookings, currentMemberId, now);

  return {
    sessions: decoratedSessions,
    bookings,
    checkIns,
    results,
    leaderboard,
    ...buildMemberData({ members, plans, lifts, articles, tenantId, now, currentMemberId }),
  };
}

/**
 * Sorgt dafür, dass das vorgeführte Mitglied eine erzählbare Ausgangslage hat:
 * ein Kurs heute, ein Kurs diese Woche, ein Platz auf einer Warteliste.
 */
function ensureCurrentMemberStory(sessions: Session[], bookings: Booking[], userId: string, now: Date): void {
  const upcoming = sessions
    .filter((s) => s.status === 'geplant' && atTime(s.date, s.startTime) > now)
    .sort((a, b) => atTime(a.date, a.startTime).getTime() - atTime(b.date, b.startTime).getTime());

  const setBooking = (session: Session, status: Booking['status']) => {
    const existing = bookings.find((b) => b.sessionId === session.id && b.userId === userId);
    if (existing) {
      existing.status = status;
      return;
    }
    bookings.push({
      id: `b-${session.id}-${userId}`,
      sessionId: session.id,
      userId,
      status,
      createdAt: new Date(now.getTime() - 86_400_000).toISOString(),
    });
  };

  // Nächster freier Kurs: gebucht
  const nextFree = upcoming.find((s) => {
    const count = bookings.filter((b) => b.sessionId === s.id && b.status === 'gebucht').length;
    return count < s.capacity;
  });
  if (nextFree) setBooking(nextFree, 'gebucht');

  // Ein weiterer Kurs später in der Woche
  const laterFree = upcoming.find((s) => {
    if (!nextFree || s.id === nextFree.id) return false;
    if (s.date === nextFree.date) return false;
    const count = bookings.filter((b) => b.sessionId === s.id && b.status === 'gebucht').length;
    return count < s.capacity;
  });
  if (laterFree) setBooking(laterFree, 'gebucht');

  // Ein ausgebuchter Kurs: Warteliste
  const full = upcoming.find((s) => {
    const count = bookings.filter((b) => b.sessionId === s.id && b.status === 'gebucht').length;
    return count >= s.capacity;
  });
  if (full) setBooking(full, 'warteliste');
}

interface MemberDataInput {
  members: User[];
  plans: Plan[];
  lifts: Lift[];
  articles: ShopArticle[];
  tenantId: string;
  now: Date;
  currentMemberId: string;
}

function buildMemberData({ members, plans, lifts, articles, tenantId, now, currentMemberId }: MemberDataInput) {
  const memberships: Membership[] = [];
  const invoices: Invoice[] = [];
  const personalRecords: PersonalRecord[] = [];
  const orders: Order[] = [];
  const notifications: AppNotification[] = [];

  const distribution = ['p-flat', 'p-flat', 'p-flat', 'p-flat', 'p-8er', 'p-8er', 'p-student', 'p-opengym', 'p-10block'];
  const baseWeights: Record<string, number> = {
    'lift-backsquat': 95,
    'lift-frontsquat': 78,
    'lift-deadlift': 120,
    'lift-benchpress': 72,
    'lift-strictpress': 45,
    'lift-snatch': 52,
    'lift-cleanjerk': 68,
    'lift-overheadsquat': 48,
  };

  members.forEach((member, index) => {
    const random = rng(hash(member.id));
    const planId = distribution[index % distribution.length];
    const plan = plans.find((p) => p.id === planId) ?? plans[0];
    const started = new Date(member.joinedAt);

    const status: Membership['status'] =
      member.status === 'pausiert' ? 'pausiert' : member.status === 'inaktiv' ? 'gekuendigt' : 'aktiv';

    memberships.push({
      id: `ms-${member.id}`,
      userId: member.id,
      planId,
      startedAt: member.joinedAt,
      endsAt: status === 'gekuendigt' ? toDateKey(addDays(now, -20)) : null,
      status,
      pausedUntil: status === 'pausiert' ? toDateKey(addDays(now, 38)) : undefined,
      usedThisMonth: plan.sessionsPerMonth ? Math.min(plan.sessionsPerMonth, Math.round(random() * plan.sessionsPerMonth)) : Math.round(random() * 14),
    });

    // Rechnungen der letzten acht Monate
    if (plan.interval === 'monat') {
      for (let back = 7; back >= 0; back--) {
        const issued = new Date(now.getFullYear(), now.getMonth() - back, 1);
        if (issued < started) continue;
        const isCurrent = back === 0;
        const overdueCandidate = index % 11 === 0 && back === 1;
        invoices.push({
          id: `inv-${member.id}-${back}`,
          tenantId,
          userId: member.id,
          number: `${issued.getFullYear()}-${`${100 + index * 8 + back}`.slice(-4).padStart(4, '0')}`,
          periodLabel: issued.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
          amountCents: plan.priceCents,
          issuedAt: toDateKey(issued),
          dueAt: toDateKey(new Date(issued.getFullYear(), issued.getMonth(), 10)),
          status: overdueCandidate ? 'ueberfaellig' : isCurrent && index % 5 === 0 ? 'offen' : 'bezahlt',
          method: index % 4 === 0 ? 'karte' : 'sepa',
        });
      }
    }

    // Persönliche Rekorde: Kerngruppe ausführlich, Rest knapp
    const core = index < 12 || member.id === currentMemberId;
    const usedLifts = core ? lifts : lifts.slice(0, 4);
    const entries = core ? 4 : 2;
    usedLifts.forEach((lift) => {
      const target = Math.round((baseWeights[lift.id] ?? 60) * (0.6 + random() * 0.7));
      for (let step = entries - 1; step >= 0; step--) {
        personalRecords.push({
          id: `pr-${member.id}-${lift.id}-${step}`,
          userId: member.id,
          liftId: lift.id,
          valueKg: Math.max(20, target - step * (2 + Math.round(random() * 5))),
          achievedAt: toDateKey(addDays(now, -(step * 70 + Math.round(random() * 30) + 5))),
        });
      }
    });

    // Bestellungen für einen Teil der Mitglieder
    if (index % 5 === 2) {
      const article = articles[index % articles.length];
      const second = articles[(index + 3) % articles.length];
      const items = [
        { articleId: article.id, qty: 1, priceCents: article.priceCents },
        ...(index % 3 === 0 ? [{ articleId: second.id, qty: 2, priceCents: second.priceCents }] : []),
      ];
      orders.push({
        id: `o-${member.id}`,
        tenantId,
        userId: member.id,
        number: `CFR-${2000 + index}`,
        items,
        totalCents: items.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
        status: index % 3 === 0 ? 'abholbereit' : index % 3 === 1 ? 'abgeholt' : 'neu',
        createdAt: addDays(now, -(index % 21) - 1).toISOString(),
      });
    }
  });

  notifications.push(
    {
      id: 'n-1',
      userId: currentMemberId,
      kind: 'warteliste',
      title: 'Du bist nachgerückt',
      body: 'Ein Platz im Kurs ist frei geworden – du bist jetzt fest gebucht.',
      at: addDays(now, -1).toISOString(),
      read: false,
      link: '/app/buchungen',
    },
    {
      id: 'n-2',
      userId: currentMemberId,
      kind: 'leaderboard',
      title: 'Punkte gutgeschrieben',
      body: 'Für den letzten WOD wurden dir 104 Punkte gutgeschrieben.',
      at: addDays(now, -2).toISOString(),
      read: false,
      link: '/app/leaderboard',
    },
    {
      id: 'n-3',
      userId: currentMemberId,
      kind: 'news',
      title: 'Neue Ankündigung',
      body: 'Am Samstag steigt das Community-WOD mit anschließendem Frühstück.',
      at: addDays(now, -4).toISOString(),
      read: true,
      link: '/app/news',
    },
  );

  return { memberships, invoices, personalRecords, orders, notifications };
}
