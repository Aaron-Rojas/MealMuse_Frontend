const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeAllergies, getCaloriesLabel, getSafetyMessage } = require('./recipeUtils.js');

test('normalizeAllergies keeps only valid backend values and preserves the allowed order', () => {
  assert.deepEqual(normalizeAllergies(['Maní', 'Gluten', 'Maní', 'Pescado', 'Cualquier cosa']), ['Gluten', 'Maní', 'Pescado']);
});

test('getCaloriesLabel handles unknown calorie data honestly', () => {
  assert.equal(getCaloriesLabel(0), 'Calorías sin dato');
  assert.equal(getCaloriesLabel(320), '320 kcal');
});

test('getSafetyMessage communicates verification without guaranteeing medical safety', () => {
  assert.equal(getSafetyMessage(true), 'Sin coincidencias con tus restricciones registradas');
  assert.equal(getSafetyMessage(false), 'Revisa ingredientes y posibles contaminaciones cruzadas');
});
