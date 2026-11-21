import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => require('react').useEffect(() => callback(), [callback]),
}));

jest.mock('../../services/connectivity', () => ({
  isOnline: jest.fn(),
}));

jest.mock('../../services/location', () => ({
  getCurrentCoordinates: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  getLocation: jest.fn(),
  getNearbyStores: jest.fn(),
  getStoreRoute: jest.fn(),
  getErrorCode: jest.fn((error) => error?.code || null),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = (props) => React.createElement(View, props);
  MapView.Marker = (props) => React.createElement(View, props);
  MapView.Polyline = (props) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MapView,
    Marker: MapView.Marker,
    Polyline: MapView.Polyline,
  };
});

import { StoresMapScreen } from './screens/StoresMapScreen';
import { isOnline } from '../../services/connectivity';
import { getCurrentCoordinates } from '../../services/location';
import { getLocation, getNearbyStores, getStoreRoute, getErrorCode } from '../../services/api';

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  canGoBack: jest.fn(() => true),
};

const stores = [
  {
    id: 'store-far',
    nombre: 'Mercado Sur',
    tipo: 'mercado',
    direccion: 'Av. Sur 200',
    latitud: -12.05,
    longitud: -77.04,
    distancia_m: 900,
    referencial: false,
  },
  {
    id: 'store-near',
    nombre: 'Bodega Norte',
    tipo: 'bodega',
    direccion: 'Jr. Norte 100',
    latitud: -12.04,
    longitud: -77.03,
    distancia_m: 350,
    referencial: true,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  isOnline.mockResolvedValue(true);
  getLocation.mockResolvedValue({ latitud: -12.0464, longitud: -77.0428 });
  getCurrentCoordinates.mockResolvedValue({ latitud: -12.0464, longitud: -77.0428 });
  getNearbyStores.mockResolvedValue(stores);
  getStoreRoute.mockResolvedValue({
    store_id: 'store-near',
    polilinea: [],
    distancia_m: 350,
    minutos_estimados: 5,
  });
  getErrorCode.mockImplementation((error) => error?.code || null);
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    const continueButton = buttons?.find((button) => button.text === 'Continuar');
    if (continueButton?.onPress) continueButton.onPress();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderReadyScreen() {
  const view = await render(<StoresMapScreen navigation={navigation} />);
  await waitFor(() => expect(view.getByText('Comercios encontrados')).toBeTruthy());
  return view;
}

test('permiso denegado usa la ubicación manual guardada', async () => {
  getCurrentCoordinates.mockResolvedValue({ motivo: 'denegado' });
  getLocation.mockResolvedValue({ latitud: -12.1, longitud: -77.1 });

  await renderReadyScreen();

  expect(getLocation).toHaveBeenCalled();
  expect(getNearbyStores).toHaveBeenCalledWith({
    lat: -12.1,
    lng: -77.1,
    radio_m: 1500,
  });
});

test('lista ordenada por distancia muestra dato referencial', async () => {
  getNearbyStores.mockResolvedValue([stores[0], stores[1]]);
  const view = await renderReadyScreen();

  const names = view.getAllByText(/Bodega Norte|Mercado Sur/);
  expect(names[0].props.children).toBe('Bodega Norte');
  expect(view.getByText(/350 m/)).toBeTruthy();
  expect(view.getByText(/900 m/)).toBeTruthy();
  expect(view.getByText('Dato referencial')).toBeTruthy();
});

test('lista vacía amplía a 3 km y reconsulta con radio_m=3000', async () => {
  getNearbyStores
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([stores[1]]);

  const view = await render(<StoresMapScreen navigation={navigation} />);
  await waitFor(() => expect(view.getByText('Ampliar a 3 km')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByText('Ampliar a 3 km'));
  });

  await waitFor(() => expect(view.getByText('Bodega Norte')).toBeTruthy());
  expect(getNearbyStores).toHaveBeenLastCalledWith({
    lat: -12.0464,
    lng: -77.0428,
    radio_m: 3000,
  });
});

test('MAPS_QUOTA_EXCEEDED conserva la lista y muestra reintentar', async () => {
  getStoreRoute.mockRejectedValue({
    status: 503,
    code: 'MAPS_QUOTA_EXCEEDED',
    message: 'La cuota de mapas se agotó temporalmente.',
  });
  getErrorCode.mockImplementation((error) => error?.code);
  const view = await renderReadyScreen();

  await act(async () => {
    fireEvent.press(view.getByText('Bodega Norte'));
  });

  await waitFor(() => {
    expect(view.getByText('La cuota de mapas se agotó temporalmente.')).toBeTruthy();
  });
  expect(view.getByText('Bodega Norte')).toBeTruthy();
  expect(view.getByText('Reintentar')).toBeTruthy();
});

test('elegir comercio pide ruta y muestra distancia y minutos', async () => {
  getStoreRoute.mockResolvedValue({
    store_id: 'store-near',
    polilinea: [],
    distancia_m: 350,
    minutos_estimados: 5,
  });
  const view = await renderReadyScreen();

  await act(async () => {
    fireEvent.press(view.getByText('Bodega Norte'));
  });

  await waitFor(() => expect(view.getByText('350 m')).toBeTruthy());
  expect(getStoreRoute).toHaveBeenCalledWith('store-near', {
    lat: -12.0464,
    lng: -77.0428,
  });
  expect(view.getByText('5 min a pie')).toBeTruthy();
  expect(view.getByText('Bodega Norte')).toBeTruthy();
  expect(view.getByText('Jr. Norte 100')).toBeTruthy();
});

test('Abrir en Google Maps usa enlace peatonal', async () => {
  const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const view = await renderReadyScreen();

  await act(async () => {
    fireEvent.press(view.getByText('Bodega Norte'));
  });
  await waitFor(() => expect(view.getByText('Abrir en Google Maps')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByText('Abrir en Google Maps'));
  });

  expect(openUrl).toHaveBeenCalledWith(
    'https://www.google.com/maps/dir/?api=1&destination=-12.04,-77.03&travelmode=walking'
  );
});
