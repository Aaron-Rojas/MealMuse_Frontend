import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DespensaScreen } from './src/modules/despensa/screens/DespensaScreen';
import { LoginScreen } from './src/modules/auth/screens/LoginScreen';
import { RegisterScreen } from './src/modules/auth/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

/**
 * App - Configuración Global de Rutas en Stack.Navigator
 * 
 * ¿POR QUÉ?
 * Define la estructura de navegación principal de MelMuse. Establece 'Despensa' como
 * la pantalla principal (Home) según las especificaciones del diseño, manteniendo
 * el acceso a las pantallas de autenticación ('Login' y 'Register').
 * 
 * ¿CÓMO?
 * - `SafeAreaProvider` asegura el cálculo de insets en todos los dispositivos.
 * - `Stack.Navigator` inicializa en `Despensa` con `headerShown: false` para respetar
 *   los encabezados nativos personalizados de cada pantalla.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Despensa"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Despensa" component={DespensaScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
