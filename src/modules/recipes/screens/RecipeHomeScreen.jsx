import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPantry, getProfile } from '../../../services/api';
import { colors } from '../../../theme/colors';

const FAVORITES_KEY = 'mealmuse_favorites';

export const RecipeHomeScreen = ({ navigation, onOpenRestrictions }) => {
  const [profileName, setProfileName] = useState('Esther');
  const [pantryItems, setPantryItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      const nextName = profile?.nombre || profile?.displayName || 'Esther';
      setProfileName(nextName || 'Esther');
    } catch (error) {
      console.warn('loadProfile:', error);
    }
  }, []);

  const loadPantry = useCallback(async () => {
    try {
      const pantry = await getPantry();
      setPantryItems(Array.isArray(pantry) ? pantry : []);
    } catch (error) {
      console.warn('loadPantry:', error);
      setPantryItems([]);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.warn('loadFavorites:', error);
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      await Promise.allSettled([loadProfile(), loadPantry(), loadFavorites()]);
      setIsLoading(false);
    };
    bootstrap();
  }, [loadProfile, loadPantry, loadFavorites]);

  const expiringSoon = pantryItems.filter((item) => {
    if (!item?.fecha_caducidad) return false;
    const expireDate = new Date(item.fecha_caducidad);
    if (Number.isNaN(expireDate.getTime())) return false;
    const diffDays = Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 5;
  });

  const handleSuggestRecipe = () => {
    if (!pantryItems.length) {
      Alert.alert('Sin ingredientes en la despensa', 'Agrega productos antes de pedir una receta sugerida.');
      return;
    }
    navigation.navigate('Receta');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Hola, {profileName}</Text>
        <Text style={styles.subGreeting}>¿Qué preparamos hoy?</Text>

        {expiringSoon.length > 0 ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>{expiringSoon.length} ingredientes por vencer</Text>
            <Text style={styles.warningSubtitle}>Espirina, tomate y huevos vencen esta semana</Text>
          </View>
        ) : null}

        <View style={styles.primaryCard}>
          <View style={styles.primaryIconWrap}>
            <Text style={styles.primaryIcon}>✦</Text>
          </View>
          <Text style={styles.primaryTitle}>Sugerir receta</Text>
          <Text style={styles.primarySubtitle}>Basada en tu despensa y tus alergias</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSuggestRecipe}>
            <Text style={styles.primaryButtonText}>Generar ahora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.favoriteSection}>
          <Text style={styles.sectionTitle}>Recetas favoritas</Text>
          <View style={styles.favoriteGrid}>
            {favorites.length ? (
              favorites.map((favorite) => (
                <TouchableOpacity key={favorite} style={styles.favoriteCard}>
                  <Text style={styles.favoriteName}>{favorite}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyFavoriteCard}>
                <Text style={styles.emptyFavoriteText}>Aún no guardas favoritos</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={() => onOpenRestrictions?.() || navigation.navigate('Restricciones')}>
          <Text style={styles.settingsText}>Mis restricciones</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 12,
  },
  subGreeting: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 18,
  },
  warningCard: {
    backgroundColor: '#FDE8E8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  warningTitle: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 16,
  },
  warningSubtitle: {
    color: '#9A3A3A',
    marginTop: 4,
  },
  primaryCard: {
    backgroundColor: '#2E9461',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 18,
    marginBottom: 20,
    alignItems: 'center',
  },
  primaryIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryIcon: {
    fontSize: 28,
    color: '#fff',
  },
  primaryTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 26,
    marginBottom: 8,
  },
  primarySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  favoriteSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  favoriteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  favoriteCard: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptyFavoriteCard: {
    width: '100%',
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  emptyFavoriteText: {
    color: colors.text.secondary,
  },
  settingsButton: {
    marginTop: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  settingsText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default RecipeHomeScreen;
