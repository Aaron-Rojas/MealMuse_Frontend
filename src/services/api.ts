import * as SecureStore from 'expo-secure-store';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'mealmuse_access_token';
const REQUEST_TIMEOUT_MS = 15000;
const RECIPE_GENERATION_TIMEOUT_MS = 60000;
let authenticationExpiredHandler: (() => void) | null = null;
let activeUserId: string | null = null;
const sessionClearListeners = new Set<(userId: string | null) => void>();

type FavoriteRead = {
  id: string;
  nombre: string;
  receta: Record<string, unknown>;
  fecha_guardado: string;
};

type FavoritesSource = {
  getItems: () => FavoriteRead[] | null;
  setItems: (items: FavoriteRead[] | null) => void;
};
let favoritesSource: FavoritesSource | null = null;

export function registerFavoritesSource(source: FavoritesSource) {
  favoritesSource = source;
  return () => {
    if (favoritesSource === source) favoritesSource = null;
  };
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

export function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const detail = (data as Record<string, unknown>).detail;
  if (!detail || typeof detail !== 'object') return null;
  const code = (detail as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

export function registerSessionClearListener(fn: (userId: string | null) => void) {
  sessionClearListeners.add(fn);
  return () => sessionClearListeners.delete(fn);
}

function notifySessionClear() {
  sessionClearListeners.forEach((listener) => {
    try {
      listener(activeUserId);
    } catch (error) {
      console.warn('Session clear listener failed', error);
    }
  });
  activeUserId = null;
}

export function setAuthenticationExpiredHandler(handler: (() => void) | null) {
  authenticationExpiredHandler = handler;
}

export function getCachedFavorites(): FavoriteRead[] | null {
  const items = favoritesSource?.getItems();
  return items ? [...items] : null;
}

export function clearFavoritesCache() {
  favoritesSource?.setItems(null);
}

function parseErrorResponse(value: unknown): string {
  if (!value) return 'No se pudo completar la operación';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.detail === 'string') return candidate.detail;
    if (typeof candidate.detail === 'object') {
      const detail = candidate.detail as Record<string, unknown>;
      if (typeof detail.msg === 'string') return detail.msg;
      if (typeof detail.message === 'string') return detail.message;
    }
    if (typeof candidate.message === 'string') return candidate.message;
    if (typeof candidate.error === 'string') return candidate.error;
    if (Array.isArray(candidate.errors)) {
      const flat = candidate.errors.flatMap((item) => {
        if (typeof item === 'string') return [item];
        if (item && typeof item === 'object') {
          const nested = item as Record<string, unknown>;
          return Object.values(nested).filter((value) => typeof value === 'string') as string[];
        }
        return [];
      });
      if (flat.length) return flat.join(', ');
    }
  }
  return 'Ha ocurrido un error inesperado';
}

async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.warn('SecureStore read failed', error);
    return null;
  }
}

async function setAccessToken(token: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

async function clearAccessToken() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

async function ensureStoredSession() {
  const token = await getAccessToken();
  if (token) return token;
  clearFavoritesCache();
  notifySessionClear();
  try {
    if (auth.currentUser) {
      await auth.signOut();
    }
  } finally {
    authenticationExpiredHandler?.();
  }
  throw new Error('La sesión ha expirado');
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeJsonBody(rawText: string) {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch (error) {
    return rawText;
  }
}

async function requestJson<T>(
  endpoint: string,
  options: RequestInit = {},
  {
    requireAuth = false,
    timeoutMs = REQUEST_TIMEOUT_MS,
  }: { requireAuth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const requestHeaders = new Headers(options.headers || {});

  if (requireAuth) {
    const token = await ensureStoredSession();
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const res = await fetchWithTimeout(url, { ...options, headers: requestHeaders }, timeoutMs);
  const rawText = await res.text();
  const parsed = normalizeJsonBody(rawText);

  if (!res.ok) {
    const message = parseErrorResponse(parsed);
    const error = new Error(message) as Error & { status?: number; data?: unknown };
    error.status = res.status;
    error.data = parsed;

    if (res.status === 401) {
      await clearAccessToken();
      clearFavoritesCache();
      notifySessionClear();
      try {
        if (auth.currentUser) {
          await auth.signOut();
        }
      } finally {
        authenticationExpiredHandler?.();
      }
    }

    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return parsed as T;
}

export function normalizePantryPayload(data: {
  ingrediente: string;
  cantidad: number | string;
  unidad: string;
  fechaVencimiento?: string | null;
  fecha_caducidad?: string | null;
}) {
  const nextUnidad = String(data.unidad || '').trim();
  const normalizedUnidad = nextUnidad.toLowerCase();

  let normalizedValue = 'unidades';
  if (normalizedUnidad === 'unidad') normalizedValue = 'unidades';
  else if (normalizedUnidad === 'unidades') normalizedValue = 'unidades';
  else if (normalizedUnidad === 'l' || normalizedUnidad === 'litro' || normalizedUnidad === 'litros') normalizedValue = 'L';
  else if (normalizedUnidad === 'ml' || normalizedUnidad === 'mililitro' || normalizedUnidad === 'mililitros') normalizedValue = 'ml';
  else if (normalizedUnidad) normalizedValue = nextUnidad;

  const rawDate = data.fechaVencimiento ?? data.fecha_caducidad ?? null;
  const parseDate = (input?: string | null) => {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();
    let isoDate = trimmed;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('/');
      isoDate = `${year}-${month}-${day}`;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new Error('La fecha debe tener el formato dd/mm/aaaa');
    }

    const [year, month, day] = isoDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year
      || parsedDate.getUTCMonth() !== month - 1
      || parsedDate.getUTCDate() !== day
    ) {
      throw new Error('La fecha de vencimiento no es válida');
    }

    return isoDate;
  };

  return {
    ingrediente: String(data.ingrediente || '').trim(),
    cantidad: Number(data.cantidad),
    unidad: normalizedValue,
    fecha_caducidad: parseDate(rawDate),
  };
}

function formatPantryDateForInput(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const isoDate = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function normalizePantryItem<T extends Record<string, unknown>>(item: T): T & { fechaVencimiento: string } {
  return {
    ...item,
    fechaVencimiento: formatPantryDateForInput(item.fecha_caducidad),
  };
}

export async function syncWithBackend(idToken: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/auth/firebase-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  const rawText = await res.text();
  const payload = normalizeJsonBody(rawText);

  if (!res.ok) {
    const error = new Error(parseErrorResponse(payload)) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (payload?.access_token) {
    clearFavoritesCache();
    await setAccessToken(payload.access_token);
    const userId = payload?.user?.id;
    if (typeof userId === 'string' || typeof userId === 'number') {
      const nextUserId = String(userId);
      if (activeUserId && activeUserId !== nextUserId) notifySessionClear();
      clearFavoritesCache();
      activeUserId = String(userId);
    }
  }

  return payload;
}

export async function logoutFromBackend() {
  const token = await getAccessToken();
  if (!token) {
    await clearAccessToken();
    clearFavoritesCache();
    notifySessionClear();
    if (auth.currentUser) {
      await auth.signOut();
    }
    return;
  }

  try {
    await fetchWithTimeout(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn('Logout remote call failed', error);
  } finally {
    try {
      await clearAccessToken();
    } finally {
      clearFavoritesCache();
      notifySessionClear();
      if (auth.currentUser) {
        await auth.signOut();
      }
    }
  }
}

export async function getProfile() {
  return requestJson('/api/v1/users/profile', { method: 'GET' }, { requireAuth: true });
}

export async function getDistricts() {
  return requestJson<unknown[]>('/api/v1/geo/districts', { method: 'GET' }, { requireAuth: true });
}

export async function getLocation() {
  return requestJson('/api/v1/users/location', { method: 'GET' }, { requireAuth: true });
}

export async function updateLocation(data: { district_id: string; direccion_referencia?: string }) {
  return requestJson('/api/v1/users/location', {
    method: 'PUT',
    body: JSON.stringify({
      district_id: data.district_id,
      direccion_referencia: data.direccion_referencia?.trim() || undefined,
    }),
  }, { requireAuth: true });
}

export async function getNearbyStores({ lat, lng, radio_m = 1500 }: { lat: number; lng: number; radio_m?: number }) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radio_m: String(radio_m),
  });
  return requestJson<unknown[]>(`/api/v1/stores/nearby?${params.toString()}`, { method: 'GET' }, { requireAuth: true });
}

export async function getStoreRoute(storeId: string | number, { lat, lng }: { lat: number; lng: number }) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return requestJson(`/api/v1/stores/${encodeURIComponent(String(storeId))}/route?${params.toString()}`, { method: 'GET' }, { requireAuth: true });
}

export async function updateProfileRestrictions(allergies: string[]) {
  return requestJson(
    '/api/v1/users/profile',
    {
      method: 'PUT',
      body: JSON.stringify({ alergias: allergies }),
    },
    { requireAuth: true }
  );
}

export async function getPantry() {
  const pantry = await requestJson<unknown>('/api/v1/pantry/', { method: 'GET' }, { requireAuth: true });
  if (!Array.isArray(pantry)) {
    throw new Error('La respuesta de despensa no tiene un formato válido');
  }
  return pantry.map((item) => normalizePantryItem(item));
}

export async function getPantrySummary() {
  return requestJson('/api/v1/pantry/expiring-summary', { method: 'GET' }, { requireAuth: true });
}

export async function addPantryItem(data: {
  ingrediente: string;
  cantidad: number | string;
  unidad: string;
  fechaVencimiento?: string | null;
  fecha_caducidad?: string | null;
}) {
  const payload = normalizePantryPayload(data);
  const item = await requestJson<Record<string, unknown>>('/api/v1/pantry/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { requireAuth: true });
  return normalizePantryItem(item);
}

export async function updatePantryItem(id: string, data: {
  ingrediente: string;
  cantidad: number | string;
  unidad: string;
  fechaVencimiento?: string | null;
  fecha_caducidad?: string | null;
}) {
  const payload = normalizePantryPayload(data);
  const item = await requestJson<Record<string, unknown>>(`/api/v1/pantry/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, { requireAuth: true });
  return normalizePantryItem(item);
}

export async function deletePantryItem(id: string) {
  return requestJson(`/api/v1/pantry/${id}`, { method: 'DELETE' }, { requireAuth: true });
}

export async function generateRecipe(excludedRecipeName?: string) {
  const body = excludedRecipeName ? { excluir_receta: excludedRecipeName } : undefined;
  return requestJson(
    '/api/v1/recipes/generate',
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    },
    { requireAuth: true, timeoutMs: RECIPE_GENERATION_TIMEOUT_MS }
  );
}

function normalizeFavoriteRead(value: unknown): FavoriteRead {
  if (!value || typeof value !== 'object') {
    throw new Error('La respuesta de favoritas no tiene un formato válido');
  }
  const favorite = value as Record<string, unknown>;
  if (
    typeof favorite.id !== 'string'
    || typeof favorite.nombre !== 'string'
    || !favorite.receta
    || typeof favorite.receta !== 'object'
    || Array.isArray(favorite.receta)
    || typeof favorite.fecha_guardado !== 'string'
  ) {
    throw new Error('La respuesta de favoritas no tiene un formato válido');
  }
  return favorite as FavoriteRead;
}

export async function listFavorites({ refresh = false }: { refresh?: boolean } = {}): Promise<FavoriteRead[]> {
  const cached = favoritesSource?.getItems();
  if (cached && !refresh) return [...cached];
  const favorites = await requestJson<unknown>('/api/v1/recipes/favorites', { method: 'GET' }, { requireAuth: true });
  if (!Array.isArray(favorites)) {
    throw new Error('La lista de favoritas no tiene un formato válido');
  }
  const normalized = favorites.map(normalizeFavoriteRead);
  favoritesSource?.setItems(normalized);
  return [...normalized];
}

export async function saveFavorite(recipe: Record<string, unknown>): Promise<FavoriteRead> {
  const favorite = await requestJson<unknown>('/api/v1/recipes/favorites', {
    method: 'POST',
    body: JSON.stringify(recipe),
  }, { requireAuth: true });
  if (!favorite) {
    const existingFavorites = await listFavorites({ refresh: true });
    const existing = existingFavorites.find((item) => item.nombre === recipe.nombre);
    if (!existing) {
      throw new Error('La receta se guardó, pero no se pudo recuperar su identificador');
    }
    return existing;
  }

  const normalized = normalizeFavoriteRead(favorite);
  const current = favoritesSource?.getItems() || [];
  favoritesSource?.setItems([
    normalized,
    ...current.filter((item) => item.nombre !== normalized.nombre),
  ]);
  return normalized;
}

export async function getFavorite(id: string): Promise<FavoriteRead> {
  const favorite = await requestJson<unknown>(`/api/v1/recipes/favorites/${id}`, { method: 'GET' }, { requireAuth: true });
  return normalizeFavoriteRead(favorite);
}

export async function deleteFavorite(id: string) {
  try {
    const result = await requestJson(`/api/v1/recipes/favorites/${id}`, { method: 'DELETE' }, { requireAuth: true });
    const current = favoritesSource?.getItems();
    if (current) favoritesSource?.setItems(current.filter((item) => item.id !== id));
    return result;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      const current = favoritesSource?.getItems();
      if (current) favoritesSource?.setItems(current.filter((item) => item.id !== id));
    }
    throw error;
  }
}

export async function getStoredAccessToken() {
  return getAccessToken();
}
