import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  Flag,
  Gauge,
  HelpCircle,
  Home,
  LifeBuoy,
  Megaphone,
  Package,
  QrCode,
  Receipt,
  Settings,
  ShoppingBag,
  Sparkles,
  Tags,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../../data/types';

export interface NavItem {
  to: string;
  /** Fallback-Text auf Deutsch */
  label: string;
  /** Schlüssel im Wörterbuch, falls übersetzt */
  key?: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  key?: string;
  items: NavItem[];
}

export const MEMBER_NAV: NavGroup[] = [
  {
    label: 'Training', key: 'nav.training',
    items: [
      { to: '/app', label: 'Start', key: 'nav.dashboard', icon: Home, end: true },
      { to: '/app/kursplan', label: 'Kursplan', key: 'nav.schedule', icon: CalendarDays },
      { to: '/app/buchungen', label: 'Meine Buchungen', key: 'nav.bookings', icon: ClipboardList },
      { to: '/app/checkin', label: 'Check-in', key: 'nav.checkin', icon: QrCode },
      { to: '/app/wods', label: 'WODs', key: 'nav.wods', icon: Dumbbell },
      { to: '/app/ergebnisse', label: 'Ergebnisse', key: 'nav.results', icon: Activity },
      { to: '/app/rekorde', label: 'Rekorde', key: 'nav.records', icon: Trophy },
      { to: '/app/leaderboard', label: 'Leaderboard', key: 'nav.leaderboard', icon: Flag },
    ],
  },
  {
    label: 'Mitgliedschaft', key: 'nav.membership',
    items: [
      { to: '/app/mitgliedschaft', label: 'Vertrag', key: 'nav.contract', icon: FileText },
      { to: '/app/rechnungen', label: 'Rechnungen', key: 'nav.invoices', icon: Receipt },
    ],
  },
  {
    label: 'Shop', key: 'nav.shop',
    items: [
      { to: '/app/shop', label: 'Shop', key: 'nav.shop', icon: ShoppingBag },
      { to: '/app/bestellungen', label: 'Bestellungen', key: 'nav.orders', icon: Package },
    ],
  },
  {
    label: 'Konto', key: 'nav.account',
    items: [
      { to: '/app/news', label: 'News', key: 'nav.news', icon: Megaphone },
      { to: '/app/benachrichtigungen', label: 'Benachrichtigungen', key: 'common.notifications', icon: Bell },
      { to: '/app/profil', label: 'Profil', key: 'common.profile', icon: Users },
      { to: '/app/einstellungen', label: 'Einstellungen', key: 'common.settings', icon: Settings },
      { to: '/app/hilfe', label: 'Hilfe', key: 'common.help', icon: HelpCircle },
    ],
  },
];

export const MEMBER_TABS: NavItem[] = [
  { to: '/app', label: 'Start', key: 'nav.dashboard', icon: Home, end: true },
  { to: '/app/kursplan', label: 'Kursplan', key: 'nav.schedule', icon: CalendarDays },
  { to: '/app/buchungen', label: 'Buchungen', key: 'nav.bookings', icon: ClipboardList },
  { to: '/app/leaderboard', label: 'Rangliste', key: 'nav.ranking', icon: Trophy },
];

export const COACH_NAV: NavGroup[] = [
  {
    label: 'Kurse', key: 'nav.courses',
    items: [
      { to: '/coach', label: 'Heute', key: 'nav.today', icon: Home, end: true },
      { to: '/coach/kursplan', label: 'Kursplan', key: 'nav.schedule', icon: CalendarDays },
    ],
  },
  {
    label: 'Training', key: 'nav.training',
    items: [
      { to: '/coach/wods', label: 'WOD-Bibliothek', key: 'nav.wodLibrary', icon: Dumbbell },
      { to: '/coach/athleten', label: 'Athleten', key: 'nav.athletes', icon: Users },
    ],
  },
  {
    label: 'Konto', key: 'nav.account',
    items: [
      { to: '/coach/benachrichtigungen', label: 'Benachrichtigungen', key: 'common.notifications', icon: Bell },
      { to: '/coach/einstellungen', label: 'Einstellungen', key: 'common.settings', icon: Settings },
    ],
  },
];

export const COACH_TABS: NavItem[] = [
  { to: '/coach', label: 'Heute', key: 'nav.today', icon: Home, end: true },
  { to: '/coach/kursplan', label: 'Kursplan', key: 'nav.schedule', icon: CalendarDays },
  { to: '/coach/wods', label: 'WODs', key: 'nav.wods', icon: Dumbbell },
  { to: '/coach/athleten', label: 'Athleten', key: 'nav.athletes', icon: Users },
];

export const ADMIN_NAV: NavGroup[] = [
  { label: 'Übersicht', key: 'nav.overview', items: [{ to: '/admin', label: 'Dashboard', key: 'nav.dashboard', icon: Gauge, end: true }] },
  {
    label: 'Kurse', key: 'nav.courses',
    items: [
      { to: '/admin/kursplan', label: 'Kursplanung', key: 'nav.scheduling', icon: CalendarDays },
      { to: '/admin/kursarten', label: 'Kursarten', key: 'nav.courseTypes', icon: CalendarRange },
      { to: '/admin/ausnahmen', label: 'Feiertage & Absagen', key: 'nav.exceptions', icon: Flag },
    ],
  },
  {
    label: 'Mitglieder', key: 'nav.members',
    items: [
      { to: '/admin/mitglieder', label: 'Mitglieder', key: 'nav.members', icon: Users },
      { to: '/admin/interessenten', label: 'Interessenten', key: 'nav.leads', icon: UserPlus },
      { to: '/admin/anwesenheit', label: 'Anwesenheit', key: 'nav.attendance', icon: UserCheck },
    ],
  },
  {
    label: 'Verträge & Geld', key: 'nav.finance',
    items: [
      { to: '/admin/vertraege', label: 'Verträge', key: 'nav.contracts', icon: FileText },
      { to: '/admin/tarife', label: 'Tarife', key: 'nav.plans', icon: Tags },
      { to: '/admin/rechnungen', label: 'Rechnungen', key: 'nav.invoices', icon: Receipt },
    ],
  },
  {
    label: 'Training', key: 'nav.training',
    items: [
      { to: '/admin/wods', label: 'WOD-Bibliothek', key: 'nav.wodLibrary', icon: Dumbbell },
      { to: '/admin/leaderboard', label: 'Leaderboard', key: 'nav.leaderboard', icon: Trophy },
    ],
  },
  { label: 'Team', key: 'nav.team', items: [{ to: '/admin/trainer', label: 'Trainer', key: 'nav.trainers', icon: Sparkles }] },
  {
    label: 'Kommunikation', key: 'nav.communication',
    items: [
      { to: '/admin/news', label: 'News', key: 'nav.news', icon: Megaphone },
      { to: '/admin/anfragen', label: 'Anfragen', key: 'nav.requests', icon: LifeBuoy },
    ],
  },
  {
    label: 'Shop', key: 'nav.shop',
    items: [
      { to: '/admin/shop', label: 'Artikel', key: 'nav.articles', icon: ShoppingBag },
      { to: '/admin/bestellungen', label: 'Bestellungen', key: 'nav.orders', icon: Package },
    ],
  },
  { label: 'Auswertungen', key: 'nav.reports', items: [{ to: '/admin/statistiken', label: 'Statistiken', key: 'nav.statistics', icon: BarChart3 }] },
  { label: 'System', key: 'nav.system', items: [{ to: '/admin/einstellungen', label: 'Einstellungen', key: 'common.settings', icon: Settings }] },
];

export const PLATFORM_NAV: NavGroup[] = [
  { label: 'Übersicht', key: 'nav.overview', items: [{ to: '/platform', label: 'Dashboard', key: 'nav.dashboard', icon: Gauge, end: true }] },
  {
    label: 'Kunden', key: 'nav.customers',
    items: [
      { to: '/platform/mandanten', label: 'Mandanten', key: 'nav.tenants', icon: Building2 },
      { to: '/platform/support', label: 'Support', key: 'nav.support', icon: LifeBuoy },
    ],
  },
  {
    label: 'Geschäft', key: 'nav.business',
    items: [
      { to: '/platform/abrechnung', label: 'Abrechnung', key: 'nav.billing', icon: CreditCard },
      { to: '/platform/tarife', label: 'Plattform-Tarife', key: 'nav.platformPlans', icon: Tags },
      { to: '/platform/statistiken', label: 'Statistiken', key: 'nav.statistics', icon: BarChart3 },
    ],
  },
  {
    label: 'System', key: 'nav.system',
    items: [
      { to: '/platform/features', label: 'Features', key: 'nav.features', icon: Flag },
      { to: '/platform/einstellungen', label: 'Einstellungen', key: 'common.settings', icon: Settings },
    ],
  },
];

export function navForRole(role: Role): NavGroup[] {
  switch (role) {
    case 'member':
      return MEMBER_NAV;
    case 'coach':
      return COACH_NAV;
    case 'box-admin':
      return ADMIN_NAV;
    case 'super-admin':
      return PLATFORM_NAV;
  }
}

export function homeForRole(role: Role): string {
  switch (role) {
    case 'member':
      return '/app';
    case 'coach':
      return '/coach';
    case 'box-admin':
      return '/admin';
    case 'super-admin':
      return '/platform';
  }
}
