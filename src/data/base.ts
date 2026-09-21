import type { DemoData, NewsPost, ScheduleException, Season, SupportTicket, PlatformInvoice, TrialRequest } from './types';
import {
  COURSE_TEMPLATES,
  FEATURE_FLAGS,
  LIFTS,
  MAIN_TENANT_ID,
  PLANS,
  PLATFORM_PLANS,
  SHOP_ARTICLES,
  TENANTS,
  WODS,
} from './seed/static';
import { OTHER_TENANT_ADMINS, SUPER_ADMIN, buildCoaches, buildMembers } from './seed/people';
import { generateSessions } from './generate/sessions';
import { generateHistory } from './generate/history';
import { addDays, startOfWeek, toDateKey, today } from '../lib/clock';

export const CURRENT_MEMBER_ID = 'u-member-1';
export const CURRENT_COACH_ID = 'u-coach-jana';
export const BOX_ADMIN_ID = 'u-coach-petra';
export const SUPER_ADMIN_ID = 'u-super-1';

const WEEKS_BACK = 8;
const WEEKS_AHEAD = 4;

/** Ausnahmen liegen relativ zu heute, damit sie in der Demo immer sichtbar sind */
function buildExceptions(reference: Date): ScheduleException[] {
  const monday = startOfWeek(reference);
  return [
    {
      id: 'ex-holiday',
      tenantId: MAIN_TENANT_ID,
      date: toDateKey(addDays(monday, -14)),
      templateId: null,
      kind: 'feiertag',
      reason: 'Feiertag – Box geschlossen',
    },
    {
      id: 'ex-cancel-past',
      tenantId: MAIN_TENANT_ID,
      date: toDateKey(addDays(monday, -4)),
      templateId: 'ct-wod-1900',
      kind: 'absage',
      reason: 'Trainer krank, kurzfristig abgesagt',
    },
    {
      id: 'ex-substitute',
      tenantId: MAIN_TENANT_ID,
      date: toDateKey(addDays(monday, 2)),
      templateId: 'ct-wod-1800',
      kind: 'vertretung',
      reason: 'Petra im Urlaub',
      substituteCoachId: 'u-coach-sofia',
    },
    {
      id: 'ex-cancel-future',
      tenantId: MAIN_TENANT_ID,
      date: toDateKey(addDays(monday, 9)),
      templateId: 'ct-opengym-0830',
      kind: 'absage',
      reason: 'Wartung der Ruderergometer',
    },
  ];
}

function buildNews(reference: Date, authorId: string): NewsPost[] {
  const at = (days: number) => addDays(reference, days).toISOString();
  return [
    {
      id: 'news-1',
      tenantId: MAIN_TENANT_ID,
      title: 'Community-WOD am Samstag',
      teaser: 'Partner-Workout, danach Frühstück auf der Dachterrasse.',
      body: 'Diesen Samstag um 10:00 Uhr steigt unser monatliches Community-WOD. Wir trainieren in Zweierteams, alle Bewegungen lassen sich skalieren – Einsteiger sind ausdrücklich willkommen. Im Anschluss gibt es Kaffee und Frühstück auf der Dachterrasse. Meldet euch bitte über den Kursplan an, damit wir die Teams einteilen können.',
      authorId,
      publishedAt: at(-2),
      pinned: true,
    },
    {
      id: 'news-2',
      tenantId: MAIN_TENANT_ID,
      title: 'Neuer Fundamentals-Kurs startet',
      teaser: 'Sechs Termine für alle, die neu anfangen – ab kommendem Montag.',
      body: 'Der nächste Fundamentals-Block startet am kommenden Montag um 18:00 Uhr. In sechs Terminen lernst du die Grundbewegungen sauber und sicher auszuführen, bevor du in die regulären Kurse einsteigst. Die Gruppe ist auf sechs Personen begrenzt.',
      authorId,
      publishedAt: at(-6),
      pinned: false,
    },
    {
      id: 'news-3',
      tenantId: MAIN_TENANT_ID,
      title: 'Neue Ruderergometer sind da',
      teaser: 'Vier zusätzliche Concept2 – kein Anstehen mehr bei Helen.',
      body: 'Wir haben vier neue Concept2-Ruderergometer aufgebaut. Damit stehen jetzt insgesamt zehn Geräte bereit und die Metcons mit Rudern laufen ohne Wartezeiten. Die alten Geräte wandern in den Open-Gym-Bereich.',
      authorId,
      publishedAt: at(-13),
      pinned: false,
    },
    {
      id: 'news-4',
      tenantId: MAIN_TENANT_ID,
      title: 'Öffnungszeiten an Feiertagen',
      teaser: 'Wann wir geschlossen haben und wann Open Gym läuft.',
      body: 'An Feiertagen bleibt die Box geschlossen, die betroffenen Kurse sind im Kursplan bereits als abgesagt markiert. Wer trotzdem trainieren möchte, findet am Vortag zusätzliche Open-Gym-Slots.',
      authorId,
      publishedAt: at(-20),
      pinned: false,
    },
    {
      id: 'news-5',
      tenantId: MAIN_TENANT_ID,
      title: 'Herbst-Challenge gestartet',
      teaser: 'Zwölf Wochen Punktewertung – das Leaderboard zählt jetzt.',
      body: 'Unsere Herbst-Challenge läuft: Für jeden Kurs vergeben die Trainer Punkte, die in die Gesamtwertung einfließen. Am Ende der Saison gibt es Preise für die ersten drei Plätze – und für die meisten Besuche.',
      authorId,
      publishedAt: at(-28),
      pinned: false,
    },
  ];
}

function buildTrialRequests(reference: Date): TrialRequest[] {
  return [
    {
      id: 'tr-1',
      tenantId: MAIN_TENANT_ID,
      name: 'Marcel Stein',
      email: 'marcel.stein@example.com',
      phone: '0170 5566778',
      preferredDate: toDateKey(addDays(reference, 3)),
      message: 'Komme aus dem Fitnessstudio, habe noch nie CrossFit gemacht.',
      status: 'neu',
      createdAt: addDays(reference, -1).toISOString(),
    },
    {
      id: 'tr-2',
      tenantId: MAIN_TENANT_ID,
      name: 'Yara Demir',
      email: 'yara.demir@example.com',
      preferredDate: toDateKey(addDays(reference, 5)),
      message: 'Ich trainiere seit zwei Jahren und ziehe gerade nach Köln.',
      status: 'kontaktiert',
      createdAt: addDays(reference, -4).toISOString(),
    },
    {
      id: 'tr-3',
      tenantId: MAIN_TENANT_ID,
      name: 'Bastian Roth',
      email: 'bastian.roth@example.com',
      phone: '0176 1122334',
      status: 'erledigt',
      message: 'Interesse am Fundamentals-Kurs.',
      createdAt: addDays(reference, -12).toISOString(),
    },
  ];
}

function buildSupportTickets(reference: Date): SupportTicket[] {
  return [
    {
      id: 'st-1',
      tenantId: MAIN_TENANT_ID,
      subject: 'SEPA-Rücklastschrift korrekt zuordnen',
      status: 'offen',
      priority: 'hoch',
      createdAt: addDays(reference, -1).toISOString(),
      messages: [
        {
          id: 'stm-1',
          from: 'box',
          authorName: 'Petra Vogel',
          body: 'Bei zwei Mitgliedern kam die Lastschrift zurück. Wie ordne ich die Zahlung nach dem Ausgleich richtig zu?',
          at: addDays(reference, -1).toISOString(),
        },
      ],
    },
    {
      id: 'st-2',
      tenantId: 't-ostpark',
      subject: 'Zweiter Standort anlegen',
      status: 'in-arbeit',
      priority: 'normal',
      createdAt: addDays(reference, -5).toISOString(),
      messages: [
        {
          id: 'stm-2',
          from: 'box',
          authorName: 'Katrin Sommer',
          body: 'Wir eröffnen im Januar eine zweite Fläche. Können wir die im selben Konto führen?',
          at: addDays(reference, -5).toISOString(),
        },
        {
          id: 'stm-3',
          from: 'plattform',
          authorName: 'Sven Krüger',
          body: 'Ja – dafür braucht ihr den Elite-Tarif. Ich schicke euch heute ein Angebot.',
          at: addDays(reference, -4).toISOString(),
        },
      ],
    },
    {
      id: 'st-3',
      tenantId: 't-hafenkante',
      subject: 'Beamer-Ansicht bleibt schwarz',
      status: 'geschlossen',
      priority: 'normal',
      createdAt: addDays(reference, -18).toISOString(),
      messages: [
        {
          id: 'stm-4',
          from: 'box',
          authorName: 'Ole Petersen',
          body: 'Der Fernseher zeigt nur einen schwarzen Bildschirm.',
          at: addDays(reference, -18).toISOString(),
        },
        {
          id: 'stm-5',
          from: 'plattform',
          authorName: 'Sven Krüger',
          body: 'Der Energiesparmodus des Displays war aktiv. Nach dem Deaktivieren läuft die Anzeige stabil.',
          at: addDays(reference, -17).toISOString(),
        },
      ],
    },
  ];
}

function buildPlatformInvoices(reference: Date): PlatformInvoice[] {
  const invoices: PlatformInvoice[] = [];
  const tenants = TENANTS.filter((t) => t.status === 'aktiv');
  tenants.forEach((tenant, tIndex) => {
    const plan = PLATFORM_PLANS.find((p) => p.id === tenant.platformPlanId) ?? PLATFORM_PLANS[0];
    for (let back = 5; back >= 0; back--) {
      const issued = new Date(reference.getFullYear(), reference.getMonth() - back, 1);
      invoices.push({
        id: `pi-${tenant.id}-${back}`,
        tenantId: tenant.id,
        number: `PF-${issued.getFullYear()}-${`${tIndex * 10 + back + 1}`.padStart(3, '0')}`,
        periodLabel: issued.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
        amountCents: plan.priceCents,
        status: back === 0 && tIndex === 1 ? 'offen' : back === 1 && tIndex === 2 ? 'ueberfaellig' : 'bezahlt',
        issuedAt: toDateKey(issued),
      });
    }
  });
  return invoices;
}

function buildSeason(reference: Date): Season {
  const from = new Date(reference.getFullYear(), reference.getMonth() - 2, 1);
  const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return {
    id: 'season-current',
    tenantId: MAIN_TENANT_ID,
    name: 'Herbst-Challenge',
    from: toDateKey(from),
    to: toDateKey(to),
    active: true,
  };
}

let cache: { key: string; data: DemoData } | null = null;

/**
 * Baut den kompletten Basis-Datenbestand relativ zum aktuellen Demo-Datum.
 * Wird nicht gespeichert, sondern bei jedem Laden neu erzeugt – dadurch veraltet
 * die Demo nie. Nur Nutzeraktionen landen im persistierten Overlay.
 */
export function buildBaseData(reference: Date = today()): DemoData {
  const key = toDateKey(reference) + reference.getHours();
  if (cache && cache.key === key) return cache.data;

  const coaches = buildCoaches(MAIN_TENANT_ID);
  const members = buildMembers(MAIN_TENANT_ID, reference);
  const users = [SUPER_ADMIN, ...OTHER_TENANT_ADMINS, ...coaches, ...members];

  const scheduleExceptions = buildExceptions(reference);
  const from = addDays(startOfWeek(reference), -WEEKS_BACK * 7);
  const to = addDays(startOfWeek(reference), WEEKS_AHEAD * 7 + 6);

  const generated = generateSessions(COURSE_TEMPLATES, scheduleExceptions, WODS, { from, to }, reference);
  const season = buildSeason(reference);

  const history = generateHistory({
    sessions: generated,
    templates: COURSE_TEMPLATES,
    members,
    plans: PLANS,
    lifts: LIFTS,
    wods: WODS,
    articles: SHOP_ARTICLES,
    currentMemberId: CURRENT_MEMBER_ID,
    tenantId: MAIN_TENANT_ID,
    seasonId: season.id,
    now: reference,
  });

  const data: DemoData = {
    tenants: TENANTS,
    users,
    plans: PLANS,
    memberships: history.memberships,
    invoices: history.invoices,
    courseTemplates: COURSE_TEMPLATES,
    sessions: history.sessions,
    bookings: history.bookings,
    checkIns: history.checkIns,
    wods: WODS,
    results: history.results,
    lifts: LIFTS,
    personalRecords: history.personalRecords,
    seasons: [season],
    leaderboard: history.leaderboard,
    shopArticles: SHOP_ARTICLES,
    orders: history.orders,
    news: buildNews(reference, BOX_ADMIN_ID),
    notifications: history.notifications,
    trialRequests: buildTrialRequests(reference),
    supportTickets: buildSupportTickets(reference),
    platformPlans: PLATFORM_PLANS,
    platformInvoices: buildPlatformInvoices(reference),
    featureFlags: FEATURE_FLAGS,
    scheduleExceptions,
  };

  cache = { key, data };
  return data;
}
