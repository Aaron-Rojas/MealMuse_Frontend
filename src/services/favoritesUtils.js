export function getFavoriteRecipeName(recipe) {
  return recipe?.nombre || recipe?.receta?.nombre || '';
}

export function isRecipeFavorite(recipe, favorites = []) {
  const recipeName = getFavoriteRecipeName(recipe);
  if (!recipeName) return false;

  return favorites.some((favorite) => {
    const favoriteName = getFavoriteRecipeName(favorite);
    return favoriteName === recipeName;
  });
}

export function toggleFavoriteRecipe(recipe, favorites = []) {
  const recipeName = getFavoriteRecipeName(recipe);
  if (!recipeName) return [...favorites];

  const isFavorite = isRecipeFavorite(recipe, favorites);
  if (isFavorite) {
    return favorites.filter((favorite) => getFavoriteRecipeName(favorite) !== recipeName);
  }

  return [...favorites, recipe];
}

export function normalizeMissingIngredients(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => (
      item
      && typeof (item.nombre || item.name) === 'string'
      && (item.nombre || item.name).trim()
    ))
    .map((item, index) => {
      const nombre = (item.nombre || item.name).trim();
      const cantidad = item.cantidad ?? null;
      const unidad = item.unidad ?? null;
      return {
        id: item.id ?? `${nombre}-${cantidad ?? 'sin-cantidad'}-${unidad ?? 'sin-unidad'}-${index}`,
        nombre,
        cantidad,
        unidad,
        nota: item.nota || item.note || null,
      };
    });
}
