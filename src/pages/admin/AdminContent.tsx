import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Megaphone, Pin, Plus, Send } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { Field, Input, Select, Textarea } from '../../components/ui/form';
import { Tabs, useActiveTab, type TabDef } from '../../components/ui/Tabs';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { formatDate } from '../../lib/format';
import { now } from '../../lib/clock';
import { MAIN_TENANT_ID } from '../../data/seed/static';

export function AdminNews() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const removeEntity = useDemoStore((s) => s.removeEntity);
  const navigate = useNavigate();

  const posts = [...db.news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <PageHeader
        title="News"
        subtitle={`${posts.length} Beiträge · erscheinen in der App aller Mitglieder`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => navigate('/admin/news/neu')}>
            Beitrag verfassen
          </Button>
        }
      />
      {posts.length === 0 ? (
        <EmptyState icon={<Megaphone size={28} />} title="Noch keine Beiträge" />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => {
            const author = db.users.find((u) => u.id === post.authorId);
            return (
              <Card key={post.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/admin/news/${post.id}`} className="no-underline">
                      <h2 className="text-lg text-ink">{post.title}</h2>
                    </Link>
                    <p className="text-xs text-muted">
                      {author ? `${author.firstName} ${author.lastName}` : 'Box-Team'} ·{' '}
                      {formatDate(post.publishedAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.pinned && (
                      <Badge tone="brand">
                        <Pin size={11} /> Angepinnt
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        updateEntity('news', post.id, { pinned: !post.pinned });
                        toast(post.pinned ? 'Beitrag losgelöst.' : 'Beitrag angepinnt.');
                      }}
                    >
                      {post.pinned ? 'Lösen' : 'Anpinnen'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        removeEntity('news', post.id);
                        toast('Beitrag gelöscht.', 'info');
                      }}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted">{post.teaser}</p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export function AdminNewsEdit() {
  const { newsId } = useParams();
  const db = useDb();
  const navigate = useNavigate();
  const createEntity = useDemoStore((s) => s.createEntity);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const userId = useDemoStore((s) => s.userId);

  const existing = newsId && newsId !== 'neu' ? db.news.find((n) => n.id === newsId) : null;
  const [form, setForm] = useState({
    title: existing?.title ?? '',
    teaser: existing?.teaser ?? '',
    body: existing?.body ?? '',
    pinned: existing?.pinned ?? false,
    audience: 'alle',
    channels: 'app-push',
  });

  const recipients = db.users.filter((u) => u.role === 'member' && u.status === 'aktiv').length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        back={{ to: '/admin/news', label: 'Zurück zu den News' }}
        title={existing ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}
        subtitle={`Erreicht ${recipients} aktive Mitglieder`}
      />
      <Card className="mb-4">
        <Field label="Titel" htmlFor="title">
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="z. B. Community-WOD am Samstag" />
        </Field>
        <Field label="Kurzfassung" htmlFor="teaser" hint="Erscheint in der Übersicht und in der Push-Nachricht">
          <Input id="teaser" value={form.teaser} onChange={(e) => setForm({ ...form, teaser: e.target.value })} />
        </Field>
        <Field label="Text" htmlFor="body">
          <Textarea id="body" rows={7} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Zielgruppe" htmlFor="audience">
            <Select id="audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="alle">Alle Mitglieder</option>
              <option value="aktiv">Nur aktive Verträge</option>
              <option value="trainer">Nur Trainer</option>
            </Select>
          </Field>
          <Field label="Kanäle" htmlFor="channels">
            <Select id="channels" value={form.channels} onChange={(e) => setForm({ ...form, channels: e.target.value })}>
              <option value="app">Nur in der App</option>
              <option value="app-push">App und Push</option>
              <option value="app-push-mail">App, Push und E-Mail</option>
            </Select>
          </Field>
        </div>
        <Field label="Anpinnen">
          <Select id="pinned" value={form.pinned ? 'ja' : 'nein'} onChange={(e) => setForm({ ...form, pinned: e.target.value === 'ja' })}>
            <option value="nein">Normal einsortieren</option>
            <option value="ja">Oben anpinnen</option>
          </Select>
        </Field>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={<Send size={15} />}
          onClick={() => {
            if (!form.title.trim()) {
              toast('Bitte einen Titel angeben.', 'warning');
              return;
            }
            if (existing) {
              updateEntity('news', existing.id, { title: form.title, teaser: form.teaser, body: form.body, pinned: form.pinned });
              toast('Beitrag aktualisiert.');
            } else {
              createEntity('news', {
                id: `news-${Date.now()}`,
                tenantId: MAIN_TENANT_ID,
                title: form.title,
                teaser: form.teaser || form.body.slice(0, 90),
                body: form.body,
                authorId: userId ?? 'u-coach-petra',
                publishedAt: now().toISOString(),
                pinned: form.pinned,
              });
              toast(`Beitrag veröffentlicht – ${recipients} Mitglieder wurden benachrichtigt.`);
            }
            navigate('/admin/news');
          }}
        >
          Veröffentlichen
        </Button>
        <Button variant="secondary" onClick={() => navigate('/admin/news')}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

const requestTabs: TabDef[] = [
  { key: 'offen', label: 'Offen' },
  { key: 'alle', label: 'Alle' },
];

export function AdminRequests() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const updateEntity = useDemoStore((s) => s.updateEntity);
  const active = useActiveTab(requestTabs);
  const [reply, setReply] = useState<Record<string, string>>({});

  const tickets = db.supportTickets
    .filter((t) => t.tenantId === MAIN_TENANT_ID)
    .filter((t) => (active === 'offen' ? t.status !== 'geschlossen' : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tone = { offen: 'warning', 'in-arbeit': 'info', geschlossen: 'neutral' } as const;

  return (
    <>
      <PageHeader title="Anfragen" subtitle="Nachrichten von Mitgliedern und über das Kontaktformular" />
      <Tabs tabs={requestTabs} />

      {tickets.length === 0 ? (
        <EmptyState title="Keine offenen Anfragen" description="Alles beantwortet." />
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <SectionCard
              key={ticket.id}
              title={ticket.subject}
              description={`${formatDate(ticket.createdAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })} · Priorität ${ticket.priority}`}
              action={<Badge tone={tone[ticket.status]}>{ticket.status}</Badge>}
            >
              <ul className="mb-3 flex flex-col gap-2">
                {ticket.messages.map((message) => (
                  <li
                    key={message.id}
                    className={`rounded-lg px-3 py-2 text-sm ${message.from === 'box' ? 'bg-elevated' : 'bg-brand/10'}`}
                  >
                    <p className="text-xs font-semibold text-muted">
                      {message.authorName} · {formatDate(message.at, locale, { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p>{message.body}</p>
                  </li>
                ))}
              </ul>
              {ticket.status !== 'geschlossen' && (
                <>
                  <Field label="Antwort" htmlFor={`reply-${ticket.id}`}>
                    <Textarea
                      id={`reply-${ticket.id}`}
                      rows={2}
                      value={reply[ticket.id] ?? ''}
                      onChange={(e) => setReply({ ...reply, [ticket.id]: e.target.value })}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const text = reply[ticket.id];
                        if (!text?.trim()) return;
                        updateEntity('supportTickets', ticket.id, {
                          status: 'in-arbeit',
                          messages: [
                            ...ticket.messages,
                            {
                              id: `stm-${Date.now()}`,
                              from: 'box',
                              authorName: 'Box-Team',
                              body: text,
                              at: now().toISOString(),
                            },
                          ],
                        });
                        setReply({ ...reply, [ticket.id]: '' });
                        toast('Antwort gesendet.');
                      }}
                    >
                      Antworten
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        updateEntity('supportTickets', ticket.id, { status: 'geschlossen' });
                        toast('Anfrage geschlossen.', 'info');
                      }}
                    >
                      Schließen
                    </Button>
                  </div>
                </>
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </>
  );
}
