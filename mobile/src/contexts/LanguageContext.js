import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =========================================================
// 1. DICIONÁRIO DE TRADUÇÕES
// Adicione aqui TODAS as strings do app. A chave (ex: 'config_title')
// é usada no código, o valor é o texto que aparece pro usuário.
// =========================================================
const translations = {
  pt: {
    // Tela de idioma
    language_screen_title: 'Idioma',
    language_screen_subtitle: 'Escolha o idioma do aplicativo',
    save_preferences: 'Salvar Preferências',
    preferences_saved_title: 'Preferências Salvas',
    preferences_saved_message: 'Idioma alterado para',
    ok: 'OK',

    // Navegação / geral (exemplos - expanda conforme suas telas)
    home: 'Início',
    profile: 'Perfil',
    settings: 'Configurações',
    config: 'Config',
    logout: 'Sair',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    search: 'Buscar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',

    // Login / Cadastro (exemplos)
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'E-mail',
    password: 'Senha',
    forgot_password: 'Esqueci minha senha',
  },

  en: {
    language_screen_title: 'Language',
    language_screen_subtitle: 'Choose the app language',
    save_preferences: 'Save Preferences',
    preferences_saved_title: 'Preferences Saved',
    preferences_saved_message: 'Language changed to',
    ok: 'OK',

    home: 'Home',
    profile: 'Profile',
    settings: 'Settings',
    config: 'Settings',
    logout: 'Log out',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    login: 'Log in',
    register: 'Sign up',
    email: 'Email',
    password: 'Password',
    forgot_password: 'Forgot my password',
  },

  es: {
    language_screen_title: 'Idioma',
    language_screen_subtitle: 'Elige el idioma de la aplicación',
    save_preferences: 'Guardar Preferencias',
    preferences_saved_title: 'Preferencias Guardadas',
    preferences_saved_message: 'Idioma cambiado a',
    ok: 'OK',

    home: 'Inicio',
    profile: 'Perfil',
    settings: 'Configuración',
    config: 'Config',
    logout: 'Salir',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    search: 'Buscar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',

    login: 'Iniciar sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgot_password: 'Olvidé mi contraseña',
  },
};

const STORAGE_KEY = '@app_language';

const LanguageContext = createContext();

// =========================================================
// 2. PROVIDER — envolve o App inteiro (ver App.js)
// =========================================================
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('pt');
  const [isLoaded, setIsLoaded] = useState(false);

  // Ao abrir o app, recupera o idioma salvo anteriormente
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && translations[saved]) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.warn('Erro ao carregar idioma salvo:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Troca o idioma e salva no dispositivo
  const setLanguage = async (langCode) => {
    if (!translations[langCode]) return;
    setLanguageState(langCode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, langCode);
    } catch (e) {
      console.warn('Erro ao salvar idioma:', e);
    }
  };

  // Função de tradução: t('home') -> 'Início' / 'Home' / 'Inicio'
  const t = (key) => {
    return translations[language]?.[key] ?? translations['pt'][key] ?? key;
  };

  if (!isLoaded) return null; // evita "flash" com idioma errado ao abrir o app

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// =========================================================
// 3. HOOK — use isso em qualquer tela: const { t, language, setLanguage } = useLanguage();
// =========================================================
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage precisa ser usado dentro de um <LanguageProvider>');
  }
  return context;
};