import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useDb, useDemoStore } from '../../store';
import { Button, LinkButton } from '../ui';
import { ThemeToggle } from './ThemeToggle';
import { MAIN_TENANT_ID } from '../../data/seed/static';
import { useIsMobileLayout } from '../../lib/device';

const NAV = [
  { to: '/kurse', label: 'Kurse' },
  { to: '/kursplan', label: 'Kursplan' },
  { to: '/preise', label: 'Preise' },
  { to: '/trainer', label: 'Trainer' },
  { to: '/ueber-uns', label: 'Über uns' },
  { to: '/kontakt', label: 'Kontakt' },
];

export function PublicLayout() {
  const db = useDb();
  const [open, setOpen] = useState(false);
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;
  const cookieChoice = useDemoStore((s) => s.cookieChoice);
  const setCookieChoice = useDemoStore((s) => s.setCookieChoice);
  const mobile = useIsMobileLayout();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 no-underline">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand font-display text-sm font-bold text-brand-ink">
              {tenant.initials}
            </span>
            <span className="truncate font-display text-base font-semibold uppercase tracking-wide">{tenant.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors',
                    isActive ? 'text-brand' : 'text-muted hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {!mobile && <ThemeToggle />}
            <LinkButton to="/login" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Anmelden
            </LinkButton>
            <LinkButton to="/probetraining" variant="primary" size="sm">
              Probetraining
            </LinkButton>
            <button
              type="button"
              className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-ink lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Menü öffnen"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setOpen(false)} />
          <nav className="pt-safe absolute inset-y-0 right-0 w-72 max-w-[85vw] overflow-y-auto bg-surface px-4 py-4 animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display uppercase tracking-wide">Menü</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Schließen" className="p-1 text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium no-underline',
                      isActive ? 'bg-brand/15 text-brand' : 'text-ink hover:bg-elevated',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {mobile && (
                <div className="mt-3 flex items-center gap-2 px-1 text-sm text-muted">
                  <ThemeToggle /> Design
                </div>
              )}
              <NavLink to="/login" onClick={() => setOpen(false)} className="mt-3 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-semibold no-underline text-ink">
                Anmelden
              </NavLink>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 mobile:grid-cols-2 mobile:gap-x-4 mobile:gap-y-6 mobile:py-8">
          <div className="mobile:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-display text-xs font-bold text-brand-ink">
                {tenant.initials}
              </span>
              <span className="font-display text-sm uppercase tracking-wide">{tenant.name}</span>
            </div>
            <p className="text-sm text-muted">
              {tenant.street}
              <br />
              {tenant.zip} {tenant.city}
            </p>
            <p className="mt-2 text-sm text-muted">
              {tenant.phone}
              <br />
              {tenant.email}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Training</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              <li><Link to="/kurse">Kursangebot</Link></li>
              <li><Link to="/kursplan">Kursplan</Link></li>
              <li><Link to="/preise">Mitgliedschaften</Link></li>
              <li><Link to="/probetraining">Probetraining</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Box</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              <li><Link to="/ueber-uns">Über uns</Link></li>
              <li><Link to="/trainer">Trainerteam</Link></li>
              <li><Link to="/faq">Häufige Fragen</Link></li>
              <li><Link to="/kontakt">Kontakt & Anfahrt</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Rechtliches</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              <li><Link to="/impressum">Impressum</Link></li>
              <li><Link to="/datenschutz">Datenschutz</Link></li>
              <li><Link to="/agb">AGB</Link></li>
              <li><Link to="/tv">Beamer-Anzeige</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line px-4 py-4 text-center text-xs text-muted mobile:pb-[calc(1rem+env(safe-area-inset-bottom))]">
          Klickbarer Prototyp mit Beispieldaten – keine echten Buchungen, keine echten Zahlungen.
        </div>
      </footer>

      {cookieChoice === null && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-4 shadow-pop mobile:pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-muted">
              Wir verwenden Cookies, die für den Betrieb der Seite nötig sind, sowie optionale Cookies für Statistik. Du kannst frei
              wählen. Mehr dazu in der <Link to="/datenschutz">Datenschutzerklärung</Link>.
            </p>
            <div className="flex gap-2 mobile:[&>button]:flex-1">
              <Button variant="secondary" size="sm" onClick={() => setCookieChoice('notwendig')}>
                Nur notwendige
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCookieChoice('alle')}>
                Alle akzeptieren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
