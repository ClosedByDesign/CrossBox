import type { CourseTemplate, ScheduleException, Session, Wod } from '../types';
import { addDays, atTime, isoWeekday, toDateKey } from '../../lib/clock';

/**
 * Erzeugt aus den wiederkehrenden Kursvorlagen alle konkreten Termine im Zeitfenster
 * und wendet anschließend die Ausnahmen an (Feiertag, Absage, Vertretung).
 *
 * Die Termin-ID ist bewusst deterministisch (`s-<vorlage>-<datum>`): Buchungen,
 * Ergebnisse und Punkte referenzieren sie und überleben dadurch jede Neuberechnung
 * und jedes Verschieben des Zeitfensters.
 */
export function generateSessions(
  templates: CourseTemplate[],
  exceptions: ScheduleException[],
  wods: Wod[],
  window: { from: Date; to: Date },
  reference: Date,
): Session[] {
  const sessions: Session[] = [];
  const wodPool = wods.filter((w) => w.isTemplate);

  for (let day = new Date(window.from); day <= window.to; day = addDays(day, 1)) {
    const dateKey = toDateKey(day);
    const weekday = isoWeekday(day);

    for (const template of templates) {
      if (!template.active || !template.weekdays.includes(weekday as never)) continue;

      const start = atTime(dateKey, template.startTime);
      const end = new Date(start.getTime() + template.durationMin * 60_000);

      let status: Session['status'];
      if (end <= reference) status = 'vorbei';
      else if (start <= reference) status = 'laeuft';
      else status = 'geplant';

      sessions.push({
        id: `s-${template.id}-${dateKey}`,
        tenantId: template.tenantId,
        templateId: template.id,
        date: dateKey,
        startTime: template.startTime,
        durationMin: template.durationMin,
        capacity: template.capacity,
        coachId: template.coachId,
        status,
        wodId: pickWod(template, dateKey, wodPool, start, reference),
        pointsGiven: false,
      });
    }
  }

  applyExceptions(sessions, exceptions);
  sessions.sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));
  return sessions;
}

/**
 * Wie in einer echten Box: Alle Kurse eines Tages teilen sich dasselbe WOD.
 * Veröffentlicht wird es erst kurz vorher – davor sehen Mitglieder den leeren Zustand.
 */
function pickWod(
  template: CourseTemplate,
  dateKey: string,
  pool: Wod[],
  start: Date,
  reference: Date,
): string | null {
  const needsWod =
    template.kind === 'WOD' || template.kind === 'Partner-WOD' || template.kind === 'Weightlifting' || template.kind === 'Gymnastics';
  if (!needsWod || pool.length === 0) return null;

  // Erst ab zwei Tagen vor dem Termin veröffentlicht
  const publishFrom = new Date(start.getTime() - 2 * 86_400_000);
  if (publishFrom > reference) return null;

  const dayNumber = Math.floor(new Date(dateKey).getTime() / 86_400_000);
  const offset = template.kind === 'Weightlifting' ? 2 : template.kind === 'Gymnastics' ? 4 : 0;
  return pool[(dayNumber + offset) % pool.length].id;
}

function applyExceptions(sessions: Session[], exceptions: ScheduleException[]): void {
  for (const ex of exceptions) {
    for (const session of sessions) {
      if (session.date !== ex.date) continue;
      if (ex.templateId && ex.templateId !== session.templateId) continue;

      if (ex.kind === 'feiertag' || ex.kind === 'absage') {
        session.status = 'abgesagt';
        session.cancelReason = ex.reason;
      } else if (ex.kind === 'vertretung' && ex.substituteCoachId) {
        session.coachId = ex.substituteCoachId;
        session.substitute = true;
      }
    }
  }
}
