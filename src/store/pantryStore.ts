import { create } from 'zustand';
import { addPantryItem, deletePantryItem, getPantry, getPantrySummary, registerSessionClearListener, updatePantryItem } from '../services/api';
import { clearUserCache, readCache, writeCache } from './cacheStorage';

type State = {
  userId: string | null;
  items: any[];
  summary: { por_vencer: number; vencidos: number };
  status: 'idle' | 'loading' | 'refreshing' | 'error';
  error: string;
  lastUpdated: number | null;
  hydrate: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  createItem: (data: any) => Promise<void>;
  updateItem: (id: string, data: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clear: (userId?: string | null) => Promise<void>;
};

export const usePantryStore = create<State>((set, get) => ({
  userId: null,
  items: [],
  summary: { por_vencer: 0, vencidos: 0 },
  status: 'idle',
  error: '',
  lastUpdated: null,
  hydrate: async (userId) => {
    set({ userId, status: 'loading', error: '' });
    const [items, summary] = await Promise.all([
      readCache<any[]>(userId, 'despensa'),
      readCache<{ por_vencer: number; vencidos: number }>(userId, 'despensa-resumen'),
    ]);
    set({
      items: items || [],
      summary: summary || { por_vencer: 0, vencidos: 0 },
      status: items || summary ? 'refreshing' : 'loading',
      lastUpdated: items || summary ? Date.now() : null,
    });
  },
  refresh: async () => {
    const { userId, items } = get();
    if (!userId) return;
    set({ status: items.length ? 'refreshing' : 'loading', error: '' });
    try {
      const [nextItems, nextSummary] = await Promise.all([getPantry(), getPantrySummary()]);
      await Promise.all([
        writeCache(userId, 'despensa', nextItems),
        writeCache(userId, 'despensa-resumen', nextSummary),
      ]);
      set({
        items: nextItems,
        summary: (nextSummary && typeof nextSummary === 'object'
          ? nextSummary as { por_vencer: number; vencidos: number }
          : { por_vencer: 0, vencidos: 0 }),
        status: 'idle',
        error: '',
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      set({ status: 'error', error: error?.message || 'No se pudo actualizar la despensa.' });
    }
  },
  createItem: async (data) => {
    const previous = get().items;
    set({ items: [...previous, { ...data, id: `optimistic-${Date.now()}` }] });
    try {
      const created = await addPantryItem(data);
      const next = [...previous, created];
      set({ items: next });
      if (get().userId) await writeCache(get().userId!, 'despensa', next);
      await get().refresh();
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
  updateItem: async (id, data) => {
    const previous = get().items;
    set({ items: previous.map((item) => item.id === id || item.backendId === id ? { ...item, ...data } : item) });
    try {
      await updatePantryItem(id, data);
      await get().refresh();
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
  deleteItem: async (id) => {
    const previous = get().items;
    set({ items: previous.filter((item) => item.id !== id && item.backendId !== id) });
    try {
      await deletePantryItem(id);
      await get().refresh();
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
  clear: async (userId) => {
    const target = userId || get().userId;
    set({ userId: null, items: [], summary: { por_vencer: 0, vencidos: 0 }, status: 'idle', error: '', lastUpdated: null });
    if (typeof target === 'string') await clearUserCache(target);
  },
}));

registerSessionClearListener((userId) => {
  void usePantryStore.getState().clear(userId);
});
