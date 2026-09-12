import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CustomInput } from '../atoms/CustomInput';
import { colors } from '../../../theme/colors';

/**
 * FormField - Componente de Molécula para Campos de Formulario
 * 
 * ¿POR QUÉ?
 * Facilita la creación consistente de formularios encapsulando en una sola unidad
 * reutilizable: la etiqueta (label), el campo de texto (CustomInput) y el mensaje de validación/error.
 * 
 * ¿CÓMO?
 * Ensambla el átomo `CustomInput` junto con elementos `Text` tipográficos preconfigurados.
 * Recibe propiedades del input pasándolas hacia el átomo subyacente y evalúa condicionalmente
 * la presencia de `errorMessage` para alertar visualmente al usuario.
 */
export const FormField = ({
  label = '',
  value = '',
  onChangeText = () => {},
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  errorMessage = '',
  containerStyle = {},
  inputStyle = {},
  ...restProps
}) => {
  const hasError = Boolean(errorMessage && errorMessage.trim().length > 0);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Etiqueta superior del campo */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Átomo de entrada de texto estandarizado */}
      <CustomInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        hasError={hasError}
        style={inputStyle}
        {...restProps}
      />

      {/* Mensaje de validación o error semántico */}
      {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.danger,
    marginTop: 4,
  },
});

export default FormField;
