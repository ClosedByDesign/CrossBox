import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Package, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, SectionCard } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { useDb, useDemoStore } from '../../store';
import { placeOrder } from '../../store/actions';
import { formatCurrency, formatDate } from '../../lib/format';
import { MAIN_TENANT_ID } from '../../data/seed/static';

function useCart() {
  const db = useDb();
  const cart = useDemoStore((s) => s.cart);
  return useMemo(() => {
    const items = cart
      .map((item) => ({ item, article: db.shopArticles.find((a) => a.id === item.articleId) }))
      .filter((entry): entry is { item: (typeof cart)[number]; article: NonNullable<typeof entry.article> } => !!entry.article);
    const total = items.reduce((sum, entry) => sum + entry.article.priceCents * entry.item.qty, 0);
    const count = items.reduce((sum, entry) => sum + entry.item.qty, 0);
    return { items, total, count };
  }, [cart, db.shopArticles]);
}

export default function Shop() {
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const addToCart = useDemoStore((s) => s.addToCart);
  const { count } = useCart();
  const [category, setCategory] = useState<string>('alle');

  const categories = ['alle', ...Array.from(new Set(db.shopArticles.map((a) => a.category)))];
  const articles = db.shopArticles.filter((a) => a.active && (category === 'alle' || a.category === category));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Shop"
        subtitle="Bestellen und in der Box abholen"
        actions={
          <LinkButton to="/app/warenkorb" variant={count > 0 ? 'primary' : 'secondary'} size="sm" icon={<ShoppingCart size={15} />}>
            Warenkorb{count > 0 ? ` (${count})` : ''}
          </LinkButton>
        }
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold',
              category === cat ? 'border-brand bg-brand/15 text-brand' : 'border-line text-muted hover:text-ink',
            )}
          >
            {cat === 'alle' ? 'Alle' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="flex flex-col">
            <Link to={`/app/shop/${article.id}`} className="no-underline">
              <div className="mb-1 text-center text-4xl">{article.emoji}</div>
              <p className="text-sm font-semibold leading-tight text-ink">{article.name}</p>
            </Link>
            <p className="mt-1 font-display text-lg text-brand">{formatCurrency(article.priceCents, locale)}</p>
            {article.stock <= 8 && <p className="text-[0.7rem] text-warning">nur noch {article.stock} auf Lager</p>}
            <Button
              variant="primary"
              size="sm"
              block
              className="mt-auto"
              onClick={() => {
                addToCart(article.id);
                toast(`${article.name} in den Warenkorb gelegt.`);
              }}
            >
              In den Warenkorb
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ArticleDetail() {
  const { articleId } = useParams();
  const db = useDb();
  const locale = useDemoStore((s) => s.prefs.locale);
  const addToCart = useDemoStore((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const article = db.shopArticles.find((a) => a.id === articleId);

  if (!article) return <EmptyState title="Artikel nicht gefunden" />;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader back={{ to: '/app/shop', label: 'Zurück zum Shop' }} title={article.name} subtitle={article.category} />
      <Card>
        <div className="mb-3 text-center text-7xl">{article.emoji}</div>
        <p className="text-sm text-muted">{article.description}</p>
        <p className="mt-3 font-display text-3xl text-brand">{formatCurrency(article.priceCents, locale)}</p>
        <p className="text-xs text-muted">{article.stock > 0 ? `${article.stock} auf Lager` : 'aktuell nicht verfügbar'}</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-line px-2 py-1">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Weniger" className="p-1 text-muted">
              <Minus size={15} />
            </button>
            <span className="w-6 text-center tabular-nums">{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Mehr" className="p-1 text-muted">
              <Plus size={15} />
            </button>
          </div>
          <Button
            variant="primary"
            block
            onClick={() => {
              addToCart(article.id, qty);
              toast(`${qty}× ${article.name} in den Warenkorb gelegt.`);
            }}
          >
            In den Warenkorb
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function Cart() {
  const { items, total } = useCart();
  const locale = useDemoStore((s) => s.prefs.locale);
  const setCartQty = useDemoStore((s) => s.setCartQty);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader back={{ to: '/app/shop', label: 'Weiter einkaufen' }} title="Warenkorb" />
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title="Dein Warenkorb ist leer"
          action={<LinkButton to="/app/shop" variant="primary" size="sm">Zum Shop</LinkButton>}
        />
      ) : (
        <>
          <Card className="mb-4">
            {items.map(({ item, article }) => (
              <div key={article.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <span className="text-2xl">{article.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{article.name}</p>
                  <p className="text-xs text-muted">{formatCurrency(article.priceCents, locale)} pro Stück</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-line px-1.5 py-1">
                  <button type="button" onClick={() => setCartQty(article.id, item.qty - 1)} aria-label="Weniger" className="p-0.5 text-muted">
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm tabular-nums">{item.qty}</span>
                  <button type="button" onClick={() => setCartQty(article.id, item.qty + 1)} aria-label="Mehr" className="p-0.5 text-muted">
                    <Plus size={14} />
                  </button>
                </div>
                <span className="w-20 text-right font-semibold tabular-nums">{formatCurrency(article.priceCents * item.qty, locale)}</span>
                <button type="button" onClick={() => setCartQty(article.id, 0)} aria-label="Entfernen" className="text-muted hover:text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 font-display text-xl">
              <span>Gesamt</span>
              <span className="tabular-nums">{formatCurrency(total, locale)}</span>
            </div>
          </Card>
          <LinkButton to="/app/kasse" variant="primary" block size="lg">
            Zur Kasse
          </LinkButton>
        </>
      )}
    </div>
  );
}

export function Checkout() {
  const { items, total } = useCart();
  const locale = useDemoStore((s) => s.prefs.locale);
  const userId = useDemoStore((s) => s.userId);
  const navigate = useNavigate();
  const [payment, setPayment] = useState<'abholung' | 'beitrag'>('abholung');

  if (items.length === 0) {
    return <EmptyState title="Dein Warenkorb ist leer" action={<LinkButton to="/app/shop" variant="primary" size="sm">Zum Shop</LinkButton>} />;
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader back={{ to: '/app/warenkorb', label: 'Zurück zum Warenkorb' }} title="Kasse" />

      <SectionCard title="Deine Bestellung" className="mb-4">
        <ul className="flex flex-col gap-1.5">
          {items.map(({ item, article }) => (
            <li key={article.id} className="flex items-center justify-between text-sm">
              <span>
                {item.qty}× {article.name}
              </span>
              <span className="tabular-nums">{formatCurrency(article.priceCents * item.qty, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 font-display text-lg">
          <span>Gesamt</span>
          <span className="tabular-nums">{formatCurrency(total, locale)}</span>
        </div>
      </SectionCard>

      <SectionCard title="Zahlung" className="mb-4">
        {(
          [
            { key: 'abholung', label: 'Bei Abholung in der Box zahlen', hint: 'Bar oder Karte an der Theke' },
            { key: 'beitrag', label: 'Mit dem nächsten Monatsbeitrag abbuchen', hint: 'Erscheint auf deiner nächsten Rechnung' },
          ] as const
        ).map((option) => (
          <label
            key={option.key}
            className={cn(
              'mb-2 flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 last:mb-0',
              payment === option.key ? 'border-brand bg-brand/10' : 'border-line',
            )}
          >
            <input
              type="radio"
              name="payment"
              checked={payment === option.key}
              onChange={() => setPayment(option.key)}
              className="mt-1 accent-[rgb(var(--c-brand))]"
            />
            <span>
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="block text-xs text-muted">{option.hint}</span>
            </span>
          </label>
        ))}
      </SectionCard>

      <Button
        variant="primary"
        block
        size="lg"
        onClick={() => {
          if (!userId) return;
          const order = placeOrder(userId, MAIN_TENANT_ID);
          if (order) {
            toast(`Bestellung ${order.number} aufgenommen.`);
            navigate('/app/bestellungen');
          }
        }}
      >
        Kostenpflichtig bestellen
      </Button>
      <p className="mt-2 text-center text-xs text-muted">Prototyp – es wird nichts wirklich bestellt oder abgebucht.</p>
    </div>
  );
}

export function Orders() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  const locale = useDemoStore((s) => s.prefs.locale);

  const orders = db.orders.filter((o) => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const statusTone = { neu: 'warning', abholbereit: 'success', abgeholt: 'neutral', storniert: 'danger' } as const;
  const statusLabel = { neu: 'In Bearbeitung', abholbereit: 'Abholbereit', abgeholt: 'Abgeholt', storniert: 'Storniert' };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Meine Bestellungen" subtitle="Abholung an der Theke in der Box" />
      {orders.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title="Noch keine Bestellungen" action={<LinkButton to="/app/shop" variant="primary" size="sm">Zum Shop</LinkButton>} />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.number}</p>
                  <p className="text-xs text-muted">{formatDate(order.createdAt, locale, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
              </div>
              <ul className="mt-3 flex flex-col gap-1">
                {order.items.map((item) => {
                  const article = db.shopArticles.find((a) => a.id === item.articleId);
                  return (
                    <li key={item.articleId} className="flex items-center justify-between text-sm">
                      <span>
                        {item.qty}× {article?.name ?? 'Artikel'}
                      </span>
                      <span className="tabular-nums text-muted">{formatCurrency(item.priceCents * item.qty, locale)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-2 font-semibold">
                <span>Gesamt</span>
                <span className="tabular-nums">{formatCurrency(order.totalCents, locale)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
