/** Domänenmodell des Prototyps. Bewusst nah an einem echten Schema gehalten,
 *  damit es später 1:1 als Grundlage für Backend und API dienen kann. */

export type Role = 'member' | 'coach' | 'box-admin' | 'super-admin';
export type Locale = 'de' | 'en';
export type Theme = 'dark' | 'light';

/** 1 = Montag … 7 = Sonntag (ISO) */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OpeningHour {
  weekday: Weekday;
  from: string;
  to: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  city: string;
  street: string;
  zip: string;
  email: string;
  phone: string;
  initials: string;
  status: 'aktiv' | 'inaktiv';
  platformPlanId: string;
  since: string;
  /** Buchungsregeln der Box */
  bookingWindowDays: number;
  cancelDeadlineHours: number;
  waitlistEnabled: boolean;
  noShowFeeCents: number;
  openingHours: OpeningHour[];
}

export interface User {
  id: string;
  tenantId: string | null;
  role: Role;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone?: string;
  avatarHue: number;
  joinedAt: string;
  status: 'aktiv' | 'pausiert' | 'inaktiv';
  birthday?: string;
  emergencyContact?: string;
  /** nur Trainer */
  headline?: string;
  bio?: string;
  certifications?: string[];
}

export interface Plan {
  id: string;
  tenantId: string;
  name: string;
  priceCents: number;
  interval: 'monat' | 'einmalig';
  /** null = unbegrenzt */
  sessionsPerMonth: number | null;
  minTermMonths: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  startedAt: string;
  endsAt: string | null;
  status: 'aktiv' | 'pausiert' | 'gekuendigt';
  pausedUntil?: string;
  usedThisMonth: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  userId: string;
  number: string;
  periodLabel: string;
  amountCents: number;
  issuedAt: string;
  dueAt: string;
  status: 'bezahlt' | 'offen' | 'ueberfaellig';
  method: 'sepa' | 'karte';
}

export type CourseKind =
  | 'WOD'
  | 'Open Gym'
  | 'Weightlifting'
  | 'Gymnastics'
  | 'Endurance'
  | 'Mobility'
  | 'Teens'
  | 'Fundamentals'
  | 'Partner-WOD';

export interface CourseTemplate {
  id: string;
  tenantId: string;
  name: string;
  kind: CourseKind;
  description: string;
  level: 'Alle Level' | 'Einsteiger' | 'Fortgeschritten';
  weekdays: Weekday[];
  startTime: string;
  durationMin: number;
  capacity: number;
  coachId: string;
  active: boolean;
}

export type SessionStatus = 'geplant' | 'laeuft' | 'vorbei' | 'abgesagt';

export interface Session {
  id: string;
  tenantId: string;
  templateId: string;
  /** ISO-Datum YYYY-MM-DD */
  date: string;
  startTime: string;
  durationMin: number;
  capacity: number;
  coachId: string;
  status: SessionStatus;
  wodId: string | null;
  cancelReason?: string;
  pointsGiven: boolean;
  /** true, wenn der Trainer von der Vorlage abweicht (Vertretung) */
  substitute?: boolean;
}

export type BookingStatus = 'gebucht' | 'warteliste' | 'storniert' | 'anwesend' | 'no-show';

export interface Booking {
  id: string;
  sessionId: string;
  userId: string;
  status: BookingStatus;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  sessionId: string;
  userId: string;
  at: string;
  source: 'kiosk' | 'qr' | 'trainer';
}

export interface WodBlock {
  label: string;
  /** einzelne Zeilen, z.B. "21-15-9 Thruster 43/30 kg" */
  lines: string[];
}

export type WodKind = 'AMRAP' | 'EMOM' | 'For Time' | 'Strength' | 'Chipper' | 'Tabata';

export interface Wod {
  id: string;
  tenantId: string;
  name: string;
  kind: WodKind;
  /** Zeitvorgabe in Minuten (AMRAP/EMOM/Cap) */
  capMinutes: number | null;
  blocks: WodBlock[];
  scalingRx?: string;
  scalingScaled?: string;
  benchmark: boolean;
  isTemplate: boolean;
  description?: string;
}

export type ScoreType = 'zeit' | 'runden' | 'gewicht' | 'reps';

export interface Result {
  id: string;
  sessionId: string;
  userId: string;
  wodId: string | null;
  scoreType: ScoreType;
  /** Sekunden, Runden(+Reps als Dezimale), kg oder Wiederholungen */
  value: number;
  display: string;
  rx: boolean;
  note?: string;
  createdAt: string;
}

export interface Lift {
  id: string;
  name: string;
  category: 'Olympisch' | 'Kraft' | 'Gymnastics';
}

export interface PersonalRecord {
  id: string;
  userId: string;
  liftId: string;
  valueKg: number;
  achievedAt: string;
  note?: string;
}

export interface Season {
  id: string;
  tenantId: string;
  name: string;
  from: string;
  to: string;
  active: boolean;
}

export interface LeaderboardEntry {
  id: string;
  tenantId: string;
  seasonId: string;
  sessionId: string;
  userId: string;
  points: number;
}

export interface ShopArticle {
  id: string;
  tenantId: string;
  name: string;
  category: 'Bekleidung' | 'Zubehör' | 'Ernährung' | 'Gutschein';
  priceCents: number;
  emoji: string;
  description: string;
  stock: number;
  active: boolean;
}

export interface OrderItem {
  articleId: string;
  qty: number;
  priceCents: number;
}

export interface Order {
  id: string;
  tenantId: string;
  userId: string;
  number: string;
  items: OrderItem[];
  totalCents: number;
  status: 'neu' | 'abholbereit' | 'abgeholt' | 'storniert';
  createdAt: string;
}

export interface NewsPost {
  id: string;
  tenantId: string;
  title: string;
  teaser: string;
  body: string;
  authorId: string;
  publishedAt: string;
  pinned: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  kind: 'buchung' | 'warteliste' | 'absage' | 'news' | 'zahlung' | 'leaderboard' | 'shop';
  title: string;
  body: string;
  at: string;
  read: boolean;
  link?: string;
}

export interface TrialRequest {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  preferredDate?: string;
  message?: string;
  status: 'neu' | 'kontaktiert' | 'erledigt';
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  from: 'box' | 'plattform';
  authorName: string;
  body: string;
  at: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  subject: string;
  status: 'offen' | 'in-arbeit' | 'geschlossen';
  priority: 'niedrig' | 'normal' | 'hoch';
  createdAt: string;
  messages: SupportMessage[];
}

export interface PlatformPlan {
  id: string;
  name: string;
  priceCents: number;
  maxMembers: number | null;
  features: string[];
}

export interface PlatformInvoice {
  id: string;
  tenantId: string;
  number: string;
  periodLabel: string;
  amountCents: number;
  status: 'bezahlt' | 'offen' | 'ueberfaellig';
  issuedAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabledTenantIds: string[];
  globallyEnabled: boolean;
}

/** Ausnahmen, die auf den generierten Wochenplan angewendet werden */
export interface ScheduleException {
  id: string;
  tenantId: string;
  date: string;
  /** null = ganzer Tag (z.B. Feiertag) */
  templateId: string | null;
  kind: 'feiertag' | 'absage' | 'vertretung';
  reason: string;
  substituteCoachId?: string;
}

export interface CartItem {
  articleId: string;
  qty: number;
}

/** Der komplette Demo-Datenbestand */
export interface DemoData {
  tenants: Tenant[];
  users: User[];
  plans: Plan[];
  memberships: Membership[];
  invoices: Invoice[];
  courseTemplates: CourseTemplate[];
  sessions: Session[];
  bookings: Booking[];
  checkIns: CheckIn[];
  wods: Wod[];
  results: Result[];
  lifts: Lift[];
  personalRecords: PersonalRecord[];
  seasons: Season[];
  leaderboard: LeaderboardEntry[];
  shopArticles: ShopArticle[];
  orders: Order[];
  news: NewsPost[];
  notifications: AppNotification[];
  trialRequests: TrialRequest[];
  supportTickets: SupportTicket[];
  platformPlans: PlatformPlan[];
  platformInvoices: PlatformInvoice[];
  featureFlags: FeatureFlag[];
  scheduleExceptions: ScheduleException[];
}

/** Wer Kurse gibt: Trainer und die Boxleitung, die selbst auf der Fläche steht */
export function isCoach(user: Pick<User, 'role'>): boolean {
  return user.role === 'coach' || user.role === 'box-admin';
}
