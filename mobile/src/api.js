import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Para Web, localhost funciona bem no Trae.
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  // Para emuladores Android:
  if (Platform.OS === 'android') {
    // Para emulador oficial: 10.0.2.2
    // Para dispositivo físico: use seu IP local da rede (ex: 192.168.1.100)
    // Para testar, substitua pelo seu IP:
    return 'http://10.0.2.2:5000'; // Emulador Android
    // return 'http://SEU_IP_LOCAL:5000'; // Dispositivo físico (ex: 192.168.1.100)
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getBaseUrl();
export default API_BASE_URL;
