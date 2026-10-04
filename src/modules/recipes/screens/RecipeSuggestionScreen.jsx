import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateRecipe } from '../../../services/api';
import { getCaloriesLabel, getSafetyMessage } from '../../../services/recipeUtils';
import { colors } from '../../../theme/colors';

const FAVORITES_KEY = 'mealmuse_favorites';

export const RecipeSuggestionScreen = ({ navigation }) => {
  const [recipe, setRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('preparacion');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.warn('loadFavorites:', error);
    }
  }, []);

  const fetchRecipe = useCallback(async (excludeName) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await generateRecipe(excludeName);
      setRecipe(payload || null);
    } catch (error) {
      const message = error?.status === 422
        ? 'No hay una receta compatible con tu despensa y restricciones actuales.'
        : error?.status === 504
          ? 'La receta tardó demasiado en responder. Intenta otra vez.'
          : error?.status === 502
            ? 'Hubo un problema con el proveedor de recetas. Intenta otra vez.'
            : error?.message || 'No se pudo generar la receta';
      setErrorMessage(message);
      setRecipe(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    fetchRecipe();
  }, [loadFavorites, fetchRecipe]);

  const toggleFavorite = async () => {
    if (!recipe?.nombre) return;
    const nextFavorites = favorites.includes(recipe.nombre)
      ? favorites.filter((item) => item !== recipe.nombre)
      : [...favorites, recipe.nombre];
    setFavorites(nextFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  };

  const handleAnotherRecipe = () => {
    fetchRecipe(recipe?.nombre);
  };

  const caloriesText = recipe ? getCaloriesLabel(recipe.calorias) : 'Calorías sin dato';
  const safeText = recipe ? getSafetyMessage(Boolean(recipe.apto_para_alergias)) : 'Sin coincidencias con tus restricciones registradas';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receta sugerida</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loaderText}>Buscando una receta compatible…</Text>
        </View>
      ) : recipe ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.recipeName}>{recipe.nombre}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>{recipe.tiempo_estimado_minutos || 20} min</Text>
              <Text style={styles.summaryItem}>{recipe.porciones || 2} porciones</Text>
              <Text style={styles.summaryItem}>{caloriesText}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>{safeText}</Text>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'preparacion' && styles.tabButtonActive]} onPress={() => setActiveTab('preparacion')}>
              <Text style={[styles.tabText, activeTab === 'preparacion' && styles.tabTextActive]}>Preparación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'ingredientes' && styles.tabButtonActive]} onPress={() => setActiveTab('ingredientes')}>
              <Text style={[styles.tabText, activeTab === 'ingredientes' && styles.tabTextActive]}>Ingredientes</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'preparacion' ? (
            <View style={styles.listContainer}>
              {(recipe.pasos || []).map((step, index) => (
                <View key={`${step}-${index}`} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {(recipe.ingredientes || []).map((ingredient, index) => (
                <View key={`${ingredient}-${index}`} style={styles.ingredientItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction} onPress={toggleFavorite}>
              <Text style={styles.secondaryActionText}>{favorites.includes(recipe.nombre) ? '⭐ Favoritos' : 'Favoritos'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryAction} onPress={handleAnotherRecipe}>
              <Text style={styles.primaryActionText}>Otra receta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No hay receta compatible</Text>
          <Text style={styles.emptyText}>{errorMessage || 'Prueba con otra despensa o revisa tus restricciones.'}</Text>
          <TouchableOpacity style={styles.primaryAction} onPress={() => fetchRecipe()}>
            <Text style={styles.primaryActionText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '300',
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: '#F6E7E2',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryItem: {
    backgroundColor: '#E9F7EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    overflow: 'hidden',
  },
  badgeRow: {
    backgroundColor: '#EAF6EE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EFF0EF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
    color: colors.primary,
    fontSize: 18,
  },
  ingredientText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 12,
    color: colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default RecipeSuggestionScreen;
