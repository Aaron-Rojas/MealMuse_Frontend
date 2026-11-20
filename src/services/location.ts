import * as Location from 'expo-location';

export type CoordinateReason = 'denegado' | 'GPS apagado' | 'timeout';

export async function getLocationPermissionStatus() {
  return Location.getForegroundPermissionsAsync();
}

export async function requestLocationPermission() {
  return Location.requestForegroundPermissionsAsync();
}

export async function getCurrentCoordinates(): Promise<
  { latitud: number; longitud: number } | { motivo: CoordinateReason }
> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { motivo: 'denegado' };

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return { motivo: 'GPS apagado' };

    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('timeout')), 8000);
    });

    try {
      const position = await Promise.race([locationPromise, timeoutPromise]);
      return { latitud: position.coords.latitude, longitud: position.coords.longitude };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'timeout') return { motivo: 'timeout' };
    return { motivo: 'GPS apagado' };
  }
}
