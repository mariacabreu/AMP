
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import API_BASE_URL from '../api';

const HomeScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  
  const [status, setStatus] = useState({
    user_name: loggedUser?.full_name || 'Usuário',
    recommendation: 'Carregando informações...',
    vehicle: null,
    is_premium: loggedUser?.is_premium || false
  });

  useEffect(() => {
    fetchUserStatus();
  }, [route.params?.user]);

  const fetchUserStatus = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const response = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      
      let isPremium = loggedUser?.is_premium || false;
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/user/${userId}`);
        isPremium = userResponse.data.is_premium;
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
      
      setStatus({
        ...response.data,
        is_premium: isPremium
      });
    } catch (error) {
      console.error('Error fetching status:', error);
      setStatus({
        user_name: loggedUser?.full_name || 'Usuário',
        recommendation: 'Nenhuma recomendação no momento.',
        vehicle: null,
        is_premium: loggedUser?.is_premium || false
      });
    }
  };

  const handlePremiumButton = () => {
    if (!status.is_premium) {
      navigation.navigate('PremiumPlan', { user: loggedUser });
    }
  };

  return (
    <View style={styles.container}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Text style={styles.welcomeText}>BEM VINDO, {status.user_name.toUpperCase()}!</Text>

        <View style={styles.recommendationCard}>
          <Image source={require('../assets/mow376om-7sjpz1g.png')} style={styles.lampIcon} />
          <Text style={styles.recommendationText}>{status.recommendation}</Text>
        </View>

        <View style={styles.buttonGrid}>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('OBD', { user: loggedUser })}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="engine-outline" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>OBD</Text>
              <Text style={styles.gridButtonSub}>Diagnóstico de Bordo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={status.is_premium ? () => Alert.alert('Recurso Desbloqueado', 'Recurso Planejar Viagem desbloqueado!') : handlePremiumButton}
            >
              <View style={styles.iconCircle}>
                <FontAwesome5 name="route" size={45} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Planeje sua viagem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('VehicleRegistration', { user: loggedUser })}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="car-info" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Dados do veículo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={status.is_premium ? () => navigation.navigate('MaintenanceTips', { user: loggedUser }) : handlePremiumButton}
            >
              <View style={styles.iconCircle}>
                <FontAwesome5 name="tools" size={45} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Dicas de manutenção</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={status.is_premium ? () => navigation.navigate('PartsCatalog', { user: loggedUser }) : handlePremiumButton}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons name="settings-input-component" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Informações OBD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('Report', { user: loggedUser })}
            >
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

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#FFCF00" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings', { user: loggedUser })}>
          <Ionicons name="settings-sharp" size={24} color="#D9D9D9" />
          <Text style={styles.navText}>Config</Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll'
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#ffffff'
  },
  logo: {
    width: 150,
    height: 50
  },
  headerIcons: {
    flexDirection: 'row'
  },
  iconButton: {
    marginLeft: 15
  },
  topIcon: {
    width: 24,
    height: 24
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center'
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 30,
    textAlign: 'center'
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '100%'
  },
  lampIcon: {
    width: 32,
    height: 34,
    marginRight: 15
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 18
  },
  buttonGrid: {
    width: '100%',
    marginTop: 30
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  gridButton: {
    backgroundColor: '#2C2C2C',
    width: '48%',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140
  },
  iconCircle: {
    marginBottom: 10
  },
  gridIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFCF00'
  },
  gridButtonTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  gridButtonSub: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2
  },
  emptySpace: {
    height: 100
  },
  navBar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#2C2C2C',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
    zIndex: 1000
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4
  },
  navText: {
    color: '#D9D9D9',
    fontSize: 10,
    fontWeight: '800'
  },
  navTextActive: {
    color: '#FFCF00'
  }
});

export default HomeScreen;
