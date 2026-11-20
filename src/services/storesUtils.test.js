const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatDistance,
  formatWalkingTime,
  getStoreTypeMeta,
  sortStoresByDistance,
  buildGoogleMapsDirectionsUrl,
} = require('./storesUtils');

test('formatea distancias en metros y kilómetros', () => {
  assert.equal(formatDistance(350), '350 m');
  assert.equal(formatDistance(1200), '1,2 km');
});

test('formatea tiempo de caminata', () => {
  assert.equal(formatWalkingTime(4.2), '4 min a pie');
  assert.equal(formatWalkingTime(0), '1 min a pie');
});

test('devuelve etiquetas e iconos distintos por tipo', () => {
  assert.equal(getStoreTypeMeta('bodega').icon, 'B');
  assert.equal(getStoreTypeMeta('mercado').icon, 'M');
  assert.equal(getStoreTypeMeta('supermercado').icon, 'S');
});

test('ordena comercios sin mutar la lista original', () => {
  const original = [{ id: 2, distancia_m: 800 }, { id: 1, distancia_m: 300 }];
  assert.deepEqual(sortStoresByDistance(original).map((store) => store.id), [1, 2]);
  assert.deepEqual(original.map((store) => store.id), [2, 1]);
});

test('construye enlace profundo de Google Maps', () => {
  assert.equal(
    buildGoogleMapsDirectionsUrl({ latitud: -12.0464, longitud: -77.0428 }),
    'https://www.google.com/maps/dir/?api=1&destination=-12.0464,-77.0428&travelmode=walking'
  );
});
