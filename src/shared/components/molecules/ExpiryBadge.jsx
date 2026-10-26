import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getExpiryBadgeConfig } from '../../../services/expiryUtils';
import { colors } from '../../../theme/colors';

export const ExpiryBadge = ({
  estado_vencimiento = null,
  dias_para_vencer = null,
  style = {},
  textStyle = {},
}) => {
  const config = getExpiryBadgeConfig({
    estado_vencimiento,
    dias_para_vencer,
  });
  const toneColors = {
    danger: {
      backgroundColor: colors.status.expiredBackground,
      textColor: colors.status.expiredText,
    },
    warning: {
      backgroundColor: colors.status.expiringBackground,
      textColor: colors.status.expiringText,
    },
    success: {
      backgroundColor: colors.status.currentBackground,
      textColor: colors.status.currentText,
    },
    neutral: {
      backgroundColor: colors.status.neutralBackground,
      textColor: colors.status.neutralText,
    },
  }[config.tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: toneColors.backgroundColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: toneColors.textColor },
          textStyle,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default ExpiryBadge;
