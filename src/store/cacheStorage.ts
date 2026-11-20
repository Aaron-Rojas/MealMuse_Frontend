import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_VERSION = 1;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MEALMUSE_PREFIX = 'mealmuse:';

export function getCacheKey(userId: string, resource: string) {
  return `${MEALMUSE_PREFIX}${encodeURIComponent(userId)}:${resource}`;
}

export async function readCache<T>(userId: string, resource: string): Promise<T | null> {
  if (!userId) return null;
  const raw = await AsyncStorage.getItem(getCacheKey(userId, resource));
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as { v?: number; savedAt?: number; data?: T };
    if (entry.v !== CACHE_VERSION) {
      await AsyncStorage.removeItem(getCacheKey(userId, resource));
      return null;
    }
    if (!Number.isFinite(entry.savedAt) || Date.now() - Number(entry.savedAt) > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(getCacheKey(userId, resource));
      return null;
    }
    return entry.data as T;
  } catch {
    await AsyncStorage.removeItem(getCacheKey(userId, resource));
    return null;
  }
}

export async function writeCache<T>(userId: string, resource: string, data: T) {
  if (!userId) return;
  await AsyncStorage.setItem(
    getCacheKey(userId, resource),
    JSON.stringify({ v: CACHE_VERSION, savedAt: Date.now(), data })
  );
}

export async function clearUserCache(userId: string) {
  if (!userId) return;
  const keys = await AsyncStorage.getAllKeys();
  const prefix = `${MEALMUSE_PREFIX}${encodeURIComponent(userId)}:`;
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(prefix)));
}

export async function clearAllMealMuseCache() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(MEALMUSE_PREFIX)));
}
