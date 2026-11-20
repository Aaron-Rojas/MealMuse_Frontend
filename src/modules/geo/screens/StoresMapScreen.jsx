import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorCode, getLocation, getNearbyStores, getStoreRoute } from '../../../services/api';
import { isOnline } from '../../../services/connectivity';
import { getCurrentCoordinates } from '../../../services/location';
import { formatDistance, getStoreTypeMeta, sortStoresByDistance } from '../../../services/storesUtils';
import { colors } from '../../../theme/colors';
import { StoreRouteSheet } from '../components/StoreRouteSheet';

let MapComponents = null;
try {
  const maps = require('react-native-maps');
  MapComponents = maps.default
    ? { MapView: maps.default, Marker: maps.Marker, Polyline: maps.Polyline }
    : { MapView: maps.MapView, Marker: maps.Marker, Polyline: maps.Polyline };
} catch {
  MapComponents = null;
}

export const StoresMapScreen = ({ navigation }) => {
  const [status, setStatus] = useState('loading');
  const [stores, setStores] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState('');
  const [radio, setRadio] = useState(1500);
  const [mapAvailable, setMapAvailable] = useState(Boolean(MapComponents));
  const permissionAsked = useRef(false);

  const loadManualLocation = async () => {
    try {
      const location = await getLocation();
      if (location?.latitud != null && location?.longitud != null) {
        return { latitud: Number(location.latitud), longitud: Number(location.longitud) };
      }
    } catch (caught) {
      setError(caught?.message || 'No se pudo cargar tu ubicación manual.');
    }
    return null;
  };

  const loadNearby = useCallback(async (nextRadio = radio, nextOrigin = origin) => {
    if (!nextOrigin) return;
    setStatus('loading');
    setError('');
    try {
      const data = await getNearbyStores({
        lat: nextOrigin.latitud,
        lng: nextOrigin.longitud,
        radio_m: nextRadio,
      });
      setStores(sortStoresByDistance(data));
      setStatus(Array.isArray(data) && data.length ? 'ready' : 'empty');
    } catch (caught) {
      const code = getErrorCode(caught);
      if (caught?.status === 503 && code === 'MAPS_QUOTA_EXCEEDED') {
        setError(caught?.message || 'Se alcanzó el límite temporal de mapas.');
      } else if (caught?.status === 503 || caught?.status === 502) {
        setError('El servicio de mapas no está disponible en este momento.');
      } else {
        setError(caught?.message || 'No se pudieron cargar los comercios cercanos.');
      }
      setStatus('error');
    }
  }, [origin, radio]);

  const initialize = useCallback(async () => {
    setStatus('loading');
    setError('');
    permissionAsked.current = false;

    const online = await isOnline();
    if (!online) {
      setStatus('offline');
      return;
    }

    Alert.alert(
      'Usar mi ubicación',
      'MealMuse solicitará tu ubicación para mostrar comercios cercanos y calcular rutas.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => permissionAsked.current = true },
        {
          text: 'Continuar',
          onPress: async () => {
            permissionAsked.current = true;
            const coordinates = await getCurrentCoordinates();
            let resolved = 'latitud' in coordinates ? coordinates : null;
            if (!resolved) resolved = await loadManualLocation();
            if (!resolved) {
              setStatus('needs-location');
              return;
            }
            setOrigin(resolved);
            await loadNearby(radio, resolved);
          },
        },
      ]
    );
  }, [loadNearby, radio]);

  useFocusEffect(
    useCallback(() => {
      void initialize();
      return () => {
        setSelectedStore(null);
        setRoute(null);
      };
    }, [initialize])
  );

  const chooseRoute = async (store) => {
    if (!origin) return;
    setSelectedStore(store);
    setRoute(null);
    try {
      const nextRoute = await getStoreRoute(store.id, {
        lat: origin.latitud,
        lng: origin.longitud,
      });
      setRoute(nextRoute);
    } catch (caught) {
      const code = getErrorCode(caught);
      if (caught?.status === 503 && code === 'MAPS_QUOTA_EXCEEDED') {
        setError(caught?.message || 'Se alcanzó el límite temporal de mapas.');
      } else if (caught?.status === 503 || caught?.status === 502) {
        setError('El servicio de mapas no está disponible en este momento.');
      } else {
        setError(caught?.message || 'No se pudo calcular la ruta.');
      }
    }
  };

  const renderStore = ({ item }) => {
    const meta = getStoreTypeMeta(item.tipo);
    return (
      <TouchableOpacity
        style={styles.storeItem}
        onPress={() => chooseRoute(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.nombre}, ${meta.label}, ${formatDistance(item.distancia_m)}`}
      >
        <View style={styles.storeTitleRow}>
          <Text style={styles.storeIcon}>{meta.icon}</Text>
          <Text style={styles.storeName}>{item.nombre}</Text>
        </View>
        <Text style={styles.storeMeta}>{meta.label} · {formatDistance(item.distancia_m)}</Text>
        <Text style={styles.storeAddress}>{item.direccion}</Text>
        {item.referencial ? <Text style={styles.reference}>Dato referencial</Text> : null}
      </TouchableOpacity>
    );
  };

  const header = (
    <View style={styles.headerBar}>
      <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Volver">
        <Text style={styles.backIcon}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Tiendas cercanas</Text>
    </View>
  );

  if (status === 'offline') {
    return <SafeAreaView style={styles.safeArea}>{header}<View style={styles.centerState}><Text style={styles.stateTitle}>Sin conexión</Text><TouchableOpacity style={styles.actionButton} onPress={initialize}><Text style={styles.actionText}>Reintentar</Text></TouchableOpacity></View></SafeAreaView>;
  }

  if (status === 'needs-location') {
    return <SafeAreaView style={styles.safeArea}>{header}<View style={styles.centerState}><Text style={styles.stateTitle}>Necesitamos tu ubicación</Text><Text style={styles.stateText}>Elige tu distrito para buscar comercios cercanos.</Text><TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Ubicacion', { fromMap: true })}><Text style={styles.actionText}>Elegir mi distrito</Text></TouchableOpacity></View></SafeAreaView>;
  }

  if (status === 'loading') {
    return <SafeAreaView style={styles.safeArea}>{header}<View style={styles.centerState} accessibilityRole="alert"><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Buscando comercios cercanos…</Text></View></SafeAreaView>;
  }

  if (status === 'error') {
    return <SafeAreaView style={styles.safeArea}>{header}<View style={styles.centerState}><Text style={styles.stateTitle}>{error}</Text><TouchableOpacity style={styles.actionButton} onPress={() => loadNearby()}><Text style={styles.actionText}>Reintentar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setStatus('ready')}><Text style={styles.secondaryText}>Seguir viendo la lista</Text></TouchableOpacity></View></SafeAreaView>;
  }

  if (status === 'empty') {
    return <SafeAreaView style={styles.safeArea}>{header}<View style={styles.centerState}><Text style={styles.stateTitle}>No hay comercios cercanos</Text><TouchableOpacity style={styles.actionButton} onPress={() => { setRadio(3000); void loadNearby(3000, origin); }}><Text style={styles.actionText}>Ampliar a 3 km</Text></TouchableOpacity></View></SafeAreaView>;
  }

  const MapView = MapComponents?.MapView;
  const Marker = MapComponents?.Marker;
  const Polyline = MapComponents?.Polyline;
  const routeCoordinates = Array.isArray(route?.polilinea)
    ? route.polilinea.map((point) => ({ latitude: point.latitud, longitude: point.longitud }))
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {header}
      {mapAvailable && MapView ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: origin?.latitud,
            longitude: origin?.longitud,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          onMapReady={() => setMapAvailable(true)}
          onError={() => setMapAvailable(false)}
        >
          {origin ? <Marker coordinate={{ latitude: origin.latitud, longitude: origin.longitud }} title="Mi ubicación" description="Origen" /> : null}
          {stores.map((store) => {
            const meta = getStoreTypeMeta(store.tipo);
            return (
              <Marker
                key={store.id}
                coordinate={{ latitude: store.latitud, longitude: store.longitud }}
                title={`${meta.icon} ${store.nombre}`}
                description={`${meta.label}${store.referencial ? ' · Dato referencial' : ''}`}
                onPress={() => chooseRoute(store)}
              />
            );
          })}
          {routeCoordinates.length ? <Polyline coordinates={routeCoordinates} strokeColor={colors.primary} strokeWidth={5} /> : null}
        </MapView>
      ) : (
        <View style={styles.mapFallback}><Text style={styles.mapFallbackText}>Mapa no disponible. Puedes usar la lista.</Text></View>
      )}
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      {selectedStore ? (
        <StoreRouteSheet store={selectedStore} route={route} onClose={() => { setSelectedStore(null); setRoute(null); }} />
      ) : (
        <View style={styles.listWrap}>
          <Text style={styles.listTitle}>Comercios encontrados</Text>
          <FlatList data={stores} keyExtractor={(item) => String(item.id)} renderItem={renderStore} showsVerticalScrollIndicator={false} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.main },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backIcon: { fontSize: 34, lineHeight: 34, color: colors.text.primary },
  headerTitle: { flex: 1, fontSize: 28, fontWeight: '700', color: colors.text.primary },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 21, fontWeight: '700', color: colors.text.primary, textAlign: 'center', marginBottom: 10 },
  stateText: { color: colors.text.secondary, textAlign: 'center', marginTop: 10 },
  actionButton: { minHeight: 44, borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 18, justifyContent: 'center', marginTop: 12 },
  actionText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, marginTop: 4 },
  secondaryText: { color: colors.primary, fontWeight: '700' },
  map: { height: 260, width: '100%' },
  mapFallback: { height: 70, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  mapFallbackText: { color: colors.primary, fontWeight: '600' },
  listWrap: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  listTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  storeItem: { borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: '#fff', padding: 12, marginBottom: 8 },
  storeTitleRow: { flexDirection: 'row', alignItems: 'center' },
  storeIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, color: colors.primary, textAlign: 'center', lineHeight: 28, fontWeight: '800', marginRight: 8 },
  storeName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text.primary },
  storeMeta: { color: colors.primary, fontWeight: '700', marginTop: 6 },
  storeAddress: { color: colors.text.secondary, marginTop: 3 },
  reference: { color: colors.status.expiringText, fontWeight: '600', marginTop: 4 },
  errorBanner: { color: colors.error.text, backgroundColor: colors.error.background, padding: 10, textAlign: 'center' },
});
