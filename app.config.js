const baseConfig = require('./app.json');

module.exports = ({ config }) => {
  const expoConfig = config || baseConfig.expo;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const plugins = (expoConfig.plugins || []).filter((plugin) =>
    !(Array.isArray(plugin) ? plugin[0] === 'react-native-maps' : plugin === 'react-native-maps')
  );

  if (googleMapsApiKey) {
    plugins.push(['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]);
  } else {
    plugins.push('react-native-maps');
  }

  return { ...expoConfig, plugins };
};
