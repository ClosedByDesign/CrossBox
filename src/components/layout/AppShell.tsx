import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, LogOut, Menu, MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useCurrentUser, useDb, useDemoStore } from '../../store';
import { Avatar, Badge } from '../ui';
import { homeForRole, navForRole, tabsForRole, type NavItem } from './navigation';
import { ThemeToggle } from './ThemeToggle';
import { useT } from '../../i18n';
import { useIsMobileLayout } from '../../lib/device';

/** Übersetzt einen Navigationseintrag – ohne Schlüssel oder Wörterbucheintrag bleibt der deutsche Text stehen */
export function useNavLabel() {
  const { t } = useT();
  return (entry: { label: string; key?: string }) => {
    if (!entry.key) return entry.label;
    const value = t(entry.key);
    return value === entry.key ? entry.label : value;
  };
}

function NavLinkRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const navLabel = useNavLabel();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors',
          isActive ? 'bg-brand/15 text-brand' : 'text-muted hover:bg-elevated hover:text-ink',
        )
      }
    >
      <Icon size={17} className="shrink-0" />
      <span className="truncate">{navLabel(item)}</span>
    </NavLink>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const user = useCurrentUser();
  const db = useDb();
  const navigate = useNavigate();
  const impersonatorId = useDemoStore((s) => s.impersonatorId);
  const stopImpersonation = useDemoStore((s) => s.stopImpersonation);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navLabel = useNavLabel();
  const { t } = useT();
  const mobile = useIsMobileLayout();

  if (!user) return null;

  const groups = navForRole(user.role);
  const tenant = db.tenants.find((t) => t.id === user.tenantId);
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const tabs = tabsForRole(user.role, mobile);
  const notificationsPath = user.role === 'member' ? '/app/benachrichtigungen' : `/${user.role === 'coach' ? 'coach' : user.role === 'box-admin' ? 'admin' : 'platform'}/benachrichtigungen`;

  return (
    <div className="min-h-screen bg-canvas">
      {impersonatorId && (
        <div className="flex items-center justify-center gap-3 bg-warning/20 px-4 py-2 text-xs text-warning">
          <span>
            Du bist als <strong>{user.firstName} {user.lastName}</strong> angemeldet (Ansicht aus der Plattformverwaltung).
          </span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              stopImpersonation();
              navigate('/platform/mandanten');
            }}
          >
            Zurück zur Plattform
          </button>
        </div>
      )}

      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className={cn('rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-ink lg:hidden', mobile && 'hidden')}
            onClick={() => setMobileNavOpen(true)}
            aria-label="Navigation öffnen"
          >
            <Menu size={20} />
          </button>
          <NavLink to={homeForRole(user.role)} className="flex min-w-0 items-center gap-2 no-underline">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand font-display text-xs font-bold text-brand-ink">
              {tenant?.initials ?? 'BF'}
            </span>
            <span className="truncate font-display text-base font-semibold uppercase tracking-wide">
              {tenant?.name ?? 'BoxFlow Plattform'}
            </span>
          </NavLink>
          {user.role !== 'member' && (
            <Badge tone="brand" className="hidden sm:inline-flex">
              {user.role === 'coach' ? 'Trainer' : user.role === 'box-admin' ? 'Box-Admin' : 'Plattform'}
            </Badge>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Im Mobil-Layout liegen Theme und Abmelden im „Mehr“-Sheet, damit der Boxname Platz hat */}
          {!mobile && <ThemeToggle />}
          <NavLink
            to={notificationsPath}
            className="relative rounded-lg p-2 text-muted no-underline hover:bg-elevated hover:text-ink"
            aria-label="Benachrichtigungen"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.6rem] font-bold text-brand-ink">
                {unread}
              </span>
            )}
          </NavLink>
          {!mobile && (
            <NavLink to="/login" className="rounded-lg p-2 text-muted no-underline hover:bg-elevated hover:text-ink" aria-label={t('common.logout')}>
              <LogOut size={18} />
            </NavLink>
          )}
          <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={30} className="ml-1" />
        </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Sidebar ab lg */}
        <aside className={cn('sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-line bg-surface px-3 py-4', !mobile && 'lg:block')}>
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted/70">{navLabel(group)}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLinkRow key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Mobile-Navigation als Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMobileNavOpen(false)} />
            <nav className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-line bg-surface px-3 py-4 animate-slide-up">
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="font-display text-sm uppercase tracking-wide">{t('nav.title')}</span>
                <button type="button" onClick={() => setMobileNavOpen(false)} aria-label={t('common.close')} className="p-1 text-muted">
                  <X size={18} />
                </button>
              </div>
              {groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted/70">{navLabel(group)}</p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavLinkRow key={item.to} item={item} onNavigate={() => setMobileNavOpen(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        )}

        <main
          className={cn(
            'min-w-0 flex-1 px-4 py-5 sm:px-6',
            tabs && !mobile && 'pb-24 lg:pb-6',
            mobile && 'pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4',
          )}
        >
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Bottom-Tabs für Mitglieder und Trainer auf schmalen Screens */}
      {tabs && (
        <>
          <nav className={cn('pb-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur', !mobile && 'lg:hidden')}>
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-semibold no-underline',
                      mobile && 'py-2.5',
                      isActive ? 'text-brand' : 'text-muted',
                    )
                  }
                >
                  <Icon size={19} />
                  <span className="max-w-full truncate px-0.5">{navLabel(item)}</span>
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn('flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-semibold text-muted', mobile && 'py-2.5')}
            >
              <MoreHorizontal size={19} />
              {t('common.more')}
            </button>
          </nav>

          {moreOpen && (
            <div className={cn('fixed inset-0 z-40', !mobile && 'lg:hidden')}>
              <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMoreOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 animate-slide-up">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-base uppercase tracking-wide">{t('nav.allAreas')}</span>
                  <button type="button" onClick={() => setMoreOpen(false)} aria-label={t('common.close')} className="p-1 text-muted">
                    <X size={18} />
                  </button>
                </div>
                {groups.map((group) => (
                  <div key={group.label} className="mb-3">
                    <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted/70">{navLabel(group)}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {group.items.map((item) => (
                        <NavLinkRow key={item.to} item={item} onNavigate={() => setMoreOpen(false)} />
                      ))}
                    </div>
                  </div>
                ))}
                {mobile && (
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <ThemeToggle />
                      {t('nav.theme')}
                    </div>
                    <NavLink
                      to="/login"
                      onClick={() => setMoreOpen(false)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted no-underline hover:bg-elevated hover:text-ink"
                    >
                      <LogOut size={17} /> {t('common.logout')}
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} className="mb-3 inline-flex items-center gap-1 text-sm text-muted no-underline hover:text-ink">
      <ChevronLeft size={15} /> {label}
    </NavLink>
  );
}
