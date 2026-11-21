import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDistricts, getLocation, updateLocation } from '../../../services/api';
import { useProfileStore } from '../../../store/profileStore';
import { colors } from '../../../theme/colors';

export const LocationSetupScreen = ({ navigation, route }) => {
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getDistricts(), getLocation()])
      .then(([nextDistricts, location]) => {
        if (!active) return;
        setDistricts(Array.isArray(nextDistricts) ? nextDistricts : []);
        setSelectedId(location?.district_id ?? '');
        setReference(location?.direccion_referencia ?? '');
      })
      .catch((caught) => setError(caught?.message || 'No se pudo cargar la ubicación'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return districts.filter((district) =>
      !term || `${district.nombre} ${district.provincia}`.toLowerCase().includes(term)
    );
  }, [districts, search]);

  const save = async () => {
    if (!selectedId) {
      setError('Selecciona un distrito');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await useProfileStore.getState().saveLocation(selectedId, reference);
      Alert.alert('Ubicación guardada', 'Tu distrito se guardó correctamente.');
      if (route?.params?.fromMap && navigation?.canGoBack?.()) navigation.goBack();
      else navigation?.navigate?.('Tiendas');
    } catch (caught) {
      setError(caught?.message || 'No se pudo guardar la ubicación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Volver">
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi ubicación</Text>
      </View>
      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.primary} /><Text style={styles.loaderText}>Cargando distritos…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar distrito"
            style={styles.search}
            accessibilityLabel="Buscar distrito"
          />
          <View style={styles.referenceWrap}>
            <Text style={styles.label}>Dirección de referencia</Text>
            <TextInput
              value={reference}
              onChangeText={(text) => setReference(text.slice(0, 255))}
              style={styles.referenceInput}
              multiline
              maxLength={255}
              accessibilityLabel="Dirección de referencia"
            />
            <Text style={styles.counter}>{reference.length}/255</Text>
          </View>
          {filtered.map((district) => (
            <TouchableOpacity
              key={district.id}
              style={[styles.district, selectedId === district.id && styles.districtActive]}
              onPress={() => { setSelectedId(district.id); setError(''); }}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedId === district.id }}
              accessibilityLabel={`${district.nombre}, ${district.provincia}`}
            >
              <Text style={styles.province}>{district.provincia}</Text>
              <Text style={styles.districtName}>{district.nombre}</Text>
            </TouchableOpacity>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Guardar ubicación"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.main },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backIcon: { fontSize: 34, lineHeight: 34, color: colors.text.primary },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text.primary },
  content: { padding: 18, paddingBottom: 30 },
  search: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: '#fff', paddingHorizontal: 14, marginBottom: 14 },
  referenceWrap: { marginBottom: 14 },
  label: { fontWeight: '600', color: colors.text.primary, marginBottom: 6 },
  referenceInput: { minHeight: 72, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: '#fff', padding: 12, textAlignVertical: 'top' },
  counter: { textAlign: 'right', color: colors.text.secondary, marginTop: 4 },
  district: { minHeight: 58, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: '#fff', paddingHorizontal: 14, marginBottom: 8 },
  districtActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  province: { fontSize: 12, color: colors.text.secondary },
  districtName: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  error: { color: colors.error.text, textAlign: 'center', marginTop: 10 },
  saveButton: { height: 52, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.7 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 10, color: colors.text.secondary },
});
