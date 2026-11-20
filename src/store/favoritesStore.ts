import { create } from 'zustand';
import { deleteFavorite, listFavorites, registerSessionClearListener, saveFavorite } from '../services/api';
import { clearUserCache, readCache, writeCache } from './cacheStorage';

type State = {
  userId: string | null;
  items: any[];
  status: 'idle' | 'loading' | 'refreshing' | 'error';
  error: string;
  lastUpdated: number | null;
  hydrate: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  add: (recipe: Record<string, unknown>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: (userId?: string | null) => Promise<void>;
};

export const useFavoritesStore = create<State>((set, get) => ({
  userId: null,
  items: [],
  status: 'idle',
  error: '',
  lastUpdated: null,
  hydrate: async (userId) => {
    set({ userId, status: 'loading', error: '' });
    const data = await readCache<any[]>(userId, 'favoritas');
    set({ items: data || [], status: data ? 'refreshing' : 'loading', lastUpdated: data ? Date.now() : null });
  },
  refresh: async () => {
    const { userId, items } = get();
    if (!userId) return;
    set({ status: items.length ? 'refreshing' : 'loading', error: '' });
    try {
      const data = await listFavorites({ refresh: true });
      await writeCache(userId, 'favoritas', data);
      set({ items: data, status: 'idle', error: '', lastUpdated: Date.now() });
    } catch (error: any) {
      set({ status: 'error', error: error?.message || 'No se pudieron actualizar las favoritas.' });
    }
  },
  add: async (recipe) => {
    const previous = get().items;
    const optimistic = [...previous, { id: `optimistic-${Date.now()}`, nombre: recipe.nombre, receta: recipe }];
    set({ items: optimistic });
    try {
      const saved = await saveFavorite(recipe);
      const next = [...previous.filter((item) => item.nombre !== saved.nombre), saved];
      set({ items: next });
      if (get().userId) await writeCache(get().userId!, 'favoritas', next);
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
  remove: async (id) => {
    const previous = get().items;
    set({ items: previous.filter((item) => item.id !== id) });
    try {
      await deleteFavorite(id);
      if (get().userId) await writeCache(get().userId!, 'favoritas', get().items);
    } catch (error: any) {
      if (error?.status === 404) return;
      set({ items: previous });
      throw error;
    }
  },
  clear: async (userId) => {
    const target = userId || get().userId;
    set({ userId: null, items: [], status: 'idle', error: '', lastUpdated: null });
    if (typeof target === 'string') await clearUserCache(target);
  },
}));

registerSessionClearListener((userId) => {
  void useFavoritesStore.getState().clear(userId);
});
