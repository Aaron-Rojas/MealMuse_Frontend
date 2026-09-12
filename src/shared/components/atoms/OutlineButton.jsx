import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * OutlineButton - Componente de Átomo para Botones Secundarios
 * 
 * ¿POR QUÉ?
 * Proporciona una jerarquía visual secundaria (fondo transparente con borde coloreado)
 * para acciones como "Registrarse", "Cancelar" o "Volver", sin competir visualmente
 * con el botón de acción principal.
 * 
 * ¿CÓMO?
 * Emplea `Pressable` con borde y color de texto basados en la paleta `colors.primary`.
 * Al presionarse, cambia sutilmente el fondo a un tinte claro (`colors.primaryLight`)
 * para otorgar feedback táctil inmediato.
 */
export const OutlineButton = ({
  title = 'Cancelar',
  onPress = () => {},
  disabled = false,
  loading = false,
  style = {},
  textStyle = {},
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        // Indicador de actividad usando el color primario para armonizar con el borde
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, disabled && styles.textDisabled, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonPressed: {
    backgroundColor: colors.primaryLight,
  },
  buttonDisabled: {
    borderColor: colors.border.default,
  },
  text: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  textDisabled: {
    color: colors.text.muted,
  },
});

export default OutlineButton;
