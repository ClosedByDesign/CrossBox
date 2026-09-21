/*
 * Zentrale Fake-Datenbasis für den Klick-Prototyp.
 * Bewusst als globales JS-Objekt (kein fetch()/JSON), damit die Seiten
 * auch direkt per file:// geöffnet werden können, ohne lokalen Server.
 */

var CURRENT_MEMBER_ID = 'u-member-1';
var CURRENT_BOX_ADMIN_ID = 'u-admin-1';
var CURRENT_SUPER_ADMIN_ID = 'u-super-1';
var CURRENT_TENANT_ID = 't1';

var MOCK = {
  tenants: [
    { id: 't1', name: 'CrossFit Rheinblick', ort: 'Köln', boxAdminId: 'u-admin-1', status: 'aktiv', mitgliederAnzahl: 132 },
    { id: 't2', name: 'CrossFit Ostpark', ort: 'München', boxAdminId: 'u-admin-2', status: 'aktiv', mitgliederAnzahl: 87 },
    { id: 't3', name: 'CrossFit Hafenkante', ort: 'Hamburg', boxAdminId: null, status: 'inaktiv', mitgliederAnzahl: 0 }
  ],

  users: [
    { id: 'u-super-1', tenantId: null, role: 'super-admin', name: 'Sven Krüger', nickname: 'sven', email: 'sven@crossfit-app.de', avatarColor: '#3a3f47' },
    { id: 'u-admin-1', tenantId: 't1', role: 'box-admin', name: 'Petra Vogel', nickname: 'petra', email: 'petra@rheinblick.crossfit', avatarColor: '#e8590c' },
    { id: 'u-admin-2', tenantId: 't2', role: 'box-admin', name: 'Markus Lehmann', nickname: 'markus', email: 'markus@ostpark.crossfit', avatarColor: '#e8590c' },

    { id: 'u-member-1', tenantId: 't1', role: 'member', name: 'Anna Berger', nickname: 'annab', email: 'anna@example.com', avatarColor: '#2f9e44' },
    { id: 'u-member-2', tenantId: 't1', role: 'member', name: 'Jonas Weiss', nickname: 'jonasw', email: 'jonas@example.com', avatarColor: '#1971c2' },
    { id: 'u-member-3', tenantId: 't1', role: 'member', name: 'Mia Schulz', nickname: 'miasch', email: 'mia@example.com', avatarColor: '#9c36b5' },
    { id: 'u-member-4', tenantId: 't1', role: 'member', name: 'Paul Fischer', nickname: 'paulf', email: 'paul@example.com', avatarColor: '#e8590c' },
    { id: 'u-member-5', tenantId: 't1', role: 'member', name: 'Lea Hoffmann', nickname: 'leah', email: 'lea@example.com', avatarColor: '#f08c00' },
    { id: 'u-member-6', tenantId: 't1', role: 'member', name: 'Tom Richter', nickname: 'tomr', email: 'tom@example.com', avatarColor: '#1098ad' },
    { id: 'u-member-7', tenantId: 't1', role: 'member', name: 'Nina König', nickname: 'ninak', email: 'nina@example.com', avatarColor: '#d6336c' },
    { id: 'u-member-8', tenantId: 't1', role: 'member', name: 'Felix Wolf', nickname: 'felixw', email: 'felix@example.com', avatarColor: '#5c940d' },
    { id: 'u-member-9', tenantId: 't1', role: 'member', name: 'Sara Neumann', nickname: 'saran', email: 'sara@example.com', avatarColor: '#e8590c' },
    { id: 'u-member-10', tenantId: 't1', role: 'member', name: 'David Braun', nickname: 'davidb', email: 'david@example.com', avatarColor: '#1971c2' }
  ],

  courseTypes: [
    { id: 'ct-1', tenantId: 't1', name: 'WOD', weekdays: ['Montag'], time: '18:00', durationMin: 60, maxParticipants: 12, trainerId: 'u-admin-1' },
    { id: 'ct-2', tenantId: 't1', name: 'Open Gym', weekdays: ['Mittwoch'], time: '19:00', durationMin: 90, maxParticipants: 8, trainerId: 'u-admin-1' },
    { id: 'ct-3', tenantId: 't1', name: 'Weightlifting', weekdays: ['Freitag'], time: '17:00', durationMin: 60, maxParticipants: 6, trainerId: 'u-admin-1' },
    { id: 'ct-4', tenantId: 't1', name: 'Mobility & Recovery', weekdays: ['Sonntag'], time: '10:00', durationMin: 45, maxParticipants: 15, trainerId: 'u-admin-1' }
  ],

  // Konkrete, buchbare Termine, die aus den Kurstypen entstehen (aktuelle Woche Mo 21.09.–So 27.09., plus vergangene Termine).
  courseSessions: [
    { id: 'cs-5', courseTypeId: 'ct-1', date: '2026-09-21', weekday: 'Montag', status: 'live', pointsGiven: false, participantIds: ['u-member-1','u-member-2','u-member-3','u-member-4','u-member-5','u-member-6'], waitlistIds: [] },
    { id: 'cs-2', courseTypeId: 'ct-2', date: '2026-09-23', weekday: 'Mittwoch', status: 'upcoming', pointsGiven: false, participantIds: ['u-member-2','u-member-3','u-member-4','u-member-5','u-member-6','u-member-7','u-member-8','u-member-9'], waitlistIds: ['u-member-10'] },
    { id: 'cs-7', courseTypeId: 'ct-3', date: '2026-09-25', weekday: 'Freitag', status: 'upcoming', pointsGiven: false, participantIds: ['u-member-2','u-member-5'], waitlistIds: [] },
    { id: 'cs-8', courseTypeId: 'ct-4', date: '2026-09-27', weekday: 'Sonntag', status: 'upcoming', pointsGiven: false, participantIds: ['u-member-1','u-member-3','u-member-4','u-member-5','u-member-6','u-member-7','u-member-8','u-member-9','u-member-10','u-member-2'], waitlistIds: [] },
    { id: 'cs-3', courseTypeId: 'ct-1', date: '2026-09-14', weekday: 'Montag', status: 'past', pointsGiven: false, participantIds: ['u-member-1','u-member-2','u-member-3','u-member-4','u-member-5','u-member-6','u-member-7'], waitlistIds: [] },
    { id: 'cs-4', courseTypeId: 'ct-3', date: '2026-09-11', weekday: 'Freitag', status: 'past', pointsGiven: true, participantIds: ['u-member-1','u-member-2','u-member-4','u-member-6'], waitlistIds: [] },
    { id: 'cs-6', courseTypeId: 'ct-1', date: '2026-09-07', weekday: 'Montag', status: 'past', pointsGiven: true, participantIds: ['u-member-1','u-member-2','u-member-3','u-member-4','u-member-5','u-member-6','u-member-7'], waitlistIds: [] }
  ],

  exercises: [
    { id: 'ex-1', courseSessionId: 'cs-5', reihenfolge: 1, name: 'Aufwärmen', beschreibung: '3 Runden: 10 Air Squats, 10 Sit-ups, 200m Run' },
    { id: 'ex-2', courseSessionId: 'cs-5', reihenfolge: 2, name: 'Kraft', beschreibung: 'Back Squat 5-5-5-5-5, steigend' },
    { id: 'ex-3', courseSessionId: 'cs-5', reihenfolge: 3, name: 'WOD "Rheinblick"', beschreibung: 'AMRAP 15min: 12 Wallballs, 9 Box Jumps, 6 Bar Muscle-ups' },
    { id: 'ex-4', courseSessionId: 'cs-5', reihenfolge: 4, name: 'Cooldown', beschreibung: '5min Mobility: Hüfte & Schultern' },

    { id: 'ex-7', courseSessionId: 'cs-3', reihenfolge: 1, name: 'Aufwärmen', beschreibung: '3 Runden: 200m Run, 10 Burpees' },
    { id: 'ex-8', courseSessionId: 'cs-3', reihenfolge: 2, name: 'WOD "Montagshärte"', beschreibung: '5 Runden: 15 Deadlifts, 12 Box Jumps, 9 Toes-to-Bar' },

    { id: 'ex-9', courseSessionId: 'cs-4', reihenfolge: 1, name: 'Technik', beschreibung: 'Snatch Technik-Progression, 20min' },
    { id: 'ex-10', courseSessionId: 'cs-4', reihenfolge: 2, name: 'Kraft', beschreibung: 'Clean & Jerk 1-1-1-1-1, max. Gewicht' }
  ],

  // Punkte, die nach vergangenen Kursen vom Box-Admin vergeben wurden.
  leaderboardEntries: [
    { userId: 'u-member-1', tenantId: 't1', courseSessionId: 'cs-4', points: 95 },
    { userId: 'u-member-2', tenantId: 't1', courseSessionId: 'cs-4', points: 88 },
    { userId: 'u-member-4', tenantId: 't1', courseSessionId: 'cs-4', points: 102 },
    { userId: 'u-member-6', tenantId: 't1', courseSessionId: 'cs-4', points: 79 },

    { userId: 'u-member-1', tenantId: 't1', courseSessionId: 'cs-6', points: 110 },
    { userId: 'u-member-2', tenantId: 't1', courseSessionId: 'cs-6', points: 97 },
    { userId: 'u-member-3', tenantId: 't1', courseSessionId: 'cs-6', points: 105 },
    { userId: 'u-member-4', tenantId: 't1', courseSessionId: 'cs-6', points: 91 },
    { userId: 'u-member-5', tenantId: 't1', courseSessionId: 'cs-6', points: 88 },
    { userId: 'u-member-6', tenantId: 't1', courseSessionId: 'cs-6', points: 100 },
    { userId: 'u-member-7', tenantId: 't1', courseSessionId: 'cs-6', points: 84 }
  ],

  shopArticles: [
    { id: 'sa-1', name: 'Box Shirt "Rheinblick"', preis: 29.90, kategorie: 'Bekleidung', emoji: '👕', beschreibung: 'Atmungsaktives Trainingsshirt mit Box-Logo.' },
    { id: 'sa-2', name: 'Chalk Bag', preis: 14.90, kategorie: 'Zubehör', emoji: '🎒', beschreibung: 'Kreidebeutel zum Anclippen an den Gürtel.' },
    { id: 'sa-3', name: 'Grip Pads', preis: 24.90, kategorie: 'Zubehör', emoji: '🧤', beschreibung: 'Handschutz für Pull-ups und Muscle-ups.' },
    { id: 'sa-4', name: 'Protein Bar Box (12er)', preis: 19.90, kategorie: 'Ernährung', emoji: '🍫', beschreibung: 'Proteinriegel, Schoko-Karamell, 12 Stück.' },
    { id: 'sa-5', name: 'Shaker Bottle', preis: 9.90, kategorie: 'Zubehör', emoji: '🥤', beschreibung: 'Trinkflasche mit Mixball, 700ml.' },
    { id: 'sa-6', name: 'Trucker Cap', preis: 19.90, kategorie: 'Bekleidung', emoji: '🧢', beschreibung: 'Cap mit gesticktem Box-Logo.' }
  ],

  cartDemo: [
    { articleId: 'sa-2', menge: 1 },
    { articleId: 'sa-3', menge: 1 }
  ]
};

// --- kleine Lookup-Helfer, direkt auf MOCK ---
MOCK.getUser = function (id) { return MOCK.users.find(function (u) { return u.id === id; }); };
MOCK.getTenant = function (id) { return MOCK.tenants.find(function (t) { return t.id === id; }); };
MOCK.getCourseType = function (id) { return MOCK.courseTypes.find(function (c) { return c.id === id; }); };
MOCK.getCourseSession = function (id) { return MOCK.courseSessions.find(function (c) { return c.id === id; }); };
MOCK.getArticle = function (id) { return MOCK.shopArticles.find(function (a) { return a.id === id; }); };
MOCK.exercisesFor = function (courseSessionId) {
  return MOCK.exercises
    .filter(function (e) { return e.courseSessionId === courseSessionId; })
    .sort(function (a, b) { return a.reihenfolge - b.reihenfolge; });
};
