import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
import type { CartItem, DemoData, Locale, Theme } from '../data/types';
import { BOX_ADMIN_ID, CURRENT_COACH_ID, CURRENT_MEMBER_ID, SUPER_ADMIN_ID, buildBaseData } from '../data/base';
import { now, setClockOffset, today } from '../lib/clock';

export const SEED_VERSION = 1;
export const STORAGE_KEY = 'crossfit-rheinblick-demo';

type CollectionKey = keyof DemoData;
type Entity = { id: string };

interface Overlay {
  created: Partial<Record<CollectionKey, Entity[]>>;
  updated: Partial<Record<CollectionKey, Record<string, Record<string, unknown>>>>;
  deleted: Partial<Record<CollectionKey, string[]>>;
}

const emptyOverlay = (): Overlay => ({ created: {}, updated: {}, deleted: {} });

export interface Prefs {
  theme: Theme | 'system';
  locale: Locale;
  sidebarCollapsed: boolean;
}

interface DemoState {
  overlay: Overlay;
  userId: string | null;
  impersonatorId: string | null;
  prefs: Prefs;
  clockOffsetMin: number;
  cart: CartItem[];
  cookieChoice: 'alle' | 'notwendig' | null;

  setUser: (userId: string | null) => void;
  impersonate: (userId: string) => void;
  stopImpersonation: () => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  setClockOffsetMinutes: (minutes: number) => void;
  setCookieChoice: (choice: 'alle' | 'notwendig') => void;
  resetDemo: () => void;

  createEntity: <K extends CollectionKey>(collection: K, entity: DemoData[K][number]) => void;
  updateEntity: <K extends CollectionKey>(
    collection: K,
    id: string,
    patch: Partial<DemoData[K][number]>,
  ) => void;
  removeEntity: (collection: CollectionKey, id: string) => void;

  addToCart: (articleId: string, qty?: number) => void;
  setCartQty: (articleId: string, qty: number) => void;
  clearCart: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      overlay: emptyOverlay(),
      userId: CURRENT_MEMBER_ID,
      impersonatorId: null,
      prefs: { theme: 'system', locale: 'de', sidebarCollapsed: false },
      clockOffsetMin: 0,
      cart: [],
      cookieChoice: null,

      setUser: (userId) => set({ userId, impersonatorId: null }),
      impersonate: (userId) => set({ impersonatorId: get().userId, userId }),
      stopImpersonation: () => {
        const back = get().impersonatorId;
        if (back) set({ userId: back, impersonatorId: null });
      },
      setPrefs: (patch) => set({ prefs: { ...get().prefs, ...patch } }),
      setClockOffsetMinutes: (minutes) => {
        setClockOffset(minutes);
        set({ clockOffsetMin: minutes });
      },
      setCookieChoice: (choice) => set({ cookieChoice: choice }),
      resetDemo: () => {
        setClockOffset(0);
        set({
          overlay: emptyOverlay(),
          userId: CURRENT_MEMBER_ID,
          impersonatorId: null,
          clockOffsetMin: 0,
          cart: [],
        });
      },

      createEntity: (collection, entity) =>
        set((state) => ({
          overlay: {
            ...state.overlay,
            created: {
              ...state.overlay.created,
              [collection]: [...(state.overlay.created[collection] ?? []), entity as Entity],
            },
          },
        })),

      updateEntity: (collection, id, patch) =>
        set((state) => {
          const createdInOverlay = state.overlay.created[collection] ?? [];
          const existsInCreated = createdInOverlay.some((e) => e.id === id);
          if (existsInCreated) {
            return {
              overlay: {
                ...state.overlay,
                created: {
                  ...state.overlay.created,
                  [collection]: createdInOverlay.map((e) => (e.id === id ? { ...e, ...patch } : e)),
                },
              },
            };
          }
          const previous = state.overlay.updated[collection]?.[id] ?? {};
          return {
            overlay: {
              ...state.overlay,
              updated: {
                ...state.overlay.updated,
                [collection]: {
                  ...(state.overlay.updated[collection] ?? {}),
                  [id]: { ...previous, ...(patch as Record<string, unknown>) },
                },
              },
            },
          };
        }),

      removeEntity: (collection, id) =>
        set((state) => ({
          overlay: {
            ...state.overlay,
            created: {
              ...state.overlay.created,
              [collection]: (state.overlay.created[collection] ?? []).filter((e) => e.id !== id),
            },
            deleted: {
              ...state.overlay.deleted,
              [collection]: [...(state.overlay.deleted[collection] ?? []), id],
            },
          },
        })),

      addToCart: (articleId, qty = 1) =>
        set((state) => {
          const existing = state.cart.find((i) => i.articleId === articleId);
          return {
            cart: existing
              ? state.cart.map((i) => (i.articleId === articleId ? { ...i, qty: i.qty + qty } : i))
              : [...state.cart, { articleId, qty }],
          };
        }),
      setCartQty: (articleId, qty) =>
        set((state) => ({
          cart: qty <= 0 ? state.cart.filter((i) => i.articleId !== articleId) : state.cart.map((i) => (i.articleId === articleId ? { ...i, qty } : i)),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: SEED_VERSION,
      partialize: (state) => ({
        overlay: state.overlay,
        userId: state.userId,
        impersonatorId: state.impersonatorId,
        prefs: state.prefs,
        clockOffsetMin: state.clockOffsetMin,
        cart: state.cart,
        cookieChoice: state.cookieChoice,
      }),
      migrate: () => ({}) as never,
      onRehydrateStorage: () => (state) => {
        if (state) setClockOffset(state.clockOffsetMin);
      },
    },
  ),
);

/** Basis-Daten + Overlay zusammenführen */
function applyOverlay(base: DemoData, overlay: Overlay): DemoData {
  const merged = { ...base } as unknown as Record<string, Entity[]>;
  const keys = new Set<string>([
    ...Object.keys(base),
    ...Object.keys(overlay.created),
    ...Object.keys(overlay.updated),
    ...Object.keys(overlay.deleted),
  ]);

  keys.forEach((key) => {
    const collection = (base as unknown as Record<string, Entity[]>)[key] ?? [];
    const updated = overlay.updated[key as CollectionKey];
    const deleted = new Set(overlay.deleted[key as CollectionKey] ?? []);
    const created = (overlay.created[key as CollectionKey] ?? []) as Entity[];

    if (!updated && deleted.size === 0 && created.length === 0) {
      merged[key] = collection;
      return;
    }

    const next = collection
      .filter((entity) => !deleted.has(entity.id))
      .map((entity) => (updated?.[entity.id] ? { ...entity, ...updated[entity.id] } : entity));

    created.forEach((entity) => {
      if (deleted.has(entity.id)) return;
      const patch = updated?.[entity.id];
      next.push(patch ? { ...entity, ...patch } : entity);
    });

    merged[key] = next;
  });

  return merged as unknown as DemoData;
}

/** Der vollständige, zusammengeführte Datenbestand für die Oberfläche */
export function useDb(): DemoData {
  const overlay = useDemoStore((s) => s.overlay);
  const offset = useDemoStore((s) => s.clockOffsetMin);
  return useMemo(() => applyOverlay(buildBaseData(today()), overlay), [overlay, offset]);
}

/** Datenbestand außerhalb von React (z.B. in Aktionen) */
export function getDb(): DemoData {
  return applyOverlay(buildBaseData(today()), useDemoStore.getState().overlay);
}

export function useCurrentUser() {
  const db = useDb();
  const userId = useDemoStore((s) => s.userId);
  return useMemo(() => db.users.find((u) => u.id === userId) ?? null, [db.users, userId]);
}

export const DEMO_PERSONAS = [
  {
    id: CURRENT_MEMBER_ID,
    label: 'Anna Berger',
    role: 'Mitglied',
    hint: 'Flat-Tarif, zwei Buchungen, ein Wartelistenplatz',
    home: '/app',
  },
  {
    id: 'u-member-5',
    label: 'Lea Hoffmann',
    role: 'Mitglied',
    hint: '8er-Karte – zeigt Kontingent und Grenzen',
    home: '/app',
  },
  { id: CURRENT_COACH_ID, label: 'Jana Roth', role: 'Trainerin', hint: 'Eigene Kurse, offene Punktevergabe', home: '/coach' },
  { id: BOX_ADMIN_ID, label: 'Petra Vogel', role: 'Box-Admin', hint: 'Volle Boxverwaltung', home: '/admin' },
  { id: SUPER_ADMIN_ID, label: 'Sven Krüger', role: 'Super-Admin', hint: 'Plattform mit vier Boxen', home: '/platform' },
] as const;

export { now };
