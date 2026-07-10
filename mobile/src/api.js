import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Para Web, localhost funciona bem no Trae.
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  // Para Android: servidor local no dispositivo
  if (Platform.OS === 'android') {
    return 'http://127.0.0.1:5000';
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getBaseUrl();
export default API_BASE_URL;
