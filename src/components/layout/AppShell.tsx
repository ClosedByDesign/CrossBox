import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, LogOut, Menu, MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useCurrentUser, useDb, useDemoStore } from '../../store';
import { Avatar, Badge } from '../ui';
import { MEMBER_TABS, COACH_TABS, homeForRole, navForRole, type NavItem } from './navigation';
import { ThemeToggle } from './ThemeToggle';

function NavLinkRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
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
      <span className="truncate">{item.label}</span>
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

  if (!user) return null;

  const groups = navForRole(user.role);
  const tenant = db.tenants.find((t) => t.id === user.tenantId);
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const tabs = user.role === 'member' ? MEMBER_TABS : user.role === 'coach' ? COACH_TABS : null;
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

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-ink lg:hidden"
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

        <div className="flex items-center gap-1">
          <ThemeToggle />
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
          <NavLink to="/login" className="rounded-lg p-2 text-muted no-underline hover:bg-elevated hover:text-ink" aria-label="Abmelden">
            <LogOut size={18} />
          </NavLink>
          <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={30} className="ml-1" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Sidebar ab lg */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-line bg-surface px-3 py-4 lg:block">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted/70">{group.label}</p>
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
                <span className="font-display text-sm uppercase tracking-wide">Navigation</span>
                <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Schließen" className="p-1 text-muted">
                  <X size={18} />
                </button>
              </div>
              {groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted/70">{group.label}</p>
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

        <main className={cn('min-w-0 flex-1 px-4 py-5 sm:px-6', tabs && 'pb-24 lg:pb-6')}>
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Bottom-Tabs für Mitglieder und Trainer auf schmalen Screens */}
      {tabs && (
        <>
          <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur lg:hidden">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-semibold no-underline',
                      isActive ? 'text-brand' : 'text-muted',
                    )
                  }
                >
                  <Icon size={19} />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-semibold text-muted"
            >
              <MoreHorizontal size={19} />
              Mehr
            </button>
          </nav>

          {moreOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMoreOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface px-4 pb-6 pt-4 animate-slide-up">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-base uppercase tracking-wide">Alle Bereiche</span>
                  <button type="button" onClick={() => setMoreOpen(false)} aria-label="Schließen" className="p-1 text-muted">
                    <X size={18} />
                  </button>
                </div>
                {groups.map((group) => (
                  <div key={group.label} className="mb-3">
                    <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted/70">{group.label}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {group.items.map((item) => (
                        <NavLinkRow key={item.to} item={item} onNavigate={() => setMoreOpen(false)} />
                      ))}
                    </div>
                  </div>
                ))}
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
