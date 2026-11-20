import { create } from 'zustand';
import { getLocation, getProfile, registerSessionClearListener, updateLocation, updateProfileRestrictions } from '../services/api';
import { clearUserCache, readCache, writeCache } from './cacheStorage';

type ManualLocation = any;
type State = {
  userId: string | null;
  name: string;
  allergies: string[];
  manualLocation: ManualLocation | null;
  status: 'idle' | 'loading' | 'refreshing' | 'error';
  error: string;
  lastUpdated: number | null;
  hydrate: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  saveLocation: (districtId: number, referencia: string) => Promise<ManualLocation>;
  saveRestrictions: (allergies: string[]) => Promise<void>;
  clear: (userId?: string | null) => Promise<void>;
};

export const useProfileStore = create<State>((set, get) => ({
  userId: null,
  name: '',
  allergies: [],
  manualLocation: null,
  status: 'idle',
  error: '',
  lastUpdated: null,
  hydrate: async (userId) => {
    set({ userId, status: 'loading', error: '' });
    const [profile, location] = await Promise.all([
      readCache<any>(userId, 'perfil'),
      readCache<ManualLocation>(userId, 'ubicacion'),
    ]);
    set({
      name: profile?.nombre || '',
      allergies: profile?.alergias || [],
      manualLocation: location,
      status: profile || location ? 'refreshing' : 'loading',
      lastUpdated: profile || location ? Date.now() : null,
    });
  },
  refresh: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ status: get().name || get().manualLocation ? 'refreshing' : 'loading', error: '' });
    try {
      const [profile, location] = await Promise.all([getProfile(), getLocation()]);
      await Promise.all([
        writeCache(userId, 'perfil', profile),
        writeCache(userId, 'ubicacion', location),
      ]);
      const profileData = profile as any;
      set({ name: profileData?.nombre || '', allergies: profileData?.alergias || [], manualLocation: location as any, status: 'idle', error: '', lastUpdated: Date.now() });
    } catch (error: any) {
      set({ status: 'error', error: error?.message || 'No se pudo actualizar el perfil.' });
    }
  },
  saveLocation: async (districtId, referencia) => {
    const previous = get().manualLocation;
    try {
      const location = await updateLocation({ district_id: districtId, direccion_referencia: referencia });
      set({ manualLocation: location });
      if (get().userId) await writeCache(get().userId!, 'ubicacion', location);
      return location;
    } catch (error) {
      set({ manualLocation: previous });
      throw error;
    }
  },
  saveRestrictions: async (allergies) => {
    const previous = get().allergies;
    set({ allergies });
    try {
      await updateProfileRestrictions(allergies);
      if (get().userId) await writeCache(get().userId!, 'perfil', { nombre: get().name, alergias: allergies });
    } catch (error) {
      set({ allergies: previous });
      throw error;
    }
  },
  clear: async (userId) => {
    const target = userId || get().userId;
    set({ userId: null, name: '', allergies: [], manualLocation: null, status: 'idle', error: '', lastUpdated: null });
    if (typeof target === 'string') await clearUserCache(target);
  },
}));

registerSessionClearListener((userId) => {
  void useProfileStore.getState().clear(userId);
});
