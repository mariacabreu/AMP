import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

const API_BASE_URL = 'http://localhost:5000';

const HomeScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  
  const [status, setStatus] = useState({
    user_name: loggedUser?.full_name || 'Usuário',
    recommendation: 'Carregando informações...',
    vehicle: null
  });

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const response = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/mow376om-iempala.png')} // New Logo from Figma
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

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcomeText}>BEM VINDO, {status.user_name.toUpperCase()}!</Text>

        <View style={styles.recommendationCard}>
          <Image source={require('../assets/mow376om-7sjpz1g.png')} style={styles.lampIcon} />
          <Text style={styles.recommendationText}>
            {status.recommendation}
          </Text>
        </View>

        <View style={styles.buttonGrid}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.gridButton}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="engine-outline" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>OBD</Text>
              <Text style={styles.gridButtonSub}>Diagnóstico de Bordo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gridButton}>
              <View style={styles.iconCircle}>
                <FontAwesome5 name="route" size={45} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Planeje sua viagem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.gridButton}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="car-info" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Dados do veículo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gridButton}>
              <View style={styles.iconCircle}>
                <FontAwesome5 name="tools" size={45} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Dicas de manutenção</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.gridButton}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="settings-input-component" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Informações OBD</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gridButton}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Histórico</Text>
              <Text style={styles.gridButtonSub}>Relatório de Viagens</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#FFCF00" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Relatório</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <FontAwesome5 name="cog" size={20} color="#D9D9D9" />
          <Text style={styles.navText}>Peças</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-sharp" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Config</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 30,
    textAlign: 'center',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  lampIcon: {
    width: 32,
    height: 34,
    marginRight: 15,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 18,
  },
  buttonGrid: {
    width: '100%',
    marginTop: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridButton: {
    backgroundColor: '#2C2C2C',
    width: '48%',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  iconCircle: {
    marginBottom: 10,
  },
  gridIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFCF00',
  },
  gridButtonTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridButtonSub: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  emptySpace: {
    height: 50,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2C',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  navText: {
    color: '#D9D9D9',
    fontSize: 10,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#FFCF00',
  },
});

export default HomeScreen;
