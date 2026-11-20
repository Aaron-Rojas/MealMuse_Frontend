import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { buildGoogleMapsDirectionsUrl, formatDistance, formatWalkingTime } from '../../../services/storesUtils';

export const StoreRouteSheet = ({ store, route, onClose }) => {
  if (!store) return null;

  const openInMaps = () => {
    if (typeof Linking.openURL === 'function') {
      void Linking.openURL(buildGoogleMapsDirectionsUrl(store));
    }
  };

  return (
    <View style={styles.sheet} accessibilityRole="summary">
      <Text style={styles.name}>{store.nombre}</Text>
      <Text style={styles.address}>{store.direccion}</Text>
      {route ? (
        <View style={styles.routeRow}>
          <Text style={styles.routeText}>{formatDistance(route.distancia_m)}</Text>
          <Text style={styles.routeText}>{formatWalkingTime(route.minutos_estimados)}</Text>
        </View>
      ) : null}
      {store.referencial ? <Text style={styles.reference}>Dato referencial</Text> : null}
      <TouchableOpacity
        style={styles.mapsButton}
        onPress={openInMaps}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${store.nombre} en Google Maps`}
      >
        <Text style={styles.mapsText}>Abrir en Google Maps</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar detalles de ruta"
      >
        <Text style={styles.closeText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.background.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, borderTopWidth: 1, borderColor: colors.border.light },
  name: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  address: { color: colors.text.secondary, marginTop: 4 },
  routeRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  routeText: { color: colors.primary, fontWeight: '700' },
  reference: { marginTop: 8, color: colors.status.expiringText, fontWeight: '600' },
  mapsButton: { minHeight: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  mapsText: { color: '#fff', fontWeight: '700' },
  closeButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  closeText: { color: colors.text.secondary, fontWeight: '600' },
});
