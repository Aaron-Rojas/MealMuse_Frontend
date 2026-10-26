import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getPantrySummary, listFavorites, getProfile } from '../../../services/api';
import { colors } from '../../../theme/colors';

export const RecipeHomeScreen = ({ navigation, onOpenRestrictions }) => {
  const [profileName, setProfileName] = useState('Esther');
  const [summary, setSummary] = useState({ por_vencer: 0, vencidos: 0 });
  const [favorites, setFavorites] = useState([]);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      const nextName = profile?.nombre || profile?.displayName || 'Esther';
      setProfileName(nextName || 'Esther');
    } catch (error) {
      console.warn('loadProfile:', error);
    }
  }, []);

  const loadPantrySummary = useCallback(async () => {
    try {
      const nextSummary = await getPantrySummary();
      setSummary({
        por_vencer: Number(nextSummary?.por_vencer || 0),
        vencidos: Number(nextSummary?.vencidos || 0),
      });
    } catch (error) {
      console.warn('loadPantrySummary:', error);
      setSummary({ por_vencer: 0, vencidos: 0 });
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await listFavorites();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('loadFavorites:', error);
      setFavorites([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadPantrySummary();
      loadFavorites();
    }, [loadProfile, loadPantrySummary, loadFavorites])
  );

  const handleSuggestRecipe = () => {
    navigation.navigate('Receta');
  };

  const bannerPorVencer = summary.por_vencer > 0
    ? `Tienes ${summary.por_vencer} ingrediente${summary.por_vencer === 1 ? '' : 's'} por vencer`
    : null;

  const bannerVencidos = summary.vencidos > 0
    ? `${summary.vencidos} ingrediente${summary.vencidos === 1 ? '' : 's'} vencido${summary.vencidos === 1 ? '' : 's'}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Hola, {profileName}</Text>
        <Text style={styles.subGreeting}>¿Qué preparamos hoy?</Text>

        {bannerPorVencer ? (
          <TouchableOpacity style={styles.warningCard} onPress={() => navigation.navigate('Despensa')}>
            <Text style={styles.warningTitle}>{bannerPorVencer}</Text>
            <Text style={styles.warningSubtitle}>Toca para revisar tu despensa.</Text>
          </TouchableOpacity>
        ) : null}

        {bannerVencidos ? (
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>{bannerVencidos}</Text>
            <Text style={styles.warningSubtitle}>Revisa los productos caducados antes de cocinar.</Text>
          </View>
        ) : null}

        <View style={styles.primaryCard}>
          <View style={styles.primaryIconWrap}><Text style={styles.primaryIcon}>✦</Text></View>
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
              favorites.slice(0, 4).map((favorite) => (
                <TouchableOpacity key={favorite.id ?? favorite.nombre} style={styles.favoriteCard} onPress={() => navigation.navigate('Receta', { recipe: favorite.receta || favorite })}>
                  <Text style={styles.favoriteName}>{favorite.nombre || favorite.receta?.nombre || 'Receta guardada'}</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.background.main },
  content: { paddingHorizontal: 18, paddingVertical: 18, paddingBottom: 32 },
  greeting: { fontSize: 32, fontWeight: '700', color: colors.text.primary, marginTop: 12 },
  subGreeting: { fontSize: 18, color: colors.text.secondary, marginBottom: 18 },
  warningCard: { backgroundColor: colors.status.expiringBackground, borderRadius: 14, padding: 14, marginBottom: 12 },
  dangerCard: { backgroundColor: colors.status.expiredBackground, borderRadius: 14, padding: 14, marginBottom: 12 },
  warningTitle: { color: colors.status.expiringText, fontWeight: '700', fontSize: 16 },
  dangerTitle: { color: colors.status.expiredText, fontWeight: '700', fontSize: 16 },
  warningSubtitle: { color: '#9A3A3A', marginTop: 4 },
  primaryCard: { backgroundColor: '#2E9461', borderRadius: 18, paddingVertical: 28, paddingHorizontal: 18, marginBottom: 20, alignItems: 'center' },
  primaryIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  primaryIcon: { fontSize: 28, color: '#fff' },
  primaryTitle: { color: '#fff', fontWeight: '700', fontSize: 26, marginBottom: 8 },
  primarySubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 18, textAlign: 'center' },
  primaryButton: { backgroundColor: '#fff', width: '100%', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.primary, fontWeight: '700', fontSize: 18 },
  favoriteSection: { marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 10 },
  favoriteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  favoriteCard: { width: '48%', backgroundColor: '#F7F7F7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border.light },
  favoriteName: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  emptyFavoriteCard: { width: '100%', backgroundColor: '#F4F4F4', borderWidth: 1, borderColor: colors.border.light, borderRadius: 12, padding: 18, alignItems: 'center' },
  emptyFavoriteText: { color: colors.text.secondary },
  settingsButton: { marginTop: 22, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center' },
  settingsText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});

export default RecipeHomeScreen;
