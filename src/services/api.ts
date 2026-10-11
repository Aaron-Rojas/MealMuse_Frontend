import * as SecureStore from 'expo-secure-store';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'mealmuse_access_token';

function parseErrorResponse(value: unknown): string {
  if (!value) return 'No se pudo completar la operación';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.detail === 'string') return candidate.detail;
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
  throw new Error('La sesión ha expirado');
}

async function requestJson<T>(
  endpoint: string,
  options: RequestInit = {},
  { requireAuth = false }: { requireAuth?: boolean } = {}
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

  const res = await fetch(url, { ...options, headers: requestHeaders });
  const rawText = await res.text();
  const parsed = rawText ? JSON.parse(rawText) : null;

  if (!res.ok) {
    const message = parseErrorResponse(parsed);
    const error = new Error(message) as Error & { status?: number; data?: unknown };
    error.status = res.status;
    error.data = parsed;
    throw error;
  }

  return parsed as T;
}

export async function syncWithBackend(idToken: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/firebase-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  const rawText = await res.text();
  const payload = rawText ? JSON.parse(rawText) : null;

  if (!res.ok) {
    const error = new Error(parseErrorResponse(payload)) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (payload?.access_token) {
    await setAccessToken(payload.access_token);
  }

  return payload;
}

export async function logoutFromBackend() {
  const token = await getAccessToken();
  if (!token) {
    await clearAccessToken();
    return;
  }

  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn('Logout remote call failed', error);
  } finally {
    await clearAccessToken();
  }

  if (auth.currentUser) {
    await auth.signOut();
  }
}

export async function getProfile() {
  return requestJson('/api/v1/users/profile', { method: 'GET' }, { requireAuth: true });
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
  return requestJson('/api/v1/pantry/', { method: 'GET' }, { requireAuth: true });
}

export async function addPantryItem(data: {
  ingrediente: string;
  cantidad: number;
  unidad: string;
  fecha_caducidad?: string | null;
}) {
  return requestJson(
    '/api/v1/pantry/',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    { requireAuth: true }
  );
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
    { requireAuth: true }
  );
}

export async function getStoredAccessToken() {
  return getAccessToken();
}