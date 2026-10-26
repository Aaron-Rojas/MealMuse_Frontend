import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { deleteFavorite, generateRecipe, getCachedFavorites, listFavorites, saveFavorite } from '../../../services/api';
import { isRecipeFavorite } from '../../../services/favoritesUtils';
import { normalizeMissingIngredients } from '../../../services/favoritesUtils';
import { getCaloriesLabel, getSafetyMessage } from '../../../services/recipeUtils';
import { colors } from '../../../theme/colors';
import { NutritionCard } from '../components/NutritionCard';

export const RecipeSuggestionScreen = ({ navigation, route }) => {
  const [recipe, setRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('preparacion');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [favorites, setFavorites] = useState(() => getCachedFavorites() || []);
  const [favoritesError, setFavoritesError] = useState('');
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const favoriteUpdateLock = useRef(false);

  const loadFavorites = useCallback(async () => {
    setFavoritesError('');
    try {
      const data = await listFavorites({ refresh: true });
      setFavorites(data);
    } catch (error) {
      console.warn('loadFavorites:', error);
      setFavoritesError(error?.message || 'No se pudieron cargar tus favoritas.');
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
    if (route?.params?.recipe) {
      setRecipe(route.params.recipe);
      setActiveTab('preparacion');
      setIsLoading(false);
      setErrorMessage('');
      return;
    }
    fetchRecipe();
  }, [fetchRecipe, route?.params?.recipe]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const favoriteRecipe = recipe?.nombre ? favorites.find((item) => (item?.nombre || item?.receta?.nombre) === recipe.nombre) : null;
  const isFavorite = !!favoriteRecipe || isRecipeFavorite(recipe, favorites);

  const toggleFavorite = async () => {
    if (!recipe?.nombre || favoriteUpdateLock.current) return;

    const previousFavorites = [...favorites];
    const removingFavorite = isFavorite;
    if (removingFavorite && !favoriteRecipe?.id) {
      Alert.alert('No se pudo actualizar', 'No se encontró el identificador de esta receta favorita.');
      return;
    }

    const nextFavorites = removingFavorite
      ? favorites.filter((item) => (item?.nombre || item?.receta?.nombre) !== recipe.nombre)
      : [...favorites, { nombre: recipe.nombre, receta: recipe }];

    favoriteUpdateLock.current = true;
    setFavorites(nextFavorites);
    setIsUpdatingFavorite(true);

    try {
      if (removingFavorite) {
        await deleteFavorite(favoriteRecipe.id);
      } else {
        const savedFavorite = await saveFavorite(recipe);
        setFavorites((current) => [
          ...current.filter((item) => (item?.nombre || item?.receta?.nombre) !== recipe.nombre),
          savedFavorite,
        ]);
      }
    } catch (error) {
      if (removingFavorite && error?.status === 404) {
        setFavorites(nextFavorites);
        return;
      }
      setFavorites(previousFavorites);
      Alert.alert('No se pudo actualizar', error?.message || 'La receta no pudo actualizarse en favoritos.');
    } finally {
      favoriteUpdateLock.current = false;
      setIsUpdatingFavorite(false);
    }
  };

  const handleAnotherRecipe = () => {
    fetchRecipe(recipe?.nombre);
  };

  const caloriesText = getCaloriesLabel(recipe?.calorias ?? recipe?.nutricion?.calorias_kcal);
  const safeText = getSafetyMessage(Boolean(recipe?.apto_para_alergias));
  const missingIngredients = normalizeMissingIngredients(recipe?.ingredientes_faltantes || []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receta sugerida</Text>
        <TouchableOpacity
          onPress={toggleFavorite}
          style={styles.favoriteButton}
          disabled={!recipe?.nombre || isUpdatingFavorite}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>{isFavorite ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>
      {favoritesError ? (
        <TouchableOpacity style={styles.favoriteErrorBanner} onPress={loadFavorites}>
          <Text style={styles.favoriteErrorText}>{favoritesError} Toca para reintentar.</Text>
        </TouchableOpacity>
      ) : null}

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

          <View style={styles.badgeRow}><Text style={styles.badgeText}>{safeText}</Text></View>
          <NutritionCard recipe={recipe} />

          <View style={styles.tabsRow}>
            {['preparacion', 'ingredientes', 'faltantes'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'preparacion' ? 'Preparación' : tab === 'ingredientes' ? 'Ingredientes' : `Faltantes${missingIngredients.length ? ` (${missingIngredients.length})` : ''}`}
                </Text>
              </TouchableOpacity>
            ))}
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
          ) : activeTab === 'ingredientes' ? (
            <View style={styles.listContainer}>
              {(recipe.ingredientes || []).map((ingredient, index) => (
                <View key={`${ingredient}-${index}`} style={styles.ingredientItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {missingIngredients.length ? (
                missingIngredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={styles.ingredientCopy}>
                      <Text style={styles.ingredientText}>{ingredient.nombre}</Text>
                      {ingredient.cantidad != null || ingredient.unidad ? (
                        <Text style={styles.secondaryText}>
                          {[ingredient.cantidad, ingredient.unidad]
                            .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
                            .join(' ')}
                        </Text>
                      ) : null}
                      {ingredient.nota ? <Text style={styles.secondaryText}>{ingredient.nota}</Text> : null}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyMissingState}>
                  <Text style={styles.emptyMissingIcon}>✓</Text>
                  <Text style={styles.emptyMissingText}>Tienes todos los ingredientes</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction} onPress={toggleFavorite} disabled={isUpdatingFavorite}>
              <Text style={styles.secondaryActionText}>{isFavorite ? '⭐ Guardada' : 'Favoritos'}</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.background.main },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backIcon: { fontSize: 34, lineHeight: 34, fontWeight: '300', color: colors.text.primary },
  headerTitle: { flex: 1, fontSize: 28, fontWeight: '700', color: colors.text.primary },
  content: { padding: 18, paddingBottom: 30 },
  heroCard: { backgroundColor: '#F6E7E2', borderRadius: 18, padding: 18, marginBottom: 14 },
  recipeName: { fontSize: 28, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  summaryItem: { backgroundColor: '#E9F7EE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, color: colors.primary, fontWeight: '600', fontSize: 12, overflow: 'hidden' },
  badgeRow: { backgroundColor: '#EAF6EE', padding: 12, borderRadius: 12, marginBottom: 12 },
  badgeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#EFF0EF', borderRadius: 12, padding: 4, marginBottom: 14 },
  tabButton: { flex: 1, minHeight: 44, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: '#fff' },
  tabText: { color: colors.text.secondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  listContainer: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 12, borderWidth: 1, borderColor: colors.border.light },
  stepRow: { flexDirection: 'row', marginBottom: 14 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, color: colors.primary, fontWeight: '700', textAlign: 'center', lineHeight: 28, marginRight: 10 },
  stepText: { flex: 1, color: colors.text.primary, lineHeight: 22 },
  ingredientItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  bullet: { fontSize: 22, color: colors.primary, marginRight: 8, marginTop: -4 },
  ingredientText: { color: colors.text.primary, fontSize: 15, fontWeight: '500' },
  ingredientCopy: { flex: 1 },
  secondaryText: { color: colors.text.secondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', marginTop: 18, gap: 12 },
  secondaryAction: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center' },
  secondaryActionText: { color: colors.primary, fontWeight: '700' },
  primaryAction: { flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  primaryActionText: { color: '#fff', fontWeight: '700' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: colors.text.secondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  emptyText: { color: colors.text.secondary, textAlign: 'center', marginBottom: 16 },
  favoriteButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.border.light },
  favoriteErrorBanner: { marginHorizontal: 18, marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: colors.error.background },
  favoriteErrorText: { color: colors.error.text, textAlign: 'center' },
  favoriteIcon: { fontSize: 22, color: colors.text.secondary },
  favoriteIconActive: { color: colors.status.warning },
  emptyMissingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  emptyMissingIcon: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  emptyMissingText: { marginTop: 8, color: colors.text.primary, fontWeight: '600' },
});

export default RecipeSuggestionScreen;
