const test = require('node:test');
const assert = require('node:assert/strict');

const { toggleFavoriteRecipe, normalizeMissingIngredients, isRecipeFavorite } = require('./favoritesUtils.js');

test('toggleFavoriteRecipe stores recipes by name and removes them once toggled off', () => {
  const recipe = { nombre: 'Ensalada' };
  const once = toggleFavoriteRecipe(recipe, []);
  assert.equal(once.length, 1);
  assert.equal(isRecipeFavorite(recipe, once), true);

  const twice = toggleFavoriteRecipe(recipe, once);
  assert.equal(twice.length, 0);
  assert.equal(isRecipeFavorite(recipe, twice), false);
});

test('normalizeMissingIngredients keeps the missing list safe even when quantity or unit are null', () => {
  const items = [
    { nombre: 'Tomate', cantidad: null, unidad: null, nota: 'verifica la cantidad' },
    { nombre: 'Lechuga', cantidad: 1, unidad: 'hojas' },
    null,
  ];

  const normalized = normalizeMissingIngredients(items);
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].cantidad, null);
  assert.equal(normalized[0].nota, 'verifica la cantidad');
  assert.equal(normalized[1].unidad, 'hojas');
});

test('normalizeMissingIngredients preserves zero quantities and treats absent lists as empty', () => {
  const normalized = normalizeMissingIngredients([
    { nombre: 'Arroz', cantidad: 0, unidad: 'g' },
    { nombre: 'Sal', cantidad: null, unidad: null },
    { nombre: '  ' },
  ]);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].cantidad, 0);
  assert.notEqual(normalized[0].id, normalized[1].id);
  assert.deepEqual(normalizeMissingIngredients(null), []);
});
