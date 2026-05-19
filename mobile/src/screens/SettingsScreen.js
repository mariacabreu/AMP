import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);
  const [biometryEnabled, setBiometryEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <Image
          source={require('../assets/mow376om-iempala.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/mow376om-wu018h0.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/mow376om-4s6plsc.png')} style={styles.topIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Scrollable */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.screenTitle}>CONFIGURAÇÕES</Text>

        {/* Notificações */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Desativar Notificações</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#FFCF00" }}
              thumbColor={notificationsDisabled ? "#FFF500" : "#f4f3f4"}
              onValueChange={setNotificationsDisabled}
              value={notificationsDisabled}
            />
          </View>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Lembretes Programáveis</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Frequência dos Lembretes</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Preferências */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Ativar/Desativar Biometria</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#FFCF00" }}
              thumbColor={biometryEnabled ? "#FFF500" : "#f4f3f4"}
              onValueChange={setBiometryEnabled}
              value={biometryEnabled}
            />
          </View>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Autenticação de dois fatores</Text>
            <MaterialCommunityIcons name="check-circle" size={24} color="#2D2D2D" />
          </View>
        </View>

        {/* Ajuda e Suporte */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ajuda e Suporte</Text>
            <MaterialIcons name="info" size={20} color="#2D2D2D" />
          </View>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>FAQ</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Idioma</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Tutorial/Reapresentar Onboarding</Text>
          </TouchableOpacity>
        </View>

        {/* Privacidade e Segurança */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Privacidade e Segurança</Text>
            <MaterialIcons name="lock" size={20} color="#2D2D2D" />
          </View>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Permitir Localização</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#FFCF00" }}
              thumbColor={locationEnabled ? "#FFF500" : "#f4f3f4"}
              onValueChange={setLocationEnabled}
              value={locationEnabled}
            />
          </View>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Política de Termos e Condições</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={[styles.menuLabel, { color: '#FF4444' }]}>Apagar Conta/Apagar Dados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Navigation Bar Fixa na Base */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home', { user: loggedUser })}>
          <Ionicons name="home-outline" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Report', { user: loggedUser })}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Relatório</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PartsCatalog', { user: loggedUser })}>
          <FontAwesome5 name="cog" size={20} color="#D9D9D9" />
          <Text style={styles.navText}>Peças</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Checklist', { user: loggedUser })}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings" size={24} color="#FFCF00" />
          <Text style={[styles.navText, styles.navTextActive]}>Config</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
    backgroundColor: '#fff',
  },
  logo: {
    width: 100,
    height: 50,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  topIcon: {
    width: 30,
    height: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100, // Espaço para não cobrir o conteúdo com a barra
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
    marginVertical: 15,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00000036',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#0000001A',
    marginHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
  },
  footerSpace: {
    height: 20,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    height: 70,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#D9D9D9',
    marginTop: 4,
    fontWeight: '700',
  },
  navTextActive: {
    color: '#FFCF00',
  },
});

export default SettingsScreen;
