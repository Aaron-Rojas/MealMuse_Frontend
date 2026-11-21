jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../services/api', () => ({
  getPantry: jest.fn(async () => []),
  getPantrySummary: jest.fn(async () => ({ por_vencer: 0, vencidos: 0 })),
  addPantryItem: jest.fn(async (data) => ({ id: 'created', ...data })),
  updatePantryItem: jest.fn(async () => ({})),
  deletePantryItem: jest.fn(async () => ({})),
  listFavorites: jest.fn(async () => []),
  saveFavorite: jest.fn(async (recipe) => ({ id: 'new-favorite', nombre: recipe.nombre, receta: recipe, fecha_guardado: '2026-11-20' })),
  deleteFavorite: jest.fn(async () => ({})),
  getProfile: jest.fn(async () => ({ nombre: 'Ana', alergias: ['Leche'] })),
  getLocation: jest.fn(async () => ({ district_id: 'uuid-district', latitud: -12, longitud: -77 })),
  updateLocation: jest.fn(async (data) => ({ district_id: data.district_id })),
  updateProfileRestrictions: jest.fn(async () => ({})),
  registerSessionClearListener: jest.fn(),
  registerFavoritesSource: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { readCache, writeCache, clearUserCache, clearAllMealMuseCache } from './cacheStorage';
import { usePantryStore } from './pantryStore';
import { useFavoritesStore } from './favoritesStore';
import { useProfileStore } from './profileStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  usePantryStore.setState({ userId: null, items: [], summary: { por_vencer: 0, vencidos: 0 }, status: 'idle', error: '', lastUpdated: null });
  useFavoritesStore.setState({ userId: null, items: [], status: 'idle', error: '', lastUpdated: null });
  useProfileStore.setState({ userId: null, name: '', allergies: [], manualLocation: null, status: 'idle', error: '', lastUpdated: null });
  jest.clearAllMocks();
});

test('cacheStorage usa clave aislada por usuario y TTL de 24 h', async () => {
  await writeCache('user-a', 'favoritas', [{ id: 'a' }]);
  await expect(readCache('user-a', 'favoritas')).resolves.toEqual([{ id: 'a' }]);
  await expect(readCache('user-b', 'favoritas')).resolves.toBeNull();
  expect(await AsyncStorage.getItem('mealmuse:user-a:favoritas')).toContain('"v":1');
});

test('cacheStorage descarta versión distinta y limpia usuarios', async () => {
  await AsyncStorage.setItem('mealmuse:user-a:perfil', JSON.stringify({ v: 999, savedAt: Date.now(), data: { name: 'viejo' } }));
  await expect(readCache('user-a', 'perfil')).resolves.toBeNull();
  await writeCache('user-a', 'despensa', []);
  await writeCache('user-b', 'despensa', []);
  await clearUserCache('user-a');
  expect(await AsyncStorage.getItem('mealmuse:user-a:despensa')).toBeNull();
  expect(await AsyncStorage.getItem('mealmuse:user-b:despensa')).not.toBeNull();
  await clearAllMealMuseCache();
  expect(await AsyncStorage.getItem('mealmuse:user-b:despensa')).toBeNull();
});

test('pantryStore hidrata caché y revalida en segundo plano', async () => {
  await writeCache('pantry-user', 'despensa', [{ id: 'cached', ingrediente: 'Arroz' }]);
  await usePantryStore.getState().hydrate('pantry-user');
  expect(usePantryStore.getState().items).toEqual([{ id: 'cached', ingrediente: 'Arroz' }]);
  await usePantryStore.getState().refresh();
  expect(usePantryStore.getState().status).toBe('idle');
});

test('favoritesStore aplica rollback optimista', async () => {
  useFavoritesStore.setState({ userId: 'fav-user', items: [{ id: 'old', nombre: 'Anterior', receta: {} }] });
  const api = require('../services/api');
  api.saveFavorite.mockRejectedValueOnce(new Error('falló'));
  await expect(useFavoritesStore.getState().add({ nombre: 'Nueva' })).rejects.toThrow('falló');
  expect(useFavoritesStore.getState().items).toEqual([{ id: 'old', nombre: 'Anterior', receta: {} }]);
});

test('profileStore guarda ubicación UUID y limpia estado', async () => {
  useProfileStore.setState({ userId: 'profile-user' });
  const location = await useProfileStore.getState().saveLocation('district-uuid', 'Frente al parque');
  expect(location.district_id).toBe('district-uuid');
  await useProfileStore.getState().clear('profile-user');
  expect(useProfileStore.getState().manualLocation).toBeNull();
});
