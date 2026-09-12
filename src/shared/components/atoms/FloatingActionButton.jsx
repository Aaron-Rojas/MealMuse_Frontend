import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * FloatingActionButton (FAB) - Átomo de Botón Flotante
 * 
 * ¿POR QUÉ?
 * Proporciona un acceso directo, visible y ergonómico para la acción principal de la pantalla
 * (agregar un nuevo ingrediente a la despensa), flotando sobre cualquier contenido desplazable.
 * 
 * ¿CÓMO?
 * Se posiciona de manera absoluta (`position: 'absolute'`) en la esquina inferior derecha.
 * Se aplica elevación y sombras nativas según la plataforma (elevation en Android, shadow en iOS)
 * y un zIndex alto para asegurar que permanezca siempre en primer plano sobre la FlatList.
 */
export const FloatingActionButton = ({
  onPress = () => {},
  icon = '+',
  accessibilityLabel = 'Agregar nuevo ingrediente',
  style = {},
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.iconText}>{icon}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    // Sombras nativas para profundidad visual
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconText: {
    color: colors.text.inverse,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
    marginTop: -2, // Ajuste óptico de centrado vertical
  },
});

export default FloatingActionButton;
