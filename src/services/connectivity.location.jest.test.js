jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { isOnline } from './connectivity';
import { getCurrentCoordinates, getLocationPermissionStatus, requestLocationPermission } from './location';

beforeEach(() => {
  jest.clearAllMocks();
});

test('connectivity devuelve true solo con una red utilizable', async () => {
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  await expect(isOnline()).resolves.toBe(true);
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });
  await expect(isOnline()).resolves.toBe(false);
});

test('connectivity falla de forma segura sin cerrar la app', async () => {
  Network.getNetworkStateAsync.mockRejectedValue(new Error('network'));
  await expect(isOnline()).resolves.toBe(true);
});

test('location consulta estado y solicita permiso solo al invocarlo', async () => {
  Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: false, status: 'denied' });
  await expect(getLocationPermissionStatus()).resolves.toEqual({ granted: false, status: 'denied' });
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true, status: 'granted' });
  await expect(requestLocationPermission()).resolves.toEqual({ granted: true, status: 'granted' });
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
});

test('location devuelve coordenadas sin persistirlas', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  Location.hasServicesEnabledAsync.mockResolvedValue(true);
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: -12.1, longitude: -77.0 } });
  await expect(getCurrentCoordinates()).resolves.toEqual({ latitud: -12.1, longitud: -77.0 });
});

test('location informa permiso denegado', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });
  await expect(getCurrentCoordinates()).resolves.toEqual({ motivo: 'denegado' });
});
