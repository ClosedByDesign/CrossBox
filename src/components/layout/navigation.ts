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
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const MEMBER_NAV: NavGroup[] = [
  {
    label: 'Training',
    items: [
      { to: '/app', label: 'Start', icon: Home, end: true },
      { to: '/app/kursplan', label: 'Kursplan', icon: CalendarDays },
      { to: '/app/buchungen', label: 'Meine Buchungen', icon: ClipboardList },
      { to: '/app/checkin', label: 'Check-in', icon: QrCode },
      { to: '/app/wods', label: 'WODs', icon: Dumbbell },
      { to: '/app/ergebnisse', label: 'Ergebnisse', icon: Activity },
      { to: '/app/rekorde', label: 'Rekorde', icon: Trophy },
      { to: '/app/leaderboard', label: 'Leaderboard', icon: Flag },
    ],
  },
  {
    label: 'Mitgliedschaft',
    items: [
      { to: '/app/mitgliedschaft', label: 'Vertrag', icon: FileText },
      { to: '/app/rechnungen', label: 'Rechnungen', icon: Receipt },
    ],
  },
  {
    label: 'Shop',
    items: [
      { to: '/app/shop', label: 'Shop', icon: ShoppingBag },
      { to: '/app/bestellungen', label: 'Bestellungen', icon: Package },
    ],
  },
  {
    label: 'Konto',
    items: [
      { to: '/app/news', label: 'News', icon: Megaphone },
      { to: '/app/benachrichtigungen', label: 'Benachrichtigungen', icon: Bell },
      { to: '/app/profil', label: 'Profil', icon: Users },
      { to: '/app/einstellungen', label: 'Einstellungen', icon: Settings },
      { to: '/app/hilfe', label: 'Hilfe', icon: HelpCircle },
    ],
  },
];

export const MEMBER_TABS: NavItem[] = [
  { to: '/app', label: 'Start', icon: Home, end: true },
  { to: '/app/kursplan', label: 'Kursplan', icon: CalendarDays },
  { to: '/app/buchungen', label: 'Buchungen', icon: ClipboardList },
  { to: '/app/leaderboard', label: 'Rangliste', icon: Trophy },
];

export const COACH_NAV: NavGroup[] = [
  {
    label: 'Kurse',
    items: [
      { to: '/coach', label: 'Heute', icon: Home, end: true },
      { to: '/coach/kursplan', label: 'Kursplan', icon: CalendarDays },
    ],
  },
  {
    label: 'Training',
    items: [
      { to: '/coach/wods', label: 'WOD-Bibliothek', icon: Dumbbell },
      { to: '/coach/athleten', label: 'Athleten', icon: Users },
    ],
  },
  {
    label: 'Konto',
    items: [
      { to: '/coach/benachrichtigungen', label: 'Benachrichtigungen', icon: Bell },
      { to: '/coach/einstellungen', label: 'Einstellungen', icon: Settings },
    ],
  },
];

export const COACH_TABS: NavItem[] = [
  { to: '/coach', label: 'Heute', icon: Home, end: true },
  { to: '/coach/kursplan', label: 'Kursplan', icon: CalendarDays },
  { to: '/coach/wods', label: 'WODs', icon: Dumbbell },
  { to: '/coach/athleten', label: 'Athleten', icon: Users },
];

export const ADMIN_NAV: NavGroup[] = [
  { label: 'Übersicht', items: [{ to: '/admin', label: 'Dashboard', icon: Gauge, end: true }] },
  {
    label: 'Kurse',
    items: [
      { to: '/admin/kursplan', label: 'Kursplanung', icon: CalendarDays },
      { to: '/admin/kursarten', label: 'Kursarten', icon: CalendarRange },
      { to: '/admin/ausnahmen', label: 'Feiertage & Absagen', icon: Flag },
    ],
  },
  {
    label: 'Mitglieder',
    items: [
      { to: '/admin/mitglieder', label: 'Mitglieder', icon: Users },
      { to: '/admin/interessenten', label: 'Interessenten', icon: UserPlus },
      { to: '/admin/anwesenheit', label: 'Anwesenheit', icon: UserCheck },
    ],
  },
  {
    label: 'Verträge & Geld',
    items: [
      { to: '/admin/vertraege', label: 'Verträge', icon: FileText },
      { to: '/admin/tarife', label: 'Tarife', icon: Tags },
      { to: '/admin/rechnungen', label: 'Rechnungen', icon: Receipt },
    ],
  },
  {
    label: 'Training',
    items: [
      { to: '/admin/wods', label: 'WOD-Bibliothek', icon: Dumbbell },
      { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  { label: 'Team', items: [{ to: '/admin/trainer', label: 'Trainer', icon: Sparkles }] },
  {
    label: 'Kommunikation',
    items: [
      { to: '/admin/news', label: 'News', icon: Megaphone },
      { to: '/admin/anfragen', label: 'Anfragen', icon: LifeBuoy },
    ],
  },
  {
    label: 'Shop',
    items: [
      { to: '/admin/shop', label: 'Artikel', icon: ShoppingBag },
      { to: '/admin/bestellungen', label: 'Bestellungen', icon: Package },
    ],
  },
  { label: 'Auswertungen', items: [{ to: '/admin/statistiken', label: 'Statistiken', icon: BarChart3 }] },
  { label: 'System', items: [{ to: '/admin/einstellungen', label: 'Einstellungen', icon: Settings }] },
];

export const PLATFORM_NAV: NavGroup[] = [
  { label: 'Übersicht', items: [{ to: '/platform', label: 'Dashboard', icon: Gauge, end: true }] },
  {
    label: 'Kunden',
    items: [
      { to: '/platform/mandanten', label: 'Mandanten', icon: Building2 },
      { to: '/platform/support', label: 'Support', icon: LifeBuoy },
    ],
  },
  {
    label: 'Geschäft',
    items: [
      { to: '/platform/abrechnung', label: 'Abrechnung', icon: CreditCard },
      { to: '/platform/tarife', label: 'Plattform-Tarife', icon: Tags },
      { to: '/platform/statistiken', label: 'Statistiken', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/platform/features', label: 'Features', icon: Flag },
      { to: '/platform/einstellungen', label: 'Einstellungen', icon: Settings },
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
