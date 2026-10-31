import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { InitialAvatar } from '../../../shared/components/atoms/InitialAvatar';
import { ExpiryBadge } from '../../../shared/components/molecules/ExpiryBadge';
import { getExpiryBadgeConfig } from '../../../services/expiryUtils';
import { colors } from '../../../theme/colors';

export const IngredientCard = ({
  item = {},
  onPress = () => {},
  onLongPress = () => {},
  style = {},
}) => {
  const {
    name = 'Ingrediente',
    quantity = null,
    estado_vencimiento = null,
    dias_para_vencer = null,
    cantidad = null,
    unidad = null,
  } = item;

  const badgeSource = {
    estado_vencimiento: estado_vencimiento || item.estado_vencimiento || null,
    dias_para_vencer: typeof dias_para_vencer === 'number'
      ? dias_para_vencer
      : typeof item.dias_para_vencer === 'number'
        ? item.dias_para_vencer
        : null,
  };

  const quantityText = quantity || (cantidad != null ? `${cantidad} ${unidad || ''}`.trim() : null);
  const cardState = badgeSource.estado_vencimiento;
  const cardBackground = cardState === 'vencido'
    ? colors.status.expiredBackground
    : cardState === 'por_vencer'
      ? colors.status.expiringBackground
      : colors.background.card;
  const cardBorder = cardState === 'vencido'
    ? colors.status.expiredText
    : cardState === 'por_vencer'
      ? colors.status.expiringText
      : colors.border.light;
  const expiryLabel = getExpiryBadgeConfig(badgeSource).label;

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }, style]}
      accessibilityRole="button"
      accessibilityLabel={`${name}${quantityText ? `, ${quantityText}` : ''}. ${expiryLabel}. Toca para editar; mantén presionado para eliminar.`}
    >
      <InitialAvatar name={name} size={44} containerStyle={styles.avatarContainer} />

      <View style={styles.infoContainer}>
        <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
        {quantityText ? (
          <Text style={styles.quantityText} numberOfLines={1}>{quantityText}</Text>
        ) : null}
      </View>

      <View style={styles.badgeContainer}>
        <ExpiryBadge
          estado_vencimiento={badgeSource.estado_vencimiento}
          dias_para_vencer={badgeSource.dias_para_vencer}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
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
  avatarContainer: { marginRight: 14 },
  infoContainer: { flex: 1, justifyContent: 'center', marginRight: 8 },
  nameText: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 4, letterSpacing: -0.3 },
  quantityText: { fontSize: 13, color: colors.text.secondary },
  badgeContainer: { alignItems: 'flex-end', justifyContent: 'center' },
});

export default IngredientCard;
