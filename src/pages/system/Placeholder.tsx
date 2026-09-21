import { Hammer } from 'lucide-react';
import { EmptyState, PageHeader } from '../../components/ui';

/** Platzhalter für Screens, die in einer späteren Ausbaustufe entstehen */
export function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={<Hammer size={28} />}
        title="Dieser Bereich entsteht in der nächsten Ausbaustufe"
        description={description ?? 'Der Screen ist im Prototyp bereits verlinkt, damit die Navigation vollständig ist.'}
      />
    </>
  );
}

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-6xl text-brand">404</p>
      <h1 className="mt-2 text-2xl">Seite nicht gefunden</h1>
      <p className="mt-1 text-sm text-muted">Diese Seite gibt es im Prototyp nicht (mehr).</p>
    </div>
  );
}

export function AccessDenied({ role }: { role?: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-5xl text-warning">Kein Zugriff</p>
      <h1 className="mt-2 text-xl">Diese Rolle darf diesen Bereich nicht öffnen</h1>
      <p className="mt-1 text-sm text-muted">
        {role === 'coach'
          ? 'Trainer sehen ihre Kurse, Teilnehmer und WODs – Verträge, Rechnungen und Box-Einstellungen bleiben der Boxleitung vorbehalten.'
          : 'Wechsle über die Demo-Steuerung die Rolle, um diesen Bereich zu sehen.'}
      </p>
    </div>
  );
}
