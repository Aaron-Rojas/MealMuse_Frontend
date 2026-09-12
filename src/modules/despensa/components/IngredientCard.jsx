import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { InitialAvatar } from '../../../shared/components/atoms/InitialAvatar';
import { ExpiryBadge } from '../../../shared/components/molecules/ExpiryBadge';
import { colors } from '../../../theme/colors';

/**
 * IngredientCard - Componente de Organismo para Tarjetas de Ingrediente
 * 
 * ¿POR QUÉ?
 * Sintetiza la información fundamental de un alimento en la despensa (nombre, cantidad
 * y fecha límite de consumo) y provee interacciones táctiles tanto de toque corto como
 * de pulsación larga (`onLongPress`) para acciones contextuales como la eliminación.
 * 
 * ¿CÓMO?
 * - Se utiliza `<TouchableOpacity>` configurando las props `onPress` y `onLongPress`.
 * - Ensambla el átomo `InitialAvatar` a la izquierda, la columna de texto central y el `ExpiryBadge` a la derecha.
 * - Incluye valores por defecto seguros en todas sus propiedades para prevenir fallos en tiempo de ejecución.
 */
export const IngredientCard = ({
  item = {},
  onPress = () => {},
  onLongPress = () => {},
  style = {},
}) => {
  const {
    name = 'Ingrediente',
    quantity = '1 unidad',
    daysToExpiry = 7,
    dias = null,
  } = item;

  const expiryDays = typeof dias === 'number' ? dias : daysToExpiry;

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
      style={[styles.card, style]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${quantity}, vence en ${expiryDays} días. Mantén presionado para opciones.`}
    >
      {/* 1. Avatar con letra inicial */}
      <InitialAvatar name={name} size={44} containerStyle={styles.avatarContainer} />

      {/* 2. Información del Alimento */}
      <View style={styles.infoContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.quantityText} numberOfLines={1}>
          {quantity}
        </Text>
      </View>

      {/* 3. Badge semántico de vencimiento */}
      <View style={styles.badgeContainer}>
        <ExpiryBadge days={expiryDays} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    // Sombras nativas para profundidad visual sutil
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarContainer: {
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  quantityText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default IngredientCard;
