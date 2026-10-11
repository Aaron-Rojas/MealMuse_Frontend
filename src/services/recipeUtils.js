export const ALLERGEN_OPTIONS = [
  'Gluten',
  'Lácteos',
  'Huevos',
  'Maní',
  'Frutos secos',
  'Soya',
  'Pescado',
  'Mariscos',
];

export function normalizeAllergies(values = []) {
  const seen = new Set();
  const normalized = [];

  for (const value of values || []) {
    const candidate = String(value || '').trim();
    if (!candidate) continue;
    if (!ALLERGEN_OPTIONS.includes(candidate)) continue;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      normalized.push(candidate);
    }
  }

  return normalized.sort((a, b) => ALLERGEN_OPTIONS.indexOf(a) - ALLERGEN_OPTIONS.indexOf(b));
}

export function getCaloriesLabel(calories) {
  const value = Number(calories);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Calorías sin dato';
  }
  return `${Math.round(value)} kcal`;
}

export function getSafetyMessage(isSafe) {
  if (isSafe) {
    return 'Sin coincidencias con tus restricciones registradas';
  }
  return 'Revisa ingredientes y posibles contaminaciones cruzadas';
}
