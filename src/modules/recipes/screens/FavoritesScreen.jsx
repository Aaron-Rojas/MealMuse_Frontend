import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { deleteFavorite, getCachedFavorites, getFavorite, listFavorites } from '../../../services/api';
import { colors } from '../../../theme/colors';

export const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState(() => getCachedFavorites() || []);
  const [isLoading, setIsLoading] = useState(() => !getCachedFavorites()?.length);
  const [errorMessage, setErrorMessage] = useState('');

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(!getCachedFavorites()?.length);
      setErrorMessage('');
      const data = await listFavorites({ refresh: true });
      setFavorites(data);
    } catch (error) {
      console.warn('loadFavorites:', error);
      setErrorMessage(error?.message || 'No se pudieron cargar tus favoritas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const openFavorite = async (favorite) => {
    try {
      if (favorite?.receta?.nombre) {
        navigation.navigate('Receta', { recipe: favorite.receta });
        return;
      }

      if (!favorite?.id) {
        throw new Error('La receta favorita no incluye un identificador');
      }
      const detailed = await getFavorite(favorite.id);
      if (!detailed?.receta?.nombre) {
        throw new Error('La receta favorita no incluye sus datos completos');
      }
      navigation.navigate('Receta', { recipe: detailed.receta });
    } catch (error) {
      console.warn('openFavorite:', error);
      Alert.alert('No se pudo abrir', 'La receta favorita no está disponible en este momento.');
    }
  };

  const handleDelete = (favorite) => {
    Alert.alert('Eliminar favorita', `¿Quieres quitar "${favorite?.nombre || 'esta receta'}" de tus favoritos?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFavorite(favorite.id);
            setFavorites((current) => current.filter((item) => item.id !== favorite.id));
          } catch (error) {
            console.warn('deleteFavorite:', error);
            if (error?.status === 404) {
              setFavorites((current) => current.filter((item) => item.id !== favorite.id));
              return;
            }
            Alert.alert('Error', 'No se pudo quitar esta receta de favoritos.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const recipe = item?.receta || {};
    const calories = recipe?.nutricion?.calorias_kcal ?? recipe?.calorias ?? null;
    const timeLabel = recipe?.tiempo_estimado_minutos ? `${recipe.tiempo_estimado_minutos} min` : 'Receta guardada';
    const caloriesLabel = calories !== null && calories !== undefined && Number.isFinite(Number(calories))
      ? ` • ${Math.round(Number(calories))} kcal`
      : '';

    return (
      <View style={styles.row}>
        <TouchableOpacity activeOpacity={0.8} style={styles.content} onPress={() => openFavorite(item)}>
          <Text style={styles.name}>{item?.nombre || recipe?.nombre || 'Receta guardada'}</Text>
          <Text style={styles.meta}>{timeLabel}{caloriesLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${item?.nombre || 'esta receta'} de favoritos`}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack?.()) navigation.goBack();
            else navigation.navigate('AppTabs', { tab: 'Recetas' });
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis favoritas</Text>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Cargando tus favoritas…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={loadFavorites}>
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !favorites.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aún no tienes recetas favoritas</Text>
          <Text style={styles.emptyText}>Guarda recetas desde el detalle para verlas aquí.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('AppTabs', { tab: 'Recetas' })}>
            <Text style={styles.primaryButtonText}>Ir a Inicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.main },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backIcon: { fontSize: 34, lineHeight: 34, fontWeight: '300', color: colors.text.primary },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text.primary },
  listContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: 12, marginBottom: 10, paddingRight: 10 },
  content: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  meta: { color: colors.text.secondary, marginTop: 4 },
  deleteButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error.background },
  deleteText: { color: colors.error.text, fontWeight: '700' },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { marginTop: 10, color: colors.text.secondary },
  errorText: { color: colors.error.text, textAlign: 'center', marginBottom: 12 },
  primaryButton: { backgroundColor: colors.primary, minHeight: 44, justifyContent: 'center', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  emptyText: { color: colors.text.secondary, textAlign: 'center', marginTop: 8, marginBottom: 18 },
});
