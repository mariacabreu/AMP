import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import BottomNav from '../NavBar/BottomNav';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSelectionScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  // When language is selected, apply it immediately!
  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode);
  };

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>IDIOMA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {t('language_screen_subtitle')}
        </Text>

        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageCard,
              language === lang.code && styles.selectedCard
            ]}
            onPress={() => handleSelectLanguage(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={[
              styles.languageName,
              language === lang.code && styles.selectedName
            ]}>
              {lang.name}
            </Text>
            {language === lang.code && (
              <MaterialCommunityIcons
                name="check-circle"
                size={28}
                color="#FFCF00"
              />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Config" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      },
      default: {
        flex: 1
      }
    })
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    zIndex: 2,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    bottom: 16,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 60,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'scroll' }
    })
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedCard: {
    backgroundColor: '#FFCF0020',
    borderColor: '#FFCF00'
  },
  flag: {
    fontSize: 32,
    marginRight: 16
  },
  languageName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  selectedName: {
    fontWeight: '800'
  },
  footerSpace: {
    height: 50
  }
});

export default LanguageSelectionScreen;