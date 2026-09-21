import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bell, HelpCircle, Megaphone, Pin, Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { Field, Input, SegmentedControl, Switch, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { markAllNotificationsRead, markNotificationRead } from '../../store/actions';
import { formatDate } from '../../lib/format';
import { now } from '../../lib/clock';

export function News() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const posts = [...db.news].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="News" subtitle="Ankündigungen aus deiner Box" />
      {posts.length === 0 ? (
        <EmptyState icon={<Megaphone size={28} />} title="Noch keine Neuigkeiten" />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => {
            const author = db.users.find((u) => u.id === post.authorId);
            return (
              <Card key={post.id}>
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/app/news/${post.id}`} className="no-underline">
                    <h2 className="text-lg text-ink">{post.title}</h2>
                  </Link>
                  {post.pinned && (
                    <Badge tone="brand">
                      <Pin size={11} /> Angepinnt
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{post.teaser}</p>
                <p className="mt-2 text-xs text-muted">
                  {author ? `${author.firstName} ${author.lastName}` : 'Box-Team'} ·{' '}
                  {formatDate(post.publishedAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <Link to={`/app/news/${post.id}`} className="mt-2 inline-block text-sm">
                  Weiterlesen →
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NewsDetail() {
  const { newsId } = useParams();
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const post = db.news.find((n) => n.id === newsId);
  if (!post) return <EmptyState title="Beitrag nicht gefunden" />;
  const author = db.users.find((u) => u.id === post.authorId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        back={{ to: '/app/news', label: 'Zurück zu den News' }}
        title={post.title}
        subtitle={`${author ? `${author.firstName} ${author.lastName}` : 'Box-Team'} · ${formatDate(post.publishedAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })}`}
      />
      <Card>
        <p className="whitespace-pre-line text-sm leading-relaxed">{post.body}</p>
      </Card>
    </div>
  );
}

export function Notifications() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const items = db.notifications.filter((n) => n.userId === userId).sort((a, b) => b.at.localeCompare(a.at));
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Benachrichtigungen"
        subtitle={unread > 0 ? `${unread} ungelesen` : 'Alles gelesen'}
        actions={
          unread > 0 && userId ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                markAllNotificationsRead(userId);
                toast('Alle als gelesen markiert.', 'info');
              }}
            >
              Alle gelesen
            </Button>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={<Bell size={28} />} title="Keine Benachrichtigungen" />
      ) : (
        <Card className="p-0">
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className={cn('flex items-start gap-3 border-b border-line px-4 py-3 last:border-0', !item.read && 'bg-brand/5')}
              >
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-line' : 'bg-brand')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-muted">{item.body}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(item.at, locale, { day: '2-digit', month: '2-digit' })} ·{' '}
                    {new Date(item.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.link && (
                    <Link to={item.link} className="text-xs">
                      Ansehen
                    </Link>
                  )}
                  {!item.read && (
                    <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => markNotificationRead(item.id)}>
                      Gelesen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function Profile() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const user = db.users.find((u) => u.id === userId);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [emergency, setEmergency] = useState(user?.emergencyContact ?? '');

  if (!user) return null;

  const visits = db.bookings.filter((b) => b.userId === user.id && b.status === 'anwesend').length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profil" subtitle={`Mitglied seit ${formatDate(user.joinedAt, locale, { month: 'long', year: 'numeric' })}`} />

      <Card className="mb-4 flex flex-wrap items-center gap-4">
        <Avatar name={`${user.firstName} ${user.lastName}`} hue={user.avatarHue} size={72} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-muted">@{user.nickname} · {visits} Trainings insgesamt</p>
        </div>
        <Button variant="secondary" size="sm" disabled>
          Foto ändern
        </Button>
      </Card>

      <SectionCard title="Angaben" className="mb-4">
        <Field label="Anzeigename" htmlFor="nickname">
          <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </Field>
        <Field label="E-Mail" htmlFor="email" hint="Änderung nur über die Boxleitung möglich">
          <Input id="email" value={user.email} disabled />
        </Field>
        <Field label="Telefon" htmlFor="phone">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0151 …" />
        </Field>
        <Field label="Notfallkontakt" htmlFor="emergency" hint="Wen sollen wir im Notfall anrufen?">
          <Textarea id="emergency" rows={2} value={emergency} onChange={(e) => setEmergency(e.target.value)} />
        </Field>
        <Button
          variant="primary"
          onClick={() => {
            updateEntity('users', user.id, { nickname, phone, emergencyContact: emergency });
            toast('Profil gespeichert.');
          }}
        >
          Speichern
        </Button>
      </SectionCard>

      <SectionCard title="Passwort ändern">
        <Field label="Aktuelles Passwort" htmlFor="pw-old">
          <Input id="pw-old" type="password" placeholder="••••••••" />
        </Field>
        <Field label="Neues Passwort" htmlFor="pw-new">
          <Input id="pw-new" type="password" placeholder="••••••••" />
        </Field>
        <Button variant="secondary" onClick={() => toast('Passwort geändert.', 'info')}>
          Passwort aktualisieren
        </Button>
      </SectionCard>
    </div>
  );
}

export function Settings() {
  const prefs = useDemoStore((s) => s.prefs);
  const setPrefs = useDemoStore((s) => s.setPrefs);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    booking: true,
    waitlist: true,
    cancellation: true,
    news: true,
    invoice: false,
    leaderboard: true,
  });
  const [publicProfile, setPublicProfile] = useState(true);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Einstellungen" subtitle="Darstellung, Benachrichtigungen und Datenschutz" />

      <SectionCard title="Darstellung" className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm">Design</span>
          <SegmentedControl
            value={prefs.theme}
            onChange={(theme) => setPrefs({ theme })}
            options={[
              { value: 'light', label: 'Hell' },
              { value: 'dark', label: 'Dunkel' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Sprache</span>
          <SegmentedControl
            value={prefs.locale}
            onChange={(locale) => setPrefs({ locale })}
            options={[
              { value: 'de', label: 'Deutsch' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </SectionCard>

      <SectionCard title="Benachrichtigungen" className="mb-4">
        <Switch
          checked={notifications.booking}
          onChange={(v) => setNotifications({ ...notifications, booking: v })}
          label="Buchungsbestätigungen"
          hint="Wenn du einen Kurs buchst oder stornierst"
        />
        <Switch
          checked={notifications.waitlist}
          onChange={(v) => setNotifications({ ...notifications, waitlist: v })}
          label="Warteliste"
          hint="Wenn du in einen Kurs nachrückst"
        />
        <Switch
          checked={notifications.cancellation}
          onChange={(v) => setNotifications({ ...notifications, cancellation: v })}
          label="Kursabsagen"
          hint="Wenn ein gebuchter Kurs ausfällt oder der Trainer wechselt"
        />
        <Switch
          checked={notifications.leaderboard}
          onChange={(v) => setNotifications({ ...notifications, leaderboard: v })}
          label="Punkte & Rekorde"
        />
        <Switch checked={notifications.news} onChange={(v) => setNotifications({ ...notifications, news: v })} label="News aus der Box" />
        <Switch
          checked={notifications.invoice}
          onChange={(v) => setNotifications({ ...notifications, invoice: v })}
          label="Rechnungen"
          hint="Erinnerung bei fälligen Beiträgen"
        />
      </SectionCard>

      <SectionCard title="Datenschutz" className="mb-4">
        <Switch
          checked={publicProfile}
          onChange={setPublicProfile}
          label="Im Leaderboard sichtbar"
          hint="Ausgeschaltet erscheinst du nicht in Ranglisten der Box"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast('Datenexport wird im fertigen Produkt per Mail versandt.', 'info')}>
            Daten exportieren
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
            Konto löschen
          </Button>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Konto wirklich löschen?"
        description="Dein Konto, deine Buchungen und Ergebnisse werden dauerhaft entfernt. Eine laufende Mitgliedschaft musst du separat kündigen."
        confirmLabel="Konto löschen"
        tone="danger"
        onConfirm={() => toast('Im Prototyp wird nichts gelöscht.', 'info')}
      />
    </div>
  );
}

export function Help() {
  const db = useDb();
  const [message, setMessage] = useState('');
  const createEntity = useDemoStore((s) => s.createEntity);
  const userId = useDemoStore((s) => s.userId);
  const user = db.users.find((u) => u.id === userId);

  const faq = [
    {
      q: 'Wie weit im Voraus kann ich buchen?',
      a: 'Kurse lassen sich 7 Tage im Voraus buchen. Das Buchungsfenster öffnet automatisch – im Kursplan siehst du, ab wann ein Termin buchbar ist.',
    },
    {
      q: 'Bis wann kann ich kostenfrei stornieren?',
      a: 'Bis 2 Stunden vor Kursbeginn. Danach wird die Einheit angerechnet, damit niemand unnötig einen Platz blockiert.',
    },
    {
      q: 'Wie funktioniert die Warteliste?',
      a: 'Bei vollen Kursen kannst du dich auf die Warteliste setzen. Storniert jemand, rückst du automatisch nach und wirst benachrichtigt.',
    },
    {
      q: 'Ich bin Anfänger – wo fange ich an?',
      a: 'Im Fundamentals-Kurs. In sechs Terminen lernst du die Grundbewegungen, danach kannst du alle regulären Kurse besuchen.',
    },
    {
      q: 'Wie bekomme ich Punkte fürs Leaderboard?',
      a: 'Die Trainer vergeben nach jedem Kurs Punkte. Sie fließen in die Saisonwertung ein, die du unter Leaderboard siehst.',
    },
    {
      q: 'Kann ich meine Mitgliedschaft pausieren?',
      a: 'Ja, bis zu drei Monate pro Jahr kostenfrei. Du findest die Funktion unter Mitgliedschaft.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Hilfe" subtitle="Antworten auf die häufigsten Fragen" />

      <Card className="mb-4 p-0">
        {faq.map((item, index) => (
          <div key={item.q} className="border-b border-line last:border-0">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold">{item.q}</span>
              <span className="text-muted">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && <p className="px-4 pb-3 text-sm text-muted">{item.a}</p>}
          </div>
        ))}
      </Card>

      <SectionCard title="Frage an die Box" description="Wir melden uns per E-Mail zurück.">
        <Field label="Deine Nachricht" htmlFor="support-message">
          <Textarea id="support-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Button
          variant="primary"
          icon={<HelpCircle size={15} />}
          onClick={() => {
            if (!message.trim() || !user) return;
            createEntity('supportTickets', {
              id: `st-${Date.now()}`,
              tenantId: user.tenantId ?? '',
              subject: message.slice(0, 48),
              status: 'offen',
              priority: 'normal',
              createdAt: now().toISOString(),
              messages: [
                {
                  id: `stm-${Date.now()}`,
                  from: 'box',
                  authorName: `${user.firstName} ${user.lastName}`,
                  body: message,
                  at: now().toISOString(),
                },
              ],
            });
            setMessage('');
            toast('Deine Frage ist bei der Boxleitung eingegangen.');
          }}
        >
          Absenden
        </Button>
      </SectionCard>
    </div>
  );
}
