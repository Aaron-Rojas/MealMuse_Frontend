import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
// ANÁLISIS CRÍTICO DE FALLO:
// El `SafeAreaView` nativo de 'react-native' se encuentra deprecado. Para garantizar
// compatibilidad con Expo Go y prevenir bugs de renderizado, utilizamos 'react-native-safe-area-context'.
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../../../shared/components/atoms/CustomInput';
import { PrimaryButton } from '../../../shared/components/atoms/PrimaryButton';
import { colors } from '../../../theme/colors';

/**
 * RegisterScreen - Pantalla de Registro de Usuario (Figma MealMuse)
 * 
 * ¿POR QUÉ?
 * Permite a los nuevos usuarios crear una cuenta en MealMuse con validaciones
 * de confirmación de contraseña, indicación de seguridad de datos y navegación fluida.
 * 
 * ¿CÓMO?
 * - Se reutilizan los átomos existentes (`CustomInput`, `PrimaryButton`).
 * - Se implementa una barra de encabezado superior personalizada con botón de retorno (`<`) que invoca `navigation.goBack()`.
 * - Se incluye el indicador de cifrado con check verde semántico.
 * - Toda la vista está envuelta en `<KeyboardAvoidingView>` y `<ScrollView>` para accesibilidad móvil en teclados virtuales.
 */
export const RegisterScreen = ({
  navigation = { navigate: () => {}, goBack: () => {} },
  onRegisterSuccess = () => {},
}) => {
  // Estados de los campos del formulario de registro
  const [fullName, setFullName] = useState('Esther Sinche');
  const [email, setEmail] = useState('esther@correo.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Valida los campos requeridos y simula la creación de la cuenta
   */
  const handleRegisterSubmit = () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    // Simulación de registro con backend
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Cuenta Creada',
        'Tu cuenta ha sido creada exitosamente.',
        [{ text: 'Continuar', onPress: () => navigation.goBack() }]
      );
      onRegisterSuccess({ fullName, email });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.main} />

      {/* 1. Header Personalizado con botón de retroceso y título */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
          style={styles.backButton}
          accessibilityLabel="Volver a la pantalla anterior"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear cuenta</Text>
      </View>
      <View style={styles.headerDivider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Formulario de Datos Personales y Credenciales */}
          <View style={styles.form}>
            {/* Campo: Nombre completo */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre completo</Text>
              <CustomInput
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ingresa tu nombre completo"
                autoCapitalize="words"
              />
            </View>

            {/* Campo: Correo electrónico */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo electrónico</Text>
              <CustomInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="ejemplo@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Campo: Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <CustomInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••"
                secureTextEntry={isPasswordHidden}
                rightIcon={isPasswordHidden ? '🔒' : '🔓'}
                onRightIconPress={() => setIsPasswordHidden(!isPasswordHidden)}
              />
            </View>

            {/* Campo: Confirmar contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirmar contraseña</Text>
              <CustomInput
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••"
                secureTextEntry={isConfirmPasswordHidden}
                rightIcon={isConfirmPasswordHidden ? '🔒' : '🔓'}
                onRightIconPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
              />
            </View>

            {/* Mensaje de validación condicional */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* 3. Indicador de Seguridad (Check Verde) */}
            <View style={styles.securityNoteContainer}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.securityNoteText}>
                Tu contraseña se almacena cifrada
              </Text>
            </View>

            {/* 4. Botón de Creación de Cuenta */}
            <PrimaryButton
              title="Crear cuenta"
              onPress={handleRegisterSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />

            {/* 5. Enlace para volver a Iniciar Sesión */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={styles.loginRedirectButton}
            >
              <Text style={styles.loginRedirectText}>
                ¿Ya tienes cuenta? <Text style={styles.loginRedirectHighlight}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background.main,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 34,
    color: colors.text.primary,
    fontWeight: '300',
    lineHeight: 34,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    width: '100%',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
  },
  form: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  errorBanner: {
    backgroundColor: colors.error.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: {
    color: colors.error.text,
    fontSize: 13,
    fontWeight: '600',
  },
  securityNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkIcon: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  securityNoteText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  submitButton: {
    marginBottom: 20,
  },
  loginRedirectButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  loginRedirectText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  loginRedirectHighlight: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
