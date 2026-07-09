import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/NavBar/BottomNav';

const LanguageSelectionScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  
  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const [selectedLanguage, setSelectedLanguage] = useState('pt');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Idioma</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Escolha o idioma do aplicativo
        </Text>

        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageCard,
              selectedLanguage === lang.code && styles.selectedCard
            ]}
            onPress={() => setSelectedLanguage(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={[
              styles.languageName,
              selectedLanguage === lang.code && styles.selectedName
            ]}>
              {lang.name}
            </Text>
            {selectedLanguage === lang.code && (
              <MaterialCommunityIcons
                name="check-circle"
                size={28}
                color="#FFCF00"
              />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={() => {
          Alert.alert(
            'Preferências Salvas',
            `Idioma alterado para ${languages.find(l => l.code === selectedLanguage)?.name}`,
            [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]
          );
        }}>
          <Text style={styles.saveButtonText}>Salvar Preferências</Text>
        </TouchableOpacity>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000'
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'scroll' }
    })
  },
  content: {
    paddingHorizontal: 20,
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
  saveButton: {
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: {
    color: '#FFCF00',
    fontSize: 16,
    fontWeight: '800'
  },
  footerSpace: {
    height: 50
  }
});

export default LanguageSelectionScreen;
