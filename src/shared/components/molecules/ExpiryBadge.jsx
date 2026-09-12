import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * ExpiryBadge - Molécula de Insignia de Vencimiento Dinámica
 * 
 * ¿POR QUÉ?
 * Informa visualmente y al instante la urgencia de consumo de cada alimento mediante
 * una codificación de color semántica universal (rojo, amarillo, verde) para evitar el desperdicio.
 * 
 * ¿CÓMO?
 * Evalúa el número de días restantes (`days` o `dias`):
 * - Crítico (<= 3 días): Fondo y texto en escala roja de peligro.
 * - Advertencia (4 a 7 días): Fondo y texto en escala ámbar/amarillo de atención.
 * - Óptimo (> 7 días): Fondo y texto en escala verde de frescura.
 */
export const ExpiryBadge = ({
  days = 0,
  dias = null,
  style = {},
  textStyle = {},
}) => {
  // Unifica la prop ya sea enviada como 'days' o 'dias'
  const remainingDays = typeof dias === 'number' ? dias : Number(days) || 0;

  // Determina paleta y estilo dinámico
  let badgeBackground = colors.primaryLight;
  let badgeTextColor = colors.primary;

  if (remainingDays <= 3) {
    badgeBackground = colors.error.background; // Rojo / Alerta crítica
    badgeTextColor = colors.error.text;
  } else if (remainingDays >= 4 && remainingDays <= 7) {
    badgeBackground = '#FEF3C7';               // Amarillo / Advertencia moderada
    badgeTextColor = '#D97706';
  } else {
    badgeBackground = colors.primaryLight;     // Verde / Frescura adecuada
    badgeTextColor = colors.primary;
  }

  // Formateo del mensaje
  const labelText = remainingDays === 1
    ? 'Vence en 1 día'
    : `Vence en ${remainingDays} días`;

  return (
    <View style={[styles.badge, { backgroundColor: badgeBackground }, style]}>
      <Text style={[styles.badgeText, { color: badgeTextColor }, textStyle]}>
        {labelText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default ExpiryBadge;
