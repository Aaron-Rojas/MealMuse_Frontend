export function getExpiryBadgeConfig(input = {}) {
  const state = input.estado_vencimiento || null;
  const days = typeof input.dias_para_vencer === 'number' && Number.isFinite(input.dias_para_vencer)
    ? input.dias_para_vencer
    : null;

  if (state === 'sin_fecha') {
    return {
      state: 'sin_fecha',
      label: 'Sin fecha',
      tone: 'neutral',
    };
  }

  if (state === 'vencido') {
    const absDays = days !== null ? Math.abs(days) : null;
    return {
      state: 'vencido',
      label: absDays === null
        ? 'Vencido'
        : absDays === 1
          ? 'Vencido hace 1 día'
          : `Vencido hace ${absDays} días`,
      tone: 'danger',
    };
  }

  if (state === 'por_vencer') {
    if (days === 0) {
      return {
        state: 'por_vencer',
        label: 'Vence hoy',
        tone: 'warning',
      };
    }

    if (days === 1) {
      return {
        state: 'por_vencer',
        label: 'Vence mañana',
        tone: 'warning',
      };
    }

    return {
      state: 'por_vencer',
      label: days !== null ? `Vence en ${days} días` : 'Por vencer',
      tone: 'warning',
    };
  }

  if (state === 'vigente') {
    return {
      state: 'vigente',
      label: days !== null ? `Vence en ${days} días` : 'Vigente',
      tone: 'success',
    };
  }

  return {
    state: 'sin_fecha',
    label: 'Sin fecha',
    tone: 'neutral',
  };
}
