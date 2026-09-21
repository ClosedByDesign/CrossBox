import type { User } from '../types';
import { rng } from '../rng';

const COACHES: Array<Omit<User, 'tenantId' | 'role' | 'avatarHue' | 'status'>> = [
  {
    id: 'u-coach-petra',
    firstName: 'Petra',
    lastName: 'Vogel',
    nickname: 'petra',
    email: 'petra@crossfit-rheinblick.de',
    phone: '0221 4455010',
    joinedAt: '2016-03-01',
    headline: 'Head Coach & Inhaberin',
    bio: 'Hat die Box 2016 gegründet. Schwerpunkt Technik im Olympischen Gewichtheben und Einsteigerbetreuung – niemand bleibt bei ihr in der letzten Reihe stehen.',
    certifications: ['CF-L3', 'Weightlifting Level 2', 'Gymnastics'],
  },
  {
    id: 'u-coach-markus',
    firstName: 'Markus',
    lastName: 'Lehmann',
    nickname: 'markus',
    email: 'markus@crossfit-rheinblick.de',
    joinedAt: '2017-09-15',
    headline: 'Coach – Weightlifting',
    bio: 'Ehemaliger Gewichtheber, zuständig für die Weightlifting-Kurse und alles, was mit schweren Hanteln zu tun hat.',
    certifications: ['CF-L2', 'Weightlifting Level 1'],
  },
  {
    id: 'u-coach-jana',
    firstName: 'Jana',
    lastName: 'Roth',
    nickname: 'jana',
    email: 'jana@crossfit-rheinblick.de',
    joinedAt: '2019-01-07',
    headline: 'Coach – Gymnastics & Mobility',
    bio: 'Kommt aus dem Turnen. Bringt dir Handstand, Muscle-up und die Beweglichkeit bei, die du dafür brauchst.',
    certifications: ['CF-L2', 'Gymnastics', 'Mobility Specialist'],
  },
  {
    id: 'u-coach-tim',
    firstName: 'Tim',
    lastName: 'Berger',
    nickname: 'tim',
    email: 'tim@crossfit-rheinblick.de',
    joinedAt: '2020-06-01',
    headline: 'Coach – Endurance',
    bio: 'Triathlet. Verantwortet Endurance, Rudern und die Wettkampfvorbereitung.',
    certifications: ['CF-L1', 'Endurance Trainer'],
  },
  {
    id: 'u-coach-sofia',
    firstName: 'Sofia',
    lastName: 'Alves',
    nickname: 'sofia',
    email: 'sofia@crossfit-rheinblick.de',
    joinedAt: '2022-02-14',
    headline: 'Coach – Fundamentals & Teens',
    bio: 'Betreut den Anfängerkurs und die Teens-Gruppe. Geduldig, laut, immer gut gelaunt.',
    certifications: ['CF-L2', 'Kids & Teens'],
  },
];

const FIRST_NAMES = [
  'Anna', 'Jonas', 'Mia', 'Paul', 'Lea', 'Tom', 'Nina', 'Felix', 'Sara', 'David',
  'Julia', 'Lukas', 'Hannah', 'Max', 'Laura', 'Elias', 'Marie', 'Jan', 'Emma', 'Niklas',
  'Sophie', 'Ben', 'Clara', 'Moritz', 'Lena', 'Philipp', 'Johanna', 'Simon', 'Amelie', 'Erik',
  'Pia', 'Leon', 'Merle', 'Jakob', 'Ida', 'Fabian', 'Nele', 'Tobias', 'Greta', 'Kilian',
];

const LAST_NAMES = [
  'Berger', 'Weiss', 'Schulz', 'Fischer', 'Hoffmann', 'Richter', 'König', 'Wolf', 'Neumann', 'Braun',
  'Krause', 'Schneider', 'Becker', 'Hartmann', 'Schäfer', 'Köhler', 'Weber', 'Zimmermann', 'Lorenz', 'Peters',
  'Albrecht', 'Sommer', 'Winkler', 'Baumann', 'Kaiser', 'Engel', 'Vogt', 'Brandt', 'Kuhn', 'Schwarz',
];

/** Die ersten Namen bleiben fest, damit die vorgeführten Personen wiedererkennbar sind */
const NAMED_MEMBERS: Array<[string, string]> = [
  ['Anna', 'Berger'],
  ['Jonas', 'Weiss'],
  ['Mia', 'Schulz'],
  ['Paul', 'Fischer'],
  ['Lea', 'Hoffmann'],
  ['Tom', 'Richter'],
  ['Nina', 'König'],
  ['Felix', 'Wolf'],
  ['Sara', 'Neumann'],
  ['David', 'Braun'],
  ['Julia', 'Krause'],
  ['Lukas', 'Schneider'],
  ['Hannah', 'Becker'],
  ['Max', 'Hartmann'],
  ['Laura', 'Schäfer'],
  ['Elias', 'Köhler'],
  ['Marie', 'Weber'],
  ['Jan', 'Zimmermann'],
  ['Emma', 'Lorenz'],
  ['Niklas', 'Peters'],
  ['Sophie', 'Albrecht'],
  ['Ben', 'Sommer'],
  ['Clara', 'Winkler'],
  ['Moritz', 'Baumann'],
  ['Lena', 'Kaiser'],
  ['Philipp', 'Engel'],
  ['Johanna', 'Vogt'],
  ['Simon', 'Brandt'],
  ['Amelie', 'Kuhn'],
  ['Erik', 'Schwarz'],
  ['Pia', 'Ludwig'],
  ['Leon', 'Frank'],
  ['Merle', 'Haas'],
  ['Jakob', 'Otto'],
  ['Ida', 'Seidel'],
  ['Fabian', 'Graf'],
  ['Nele', 'Busch'],
  ['Tobias', 'Ziegler'],
  ['Greta', 'Simon'],
  ['Kilian', 'Arnold'],
  ['Romy', 'Böhm'],
  ['Milan', 'Voigt'],
  ['Thea', 'Kramer'],
  ['Samuel', 'Dietrich'],
  ['Frieda', 'Bauer'],
];

function nickname(first: string, last: string, index: number): string {
  const base = `${first.toLowerCase()}${last.charAt(0).toLowerCase()}`;
  return index % 7 === 3 ? `${base}${index}` : base;
}

function slugEmail(first: string, last: string): string {
  const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[äöüß]/g, (c) => map[c] ?? c)
      .replace(/[^a-z]/g, '');
  return `${clean(first)}.${clean(last)}@example.com`;
}

/** Trainer der Hauptbox */
export function buildCoaches(tenantId: string): User[] {
  return COACHES.map((c, i) => ({
    ...c,
    tenantId,
    role: 'coach' as const,
    avatarHue: (i * 61 + 18) % 360,
    status: 'aktiv' as const,
  }));
}

export const MEMBER_COUNT = 124;

/** Namensliste: feste Kernpersonen plus deterministisch kombinierte weitere Mitglieder */
function memberNames(): Array<[string, string]> {
  const names = [...NAMED_MEMBERS];
  const used = new Set(names.map(([f, l]) => `${f} ${l}`));
  let i = 0;
  while (names.length < MEMBER_COUNT) {
    const first = FIRST_NAMES[(i * 7 + 3) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 11 + 5) % LAST_NAMES.length];
    const key = `${first} ${last}`;
    if (!used.has(key)) {
      used.add(key);
      names.push([first, last]);
    }
    i++;
    if (i > 5000) break;
  }
  return names;
}

/** Mitglieder der Hauptbox – deterministisch erzeugt, damit die Demo reproduzierbar ist */
export function buildMembers(tenantId: string, today: Date): User[] {
  const random = rng(20260921);
  return memberNames().map(([first, last], i) => {
    const monthsAgo = Math.floor(random() * 54) + 1;
    const joined = new Date(today);
    joined.setMonth(joined.getMonth() - monthsAgo);
    // Die ersten zwölf bleiben aktiv – sie sind die vorgeführten Personen
    const status: User['status'] = i < 12 ? 'aktiv' : i % 17 === 5 ? 'pausiert' : i % 29 === 11 ? 'inaktiv' : 'aktiv';
    return {
      id: `u-member-${i + 1}`,
      tenantId,
      role: 'member' as const,
      firstName: first,
      lastName: last,
      nickname: nickname(first, last, i),
      email: slugEmail(first, last),
      phone: i % 3 === 0 ? `0151 ${2000000 + i * 4711}` : undefined,
      avatarHue: Math.floor(random() * 360),
      joinedAt: joined.toISOString().slice(0, 10),
      status,
      emergencyContact: i % 5 === 0 ? 'Partner:in – 0170 1122334' : undefined,
    };
  });
}

export const SUPER_ADMIN: User = {
  id: 'u-super-1',
  tenantId: null,
  role: 'super-admin',
  firstName: 'Sven',
  lastName: 'Krüger',
  nickname: 'sven',
  email: 'sven@boxflow.app',
  avatarHue: 212,
  joinedAt: '2015-01-01',
  status: 'aktiv',
  headline: 'Plattformbetrieb',
};

/** Admins der weiteren Mandanten (für die Super-Admin-Ansicht) */
export const OTHER_TENANT_ADMINS: User[] = [
  {
    id: 'u-admin-ostpark',
    tenantId: 't-ostpark',
    role: 'box-admin',
    firstName: 'Katrin',
    lastName: 'Sommer',
    nickname: 'katrin',
    email: 'katrin@crossfit-ostpark.de',
    avatarHue: 286,
    joinedAt: '2018-04-01',
    status: 'aktiv',
  },
  {
    id: 'u-admin-hafen',
    tenantId: 't-hafenkante',
    role: 'box-admin',
    firstName: 'Ole',
    lastName: 'Petersen',
    nickname: 'ole',
    email: 'ole@crossfit-hafenkante.de',
    avatarHue: 190,
    joinedAt: '2021-08-16',
    status: 'aktiv',
  },
  {
    id: 'u-admin-isar',
    tenantId: 't-isartal',
    role: 'box-admin',
    firstName: 'Bernd',
    lastName: 'Maier',
    nickname: 'bernd',
    email: 'bernd@crossfit-isartal.de',
    avatarHue: 96,
    joinedAt: '2023-02-01',
    status: 'aktiv',
  },
];
