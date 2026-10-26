const test = require('node:test');
const assert = require('node:assert/strict');

const { getExpiryBadgeConfig } = require('./expiryUtils.js');

test('maps pantry expiration states to user-friendly labels and colors', () => {
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'vencido', dias_para_vencer: -2 }).label, 'Vencido hace 2 días');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'por_vencer', dias_para_vencer: 0 }).label, 'Vence hoy');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'por_vencer', dias_para_vencer: 1 }).label, 'Vence mañana');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'por_vencer', dias_para_vencer: 2 }).label, 'Vence en 2 días');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'por_vencer', dias_para_vencer: 3 }).label, 'Vence en 3 días');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'vigente', dias_para_vencer: 5 }).label, 'Vence en 5 días');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'vencido', dias_para_vencer: -1 }).label, 'Vencido hace 1 día');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'sin_fecha' }).label, 'Sin fecha');
  assert.equal(getExpiryBadgeConfig({ estado_vencimiento: 'por_vencer' }).label, 'Por vencer');
});

test('does not infer expiration status when the backend state is missing', () => {
  assert.equal(getExpiryBadgeConfig({ dias_para_vencer: -3 }).label, 'Sin fecha');
  assert.equal(getExpiryBadgeConfig({ dias_para_vencer: 3 }).label, 'Sin fecha');
  assert.equal(getExpiryBadgeConfig({ dias_para_vencer: 7 }).label, 'Sin fecha');
});
