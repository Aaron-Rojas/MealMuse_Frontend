import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DespensaScreen } from './src/modules/despensa/screens/DespensaScreen';
import { LoginScreen } from './src/modules/auth/screens/LoginScreen';
import { RegisterScreen } from './src/modules/auth/screens/RegisterScreen';
import { RecipeHomeScreen } from './src/modules/recipes/screens/RecipeHomeScreen';
import { RecipeSuggestionScreen } from './src/modules/recipes/screens/RecipeSuggestionScreen';
import { FavoritesScreen } from './src/modules/recipes/screens/FavoritesScreen';
import { ProfileRestrictionsScreen } from './src/modules/profile/screens/ProfileRestrictionsScreen';
import { setAuthenticationExpiredHandler } from './src/services/api';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const AppTabs = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(route?.params?.tab || 'Recetas');

  useEffect(() => {
    setActiveTab(route?.params?.tab || 'Recetas');
  }, [route?.params?.tab]);

  const insets = useSafeAreaInsets();
  const screens = useMemo(
    () => ({
      Despensa: <DespensaScreen navigation={navigation} />,
      Recetas: <RecipeHomeScreen navigation={navigation} onOpenRestrictions={() => navigation.navigate('Restricciones')} />,
      Favoritos: <FavoritesScreen navigation={navigation} />,
      Perfil: <ProfileRestrictionsScreen navigation={navigation} />,
    }),
    [navigation]
  );

  return (
    <View style={styles.tabShell}>
      <View style={styles.tabContent}>{screens[activeTab]}</View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 12 }]}>
        {['Despensa', 'Recetas', 'Favoritos', 'Perfil'].map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={tab}
            >
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function App() {
  useEffect(() => {
    setAuthenticationExpiredHandler(() => {
      if (navigationRef.isReady() && navigationRef.getCurrentRoute()?.name !== 'Login') {
        navigationRef.resetRoot({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => setAuthenticationExpiredHandler(null);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen name="Restricciones" component={ProfileRestrictionsScreen} />
          <Stack.Screen name="Receta" component={RecipeSuggestionScreen} />
          <Stack.Screen name="Favoritos" component={FavoritesScreen} />
          <Stack.Screen name="Despensa" component={DespensaScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabShell: { flex: 1, backgroundColor: colors.background.main },
  tabContent: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  tabButtonActive: { backgroundColor: colors.primaryLight },
  tabLabel: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  tabLabelActive: { color: colors.primary },
});
