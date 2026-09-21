import { Outlet } from 'react-router-dom';
import type { Role } from '../data/types';
import { useCurrentUser } from '../store';
import { AppShell } from '../components/layout/AppShell';
import { AccessDenied } from '../pages/system/Placeholder';

/**
 * Macht das Rollenmodell sichtbar: Wer den Bereich nicht öffnen darf, sieht eine
 * Erklärung statt eines leeren Screens – statt die Route einfach zu verstecken.
 */
export function RoleGate({ allow }: { allow: Role[] }) {
  const user = useCurrentUser();
  if (!user) return null;
  if (allow.includes(user.role)) return <Outlet />;
  return (
    <AppShell>
      <AccessDenied role={user.role} />
    </AppShell>
  );
}
