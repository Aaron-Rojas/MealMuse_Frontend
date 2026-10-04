import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfile, updateProfileRestrictions } from '../../../services/api';
import { colors } from '../../../theme/colors';
import { normalizeAllergies, ALLERGEN_OPTIONS } from '../../../services/recipeUtils';

export const ProfileRestrictionsScreen = ({ navigation }) => {
  const [allergies, setAllergies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const profile = await getProfile();
      const selected = normalizeAllergies(profile?.alergias || []);
      setAllergies(selected);
    } catch (error) {
      const message = error?.message || 'No se pudo cargar tu perfil';
      setErrorMessage(message);
      console.warn('loadProfile', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleAllergy = (item) => {
    setAllergies((current) => {
      if (current.includes(item)) {
        return current.filter((value) => value !== item);
      }
      return [...current, item];
    });
    setErrorMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await updateProfileRestrictions(allergies);
      Alert.alert('Cambios guardados', 'Tus restricciones se han actualizado correctamente.');
      const state = navigation?.getState?.();
      const activeRoute = state?.routes?.[state.index]?.name;
      if (activeRoute === 'Restricciones' && navigation && typeof navigation.goBack === 'function') {
        navigation.goBack();
      }
    } catch (error) {
      const message = error?.message || 'No se pudieron guardar los cambios';
      setErrorMessage(message);
      Alert.alert('No se pudo guardar', 'Revisa la selección e intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const headerText = allergies.length
    ? `Tienes ${allergies.length} restricciones activas`
    : 'Aquí puedes gestionar tus restricciones';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis restricciones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Bloquea ingredientes para decidir recetas más seguras.</Text>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loaderText}>Cargando tus preferencias…</Text>
          </View>
        ) : (
          <>
            <View style={styles.listWrap}>
              {ALLERGEN_OPTIONS.map((item) => {
                const active = allergies.includes(item);
                return (
                  <View key={item} style={[styles.row, active && styles.rowActive]}>
                    <Text style={styles.optionText}>{item}</Text>
                    <Switch
                      value={active}
                      onValueChange={() => toggleAllergy(item)}
                      trackColor={{ true: colors.primary, false: '#D1D5DB' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                );
              })}
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{headerText}</Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Guardar cambios</Text>}
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
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  listWrap: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rowActive: {
    backgroundColor: '#F2FBF6',
  },
  optionText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  noteBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FDF1D7',
  },
  noteText: {
    fontSize: 14,
    color: '#8A5D00',
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },
  saveText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    color: colors.error.text,
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loaderText: {
    color: colors.text.secondary,
  },
});

export default ProfileRestrictionsScreen;
