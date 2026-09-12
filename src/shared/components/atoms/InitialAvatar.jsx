import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * InitialAvatar - Átomo de Avatar con Letra Inicial
 * 
 * ¿POR QUÉ?
 * Otorga una representación visual rápida, consistente e intuitiva de cada alimento
 * en la despensa, facilitando el escaneo visual rápido sin requerir carga de imágenes externas.
 * 
 * ¿CÓMO?
 * Extrae el primer carácter del nombre provisto, lo convierte a mayúsculas y lo ubica
 * en el centro de un contenedor circular con fondo suave (`colors.primaryLight`) y texto
 * destacado en verde corporativo (`colors.primary`).
 */
export const InitialAvatar = ({
  name = 'A',
  size = 48,
  containerStyle = {},
  textStyle = {},
}) => {
  // Extrae la primera letra en mayúscula o '?' si no hay texto válido
  const initial = typeof name === 'string' && name.trim().length > 0
    ? name.trim().charAt(0).toUpperCase()
    : '?';

  return (
    <View
      style={[
        styles.avatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        containerStyle,
      ]}
    >
      <Text
        style={[
          styles.initialText,
          { fontSize: Math.round(size * 0.42) },
          textStyle,
        ]}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarCircle: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default InitialAvatar;
