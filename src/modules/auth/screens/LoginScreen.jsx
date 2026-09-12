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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../../../shared/components/atoms/CustomInput';
import { PrimaryButton } from '../../../shared/components/atoms/PrimaryButton';
import { colors } from '../../../theme/colors';

/**
 * LoginScreen - Pantalla de Inicio de Sesión (Figma MealMuse)
 * 
 * ¿POR QUÉ?
 * Implementa la interfaz fiel al diseño de Figma, ofreciendo una experiencia visual limpia,
 * adaptada al flujo de despensa y recetas, con manejo de errores visibles y navegación fluida.
 * 
 * ¿CÓMO?
 * - Se estructura con `<SafeAreaView>` (de react-native-safe-area-context) y `<KeyboardAvoidingView>`
 *   para evitar colisiones con el teclado virtual y áreas no seguras del dispositivo.
 * - `<ScrollView>` garantiza desplazamiento fluido en pantallas de cualquier tamaño.
 * - Inyecta la prop `navigation` con valores por defecto; al autenticar utiliza `replace('Despensa')`
 *   para no conservar la pantalla de inicio de sesión en el historial de navegación.
 */
export const LoginScreen = ({
  navigation = { navigate: () => {}, replace: () => {}, goBack: () => {} },
  onLogin = () => {},
  onForgotPassword = () => {},
  onGoogleLogin = () => {},
  onNavigateToRegister = null,
}) => {
  // Estados de los campos del formulario
  const [email, setEmail] = useState('esther@correo.com');
  const [password, setPassword] = useState('password123');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [errorMessage, setErrorMessage] = useState('Correo o contraseña incorrectos');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Maneja el envío del formulario y activa la validación
   */
  const handleLoginSubmit = () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu correo y contraseña');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Simulación de validación con backend
    setTimeout(() => {
      setIsLoading(false);
      onLogin({ email, password });

      // Transición segura al Home de Despensa reemplazando la pila
      if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('Despensa');
      } else if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Despensa');
      }
    }, 800);
  };

  /**
   * Navega a la pantalla de registro (RegisterScreen)
   */
  const handleRegisterNavigation = () => {
    if (typeof onNavigateToRegister === 'function') {
      onNavigateToRegister();
    } else if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Register');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.main} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header con Logo e Identidad MealMuse */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <View style={styles.logoInnerLeaf} />
            </View>
            <Text style={styles.appName}>MealMuse</Text>
            <Text style={styles.appTagline}>Tu despensa, tus recetas</Text>
          </View>

          {/* 2. Formulario de Credenciales */}
          <View style={styles.form}>
            {/* Campo Correo Electrónico */}
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

            {/* Campo Contraseña con icono de candado */}
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

            {/* Banner de Error (Figma) */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Enlace ¿Olvidaste tu contraseña? */}
            <TouchableOpacity
              onPress={onForgotPassword}
              activeOpacity={0.7}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Botón Iniciar sesión */}
            <PrimaryButton
              title="Iniciar sesión"
              onPress={handleLoginSubmit}
              loading={isLoading}
              style={styles.loginButton}
            />

            {/* Separador "o continúa con" */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón Continuar con Google */}
            <TouchableOpacity
              onPress={onGoogleLogin}
              activeOpacity={0.8}
              style={styles.googleButton}
            >
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Footer "¿No tienes cuenta? Regístrate" */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleRegisterNavigation}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>
                ¿No tienes cuenta? <Text style={styles.footerHighlight}>Regístrate</Text>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  // Cabecera e isotipo
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoInnerLeaf: {
    width: 26,
    height: 38,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: colors.text.secondary,
    letterSpacing: -0.2,
  },
  // Formulario
  form: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  // Banner de alerta/error
  errorBanner: {
    backgroundColor: colors.error.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  errorText: {
    color: colors.error.text,
    fontSize: 13,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: colors.text.link,
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    marginBottom: 20,
  },
  // Divisor horizontal
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.divider,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Botón Google
  googleButton: {
    backgroundColor: colors.background.surface,
    borderWidth: 1.2,
    borderColor: colors.border.light,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  googleButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footerHighlight: {
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default LoginScreen;
