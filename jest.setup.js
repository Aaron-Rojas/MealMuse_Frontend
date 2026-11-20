jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', granted: false })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied', granted: false })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: -12.0464, longitude: -77.0428 },
  })),
  hasServicesEnabledAsync: jest.fn(async () => true),
  Accuracy: { Balanced: 3 },
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
  })),
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
