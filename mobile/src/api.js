import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Backend em produção (Render)
  return 'https://amp-project-back.onrender.com';
};

const API_BASE_URL = getBaseUrl();

export default API_BASE_URL;