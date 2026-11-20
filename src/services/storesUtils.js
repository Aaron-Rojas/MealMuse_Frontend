export function formatDistance(distanceMeters) {
  const value = Number(distanceMeters);
  if (!Number.isFinite(value) || value < 0) return 'Distancia no disponible';
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0).replace('.', ',')} km`;
}

export function formatWalkingTime(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return 'Tiempo no disponible';
  return `${Math.max(1, Math.round(value))} min a pie`;
}

export function getStoreTypeMeta(tipo) {
  const normalized = String(tipo || '').toLowerCase();
  if (normalized === 'mercado') return { icon: 'M', label: 'Mercado' };
  if (normalized === 'supermercado') return { icon: 'S', label: 'Supermercado' };
  return { icon: 'B', label: 'Bodega' };
}

export function sortStoresByDistance(stores) {
  return [...(Array.isArray(stores) ? stores : [])].sort(
    (a, b) => Number(a?.distancia_m ?? Infinity) - Number(b?.distancia_m ?? Infinity)
  );
}

export function buildGoogleMapsDirectionsUrl(store) {
  const lat = encodeURIComponent(String(store?.latitud));
  const lng = encodeURIComponent(String(store?.longitud));
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
