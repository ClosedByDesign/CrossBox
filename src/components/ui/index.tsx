import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { initials as makeInitials } from '../../lib/format';

/* ---------------------------------------------------------------- Button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:brightness-110 border-transparent',
  secondary: 'bg-elevated text-ink border-line hover:border-brand',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-elevated hover:text-ink',
  danger: 'bg-transparent text-danger border-danger/60 hover:bg-danger/10',
  success: 'bg-success text-white border-transparent hover:brightness-110',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', block, icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  to: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
  target?: string;
}

export function LinkButton({ to, variant = 'secondary', size = 'md', block, icon, className, children, target }: LinkButtonProps) {
  return (
    <Link
      to={to}
      target={target}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-semibold transition-colors no-underline',
        variantClasses[variant],
        sizeClasses[size],
        block && 'w-full',
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

/* ----------------------------------------------------------------- Badge */

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'live';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-elevated text-muted',
  brand: 'bg-brand/15 text-brand',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  live: 'bg-danger/15 text-danger animate-pulse',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Avatar */

export function Avatar({
  name,
  hue,
  size = 36,
  className,
}: {
  name: string;
  hue: number;
  size?: number;
  className?: string;
}) {
  const [first, last] = name.split(' ');
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(140deg, hsl(${hue} 62% 45%), hsl(${(hue + 40) % 360} 58% 35%))`,
      }}
      aria-hidden
    >
      {makeInitials(first ?? '?', last)}
    </span>
  );
}

/* ------------------------------------------------------------------ Card */

export function Card({ children, className, as: As = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'li' }) {
  return <As className={cn('card p-4', className)}>{children}</As>;
}

export function SectionCard({
  title,
  action,
  children,
  className,
  description,
}: {
  title: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-base">{title}</h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------- StatTile */

export function StatTile({
  label,
  value,
  hint,
  tone = 'brand',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
}) {
  const toneText = {
    brand: 'text-brand',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
  }[tone];
  return (
    <div className="stat-tile card p-4 mobile:p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted mobile:text-[0.65rem] mobile:leading-tight">{label}</span>
        {icon && <span className={cn('opacity-70 mobile:[&>svg]:h-3.5 mobile:[&>svg]:w-3.5', toneText)}>{icon}</span>}
      </div>
      <div
        className={cn(
          'mt-1 font-display text-3xl font-bold leading-tight mobile:truncate',
          // Textwerte wie Tarifnamen sollen in der halben Kachelbreite in eine Zeile passen
          typeof value === 'string' && value.length > 9 ? 'mobile:text-xl' : 'mobile:text-2xl',
          toneText,
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted mobile:text-[0.7rem] mobile:leading-snug">{hint}</div>}
    </div>
  );
}

/* ----------------------------------------------------------- ProgressBar */

export function ProgressBar({ value, max, tone }: { value: number; max: number; tone?: BadgeTone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-success';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="text-muted opacity-60">{icon}</div>}
      <p className="font-display text-lg">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ PageHeader */

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link to={back.to} className="mb-2 inline-block text-sm text-muted no-underline hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ Chip */

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-brand bg-brand/15 text-brand' : 'border-line bg-surface text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
