import { useMemo } from 'react';
import { Badge, Card, PageHeader, SectionCard, StatTile } from '../../components/ui';
import { ColumnChart, Heatmap, TrendChart } from '../../components/charts/Charts';
import { useDb, useDemoStore } from '../../store';
import { addDays, atTime, isoWeekday, now, toDateKey } from '../../lib/clock';
import { formatCurrency, percent } from '../../lib/format';
import { MAIN_TENANT_ID } from '../../data/seed/static';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function AdminStats() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const current = now();

  const data = useMemo(() => {
    const templates = new Map(db.courseTemplates.map((t) => [t.id, t]));
    const bookingsBySession = new Map<string, number>();
    db.bookings.forEach((b) => {
      if (b.status === 'gebucht' || b.status === 'anwesend') {
        bookingsBySession.set(b.sessionId, (bookingsBySession.get(b.sessionId) ?? 0) + 1);
      }
    });

    // Auslastung nach Wochentag und Uhrzeit (letzte 8 Wochen)
    const from = toDateKey(addDays(current, -56));
    const relevant = db.sessions.filter((s) => s.date >= from && s.date <= toDateKey(current) && s.status !== 'abgesagt');

    const hours = Array.from(new Set(relevant.map((s) => s.startTime))).sort();
    const grid: number[][] = WEEKDAYS.map(() => hours.map(() => 0));
    const counts: number[][] = WEEKDAYS.map(() => hours.map(() => 0));

    relevant.forEach((session) => {
      const dayIndex = isoWeekday(new Date(session.date)) - 1;
      const hourIndex = hours.indexOf(session.startTime);
      if (dayIndex < 0 || hourIndex < 0) return;
      const booked = bookingsBySession.get(session.id) ?? 0;
      grid[dayIndex][hourIndex] += percent(booked, session.capacity);
      counts[dayIndex][hourIndex] += 1;
    });

    const utilisation = grid.map((row, y) => row.map((value, x) => (counts[y][x] ? Math.round(value / counts[y][x]) : 0)));

    // Besuche pro Woche
    const weeks: Array<{ woche: string; besuche: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const start = addDays(current, -i * 7 - 6);
      const end = addDays(current, -i * 7);
      const visits = db.bookings.filter((b) => {
        if (b.status !== 'anwesend') return false;
        const session = db.sessions.find((s) => s.id === b.sessionId);
        if (!session) return false;
        const date = atTime(session.date, session.startTime);
        return date >= start && date <= end;
      }).length;
      weeks.push({ woche: `KW${i === 0 ? '' : ''}${toDateKey(end).slice(5).replace('-', '.')}`, besuche: visits });
    }

    // Mitgliederentwicklung
    const members = db.users.filter((u) => u.role === 'member' && u.tenantId === MAIN_TENANT_ID);
    const growth: Array<{ monat: string; mitglieder: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const reference = new Date(current.getFullYear(), current.getMonth() - i + 1, 0);
      growth.push({
        monat: reference.toLocaleDateString('de-DE', { month: 'short' }),
        mitglieder: members.filter((m) => new Date(m.joinedAt) <= reference).length,
      });
    }

    // Umsatz je Monat
    const revenue: Array<{ monat: string; umsatz: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const month = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const sum = db.invoices
        .filter((invoice) => {
          const date = new Date(invoice.issuedAt);
          return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
        })
        .reduce((total, invoice) => total + invoice.amountCents, 0);
      revenue.push({ monat: month.toLocaleDateString('de-DE', { month: 'short' }), umsatz: Math.round(sum / 100) });
    }

    // Beliebteste Kursarten
    const byKind = new Map<string, number>();
    relevant.forEach((session) => {
      const template = templates.get(session.templateId);
      if (!template) return;
      byKind.set(template.kind, (byKind.get(template.kind) ?? 0) + (bookingsBySession.get(session.id) ?? 0));
    });
    const kinds = [...byKind.entries()]
      .map(([kind, besuche]) => ({ kind, besuche }))
      .sort((a, b) => b.besuche - a.besuche);

    const totalCapacity = relevant.reduce((sum, s) => sum + s.capacity, 0);
    const totalBooked = relevant.reduce((sum, s) => sum + (bookingsBySession.get(s.id) ?? 0), 0);
    const noShows = db.bookings.filter((b) => b.status === 'no-show').length;
    const attended = db.bookings.filter((b) => b.status === 'anwesend').length;

    return {
      hours,
      utilisation,
      weeks,
      growth,
      revenue,
      kinds,
      avgUtilisation: percent(totalBooked, totalCapacity),
      noShowRate: percent(noShows, attended + noShows),
      totalVisits: attended,
      memberCount: members.filter((m) => m.status === 'aktiv').length,
    };
  }, [db, current]);

  return (
    <>
      <PageHeader title="Statistiken" subtitle="Auslastung, Besuche, Mitglieder und Umsatz der letzten Wochen" />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Ø Auslastung" value={`${data.avgUtilisation} %`} hint="letzte 8 Wochen" tone={data.avgUtilisation > 75 ? 'success' : 'info'} />
        <StatTile label="Besuche gesamt" value={data.totalVisits} hint="erfasste Check-ins" />
        <StatTile label="No-Show-Quote" value={`${data.noShowRate} %`} tone={data.noShowRate > 8 ? 'warning' : 'success'} />
        <StatTile label="Aktive Mitglieder" value={data.memberCount} tone="brand" />
      </div>

      <SectionCard
        title="Auslastung nach Wochentag und Uhrzeit"
        description="Durchschnittliche Belegung in Prozent – zeigt, wo Kapazität fehlt oder frei ist"
        className="mb-4"
      >
        <Heatmap rows={WEEKDAYS} columns={data.hours} values={data.utilisation} formatValue={(value) => `${value}`} />
        <p className="mt-2 text-xs text-muted">Leere Felder bedeuten: zu dieser Zeit findet an diesem Tag kein Kurs statt.</p>
      </SectionCard>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Besuche pro Woche">
          <ColumnChart data={data.weeks} xKey="woche" yKey="besuche" highlightIndex={data.weeks.length - 1} />
        </SectionCard>
        <SectionCard title="Mitgliederentwicklung">
          <TrendChart data={data.growth} xKey="monat" yKey="mitglieder" />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Umsatz je Monat" description="in Euro, inklusive offener Beiträge">
          <ColumnChart data={data.revenue} xKey="monat" yKey="umsatz" unit="€" />
          <p className="mt-2 text-xs text-muted">
            Laufender Monat: {formatCurrency((data.revenue[data.revenue.length - 1]?.umsatz ?? 0) * 100, locale)}
          </p>
        </SectionCard>

        <SectionCard title="Beliebteste Kursarten" description="Buchungen der letzten 8 Wochen">
          <ul className="flex flex-col gap-2">
            {data.kinds.map((entry) => {
              const max = data.kinds[0]?.besuche || 1;
              return (
                <li key={entry.kind}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{entry.kind}</span>
                    <span className="tabular-nums text-muted">{entry.besuche}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(entry.besuche / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <Card className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="info">Hinweis</Badge>
        Alle Auswertungen basieren auf den erzeugten Demo-Daten und rechnen live mit – Buchungen, die du im Prototyp vornimmst, fließen
        sofort ein.
      </Card>
    </>
  );
}
