import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * PrimaryButton - Componente de Botón Principal Sólido
 * 
 * ¿POR QUÉ?
 * Representa la acción jerárquica más importante de la pantalla ("Iniciar sesión"),
 * ofreciendo un área táctil amplia, respuesta visual inmediata y estados de carga.
 * 
 * ¿CÓMO?
 * Se utiliza `TouchableOpacity` nativo con `activeOpacity={0.8}` para asegurar una transición
 * suave al presionar. Se incorporan valores por defecto en todas sus props y se aplica
 * `StyleSheet.create` con los tokens de color corporativos (`colors.primary`).
 */
export const PrimaryButton = ({
  title = 'Iniciar sesión',
  onPress = () => {},
  disabled = false,
  loading = false,
  style = {},
  textStyle = {},
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} size="small" />
      ) : (
        <Text style={[styles.text, disabled && styles.textDisabled, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: colors.border.light,
  },
  text: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  textDisabled: {
    color: colors.text.muted,
  },
});

export default PrimaryButton;
