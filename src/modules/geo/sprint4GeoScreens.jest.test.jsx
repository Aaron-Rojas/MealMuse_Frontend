import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => require('react').useEffect(() => callback(), [callback]),
}));

jest.mock('../../services/api', () => ({
  getDistricts: jest.fn(),
  getLocation: jest.fn(),
  updateLocation: jest.fn(),
  getNearbyStores: jest.fn(),
  getStoreRoute: jest.fn(),
  getErrorCode: jest.fn((error) => error?.code || null),
}));

jest.mock('../../services/connectivity', () => ({
  isOnline: jest.fn(),
}));

jest.mock('../../services/location', () => ({
  getCurrentCoordinates: jest.fn(),
}));

jest.mock('../../store/profileStore', () => ({
  useProfileStore: {
    getState: () => ({
      saveLocation: jest.fn(async (districtId) => ({ district_id: districtId })),
    }),
  },
}));

import { LocationSetupScreen } from './screens/LocationSetupScreen';
import { StoresMapScreen } from './screens/StoresMapScreen';
import { getDistricts, getLocation, getNearbyStores } from '../../services/api';
import { isOnline } from '../../services/connectivity';
import { getCurrentCoordinates } from '../../services/location';

beforeEach(() => {
  jest.clearAllMocks();
});

test('LocationSetup busca, selecciona y limita referencia a 255 caracteres', async () => {
  getDistricts.mockResolvedValue([
    { id: 'uuid-1', nombre: 'Miraflores', provincia: 'Lima' },
    { id: 'uuid-2', nombre: 'Callao', provincia: 'Callao' },
  ]);
  getLocation.mockResolvedValue({ district_id: 'uuid-1', direccion_referencia: '' });
  const view = await render(<LocationSetupScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />);

  await waitFor(() => expect(view.getByText('Miraflores')).toBeTruthy());
  await act(async () => {
    fireEvent.changeText(view.getByLabelText('Buscar distrito'), 'Callao');
  });
  await waitFor(() => expect(view.getAllByText('Callao').length).toBeGreaterThan(0));
  await waitFor(() => expect(view.queryByText('Miraflores')).toBeNull());

  const reference = 'x'.repeat(260);
  await act(async () => {
    fireEvent.changeText(view.getByLabelText('Dirección de referencia'), reference);
  });
  expect(view.getByLabelText('Dirección de referencia').props.value).toHaveLength(255);
  fireEvent.press(view.getAllByText('Callao').at(-1));
  expect(view.getByLabelText('Guardar ubicación')).toBeTruthy();
});

test('StoresMap muestra Sin conexión y Reintentar sin pedir permiso', async () => {
  isOnline.mockResolvedValue(false);
  const view = await render(<StoresMapScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />);

  await waitFor(() => expect(view.getByText('Sin conexión')).toBeTruthy());
  expect(getCurrentCoordinates).not.toHaveBeenCalled();
  expect(getNearbyStores).not.toHaveBeenCalled();
  expect(view.getByText('Reintentar')).toBeTruthy();
});

test('StoresMap sin ubicación ofrece Elegir mi distrito', async () => {
  isOnline.mockResolvedValue(true);
  getCurrentCoordinates.mockResolvedValue({ motivo: 'denegado' });
  getLocation.mockResolvedValue({ latitud: null, longitud: null });
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.[1]?.onPress?.();
  });
  const navigation = { goBack: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
  const view = await render(<StoresMapScreen navigation={navigation} />);

  await waitFor(() => expect(view.getByText('Elegir mi distrito')).toBeTruthy());
  fireEvent.press(view.getByText('Elegir mi distrito'));
  expect(navigation.navigate).toHaveBeenCalledWith('Ubicacion', { fromMap: true });
});
