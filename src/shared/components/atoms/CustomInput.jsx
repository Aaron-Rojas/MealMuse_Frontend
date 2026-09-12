import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * CustomInput - Campo de Entrada Nativo Estandarizado
 * 
 * ¿POR QUÉ?
 * Garantiza un campo de entrada limpio, accesible y fiel al diseño de Figma,
 * soportando estado de foco, iconos a la derecha (como el candado de contraseña) y bordes redondeados.
 * 
 * ¿CÓMO?
 * Utiliza `TextInput` envuelto en un contenedor `<View>`. Gestiona el estado de foco localmente
 * para cambiar el color del borde a `colors.border.focus`. Permite opcionalmente alternar la visibilidad
 * de la contraseña o mostrar iconos a la derecha mediante `<TouchableOpacity>`.
 */
export const CustomInput = ({
  value = '',
  onChangeText = () => {},
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  rightIcon = null,
  onRightIconPress = null,
  style = {},
  inputStyle = {},
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        !editable && styles.containerDisabled,
        style,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[styles.input, inputStyle]}
        {...restProps}
      />

      {rightIcon ? (
        <TouchableOpacity
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
          activeOpacity={0.7}
          style={styles.rightIconContainer}
        >
          {typeof rightIcon === 'string' ? (
            <Text style={styles.iconText}>{rightIcon}</Text>
          ) : (
            rightIcon
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    backgroundColor: colors.background.surface,
    borderWidth: 1.2,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  containerFocused: {
    borderColor: colors.border.focus,
  },
  containerDisabled: {
    backgroundColor: colors.background.elevated,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  rightIconContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    color: colors.text.muted,
  },
});

export default CustomInput;
