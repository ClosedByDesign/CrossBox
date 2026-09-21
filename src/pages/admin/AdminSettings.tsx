import { useState } from 'react';
import { Button, Card, PageHeader, SectionCard } from '../../components/ui';
import { Field, Input, Select, Switch } from '../../components/ui/form';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { MAIN_TENANT_ID } from '../../data/seed/static';

const tabs: TabDef[] = [
  { key: 'box', label: 'Box' },
  { key: 'oeffnung', label: 'Öffnungszeiten' },
  { key: 'buchung', label: 'Buchungsregeln' },
  { key: 'zahlung', label: 'Zahlung' },
];

const WEEKDAY_LABEL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function AdminSettings() {
  const db = useDb();
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const active = useActiveTab(tabs);
  const tenant = db.tenants.find((t) => t.id === MAIN_TENANT_ID)!;

  const [box, setBox] = useState({
    name: tenant.name,
    street: tenant.street,
    zip: tenant.zip,
    city: tenant.city,
    email: tenant.email,
    phone: tenant.phone,
  });
  const [rules, setRules] = useState({
    bookingWindowDays: tenant.bookingWindowDays,
    cancelDeadlineHours: tenant.cancelDeadlineHours,
    waitlistEnabled: tenant.waitlistEnabled,
    noShowFeeCents: tenant.noShowFeeCents,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Box-Einstellungen" subtitle="Stammdaten, Öffnungszeiten und Regeln für die Kursbuchung" />
      <Tabs tabs={tabs} />

      {active === 'box' && (
        <SectionCard title="Stammdaten">
          <Field label="Name der Box" htmlFor="box-name">
            <Input id="box-name" value={box.name} onChange={(e) => setBox({ ...box, name: e.target.value })} />
          </Field>
          <Field label="Straße" htmlFor="box-street">
            <Input id="box-street" value={box.street} onChange={(e) => setBox({ ...box, street: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="PLZ" htmlFor="box-zip">
              <Input id="box-zip" value={box.zip} onChange={(e) => setBox({ ...box, zip: e.target.value })} />
            </Field>
            <Field label="Ort" htmlFor="box-city">
              <Input id="box-city" value={box.city} onChange={(e) => setBox({ ...box, city: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-Mail" htmlFor="box-mail">
              <Input id="box-mail" type="email" value={box.email} onChange={(e) => setBox({ ...box, email: e.target.value })} />
            </Field>
            <Field label="Telefon" htmlFor="box-phone">
              <Input id="box-phone" value={box.phone} onChange={(e) => setBox({ ...box, phone: e.target.value })} />
            </Field>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              updateEntity('tenants', tenant.id, box);
              toast('Stammdaten gespeichert.');
            }}
          >
            Speichern
          </Button>
        </SectionCard>
      )}

      {active === 'oeffnung' && (
        <SectionCard title="Öffnungszeiten" description="Außerhalb dieser Zeiten sind keine Kurse buchbar">
          <ul className="flex flex-col">
            {WEEKDAY_LABEL.map((label, index) => {
              const hours = tenant.openingHours.find((h) => h.weekday === index + 1);
              return (
                <li key={label} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="text-sm font-medium">{label}</span>
                  {hours ? (
                    <span className="flex items-center gap-2 text-sm tabular-nums">
                      <Input type="time" defaultValue={hours.from} className="w-28" aria-label={`${label} von`} />
                      <span className="text-muted">–</span>
                      <Input type="time" defaultValue={hours.to} className="w-28" aria-label={`${label} bis`} />
                    </span>
                  ) : (
                    <span className="text-sm text-muted">geschlossen</span>
                  )}
                </li>
              );
            })}
          </ul>
          <Button variant="primary" className="mt-3" onClick={() => toast('Öffnungszeiten gespeichert.')}>
            Speichern
          </Button>
        </SectionCard>
      )}

      {active === 'buchung' && (
        <SectionCard title="Buchungsregeln" description="Diese Regeln greifen sofort im gesamten Kursplan">
          <Field
            label="Buchungsfenster (Tage im Voraus)"
            htmlFor="window"
            hint="Ab wie vielen Tagen vor dem Termin Mitglieder buchen können"
          >
            <Input
              id="window"
              type="number"
              min={1}
              max={30}
              value={rules.bookingWindowDays}
              onChange={(e) => setRules({ ...rules, bookingWindowDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="Stornofrist (Stunden vorher)" htmlFor="cancel" hint="Danach wird die Einheit angerechnet">
            <Input
              id="cancel"
              type="number"
              min={0}
              max={48}
              value={rules.cancelDeadlineHours}
              onChange={(e) => setRules({ ...rules, cancelDeadlineHours: Number(e.target.value) })}
            />
          </Field>
          <Field label="No-Show-Gebühr (Cent)" htmlFor="noshow" hint="0 = keine Gebühr">
            <Input
              id="noshow"
              type="number"
              min={0}
              step={50}
              value={rules.noShowFeeCents}
              onChange={(e) => setRules({ ...rules, noShowFeeCents: Number(e.target.value) })}
            />
          </Field>
          <Switch
            checked={rules.waitlistEnabled}
            onChange={(v) => setRules({ ...rules, waitlistEnabled: v })}
            label="Warteliste aktiv"
            hint="Mitglieder können sich bei vollen Kursen eintragen und rücken automatisch nach"
          />
          <Button
            variant="primary"
            className="mt-3"
            onClick={() => {
              updateEntity('tenants', tenant.id, rules);
              toast('Buchungsregeln gespeichert – sie gelten ab sofort im Kursplan.');
            }}
          >
            Speichern
          </Button>
          <Card className="mt-4 bg-elevated text-xs text-muted">
            Beispiel mit den aktuellen Werten: Ein Kurs am Freitag um 18:00 Uhr ist ab{' '}
            {rules.bookingWindowDays} Tagen vorher buchbar und kann bis {rules.cancelDeadlineHours} Stunden vorher, also bis{' '}
            {`${(18 - rules.cancelDeadlineHours + 24) % 24}`.padStart(2, '0')}:00 Uhr, kostenfrei storniert werden.
          </Card>
        </SectionCard>
      )}

      {active === 'zahlung' && (
        <SectionCard title="Zahlung & Abrechnung">
          <Field label="Zahlungsarten" htmlFor="methods">
            <Select id="methods" defaultValue="sepa-karte">
              <option value="sepa">Nur SEPA-Lastschrift</option>
              <option value="sepa-karte">SEPA und Kreditkarte</option>
              <option value="alle">SEPA, Karte und Barzahlung</option>
            </Select>
          </Field>
          <Field label="Abbuchungstag" htmlFor="day" hint="Tag im Monat, an dem Beiträge eingezogen werden">
            <Input id="day" type="number" min={1} max={28} defaultValue={5} />
          </Field>
          <Field label="Gläubiger-ID" htmlFor="creditor">
            <Input id="creditor" defaultValue="DE98ZZZ09999999999" />
          </Field>
          <Switch checked onChange={() => undefined} label="Mahnungen automatisch versenden" hint="Nach 14 Tagen Zahlungsverzug" />
          <Button variant="primary" className="mt-3" onClick={() => toast('Zahlungseinstellungen gespeichert.')}>
            Speichern
          </Button>
        </SectionCard>
      )}
    </div>
  );
}
