import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

const MaintenanceTipsScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const [vehicleInfo, setVehicleInfo] = useState('');

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      const vehicleId = statusRes.data.vehicle?.id;
      
      if (vehicleId) {
        const response = await axios.get(`${API_BASE_URL}/vehicle/maintenance-tips/${vehicleId}`);
        setTips(response.data.tips);
        setVehicleInfo(response.data.vehicle);
      }
    } catch (error) {
      console.error('Erro ao buscar dicas de manutenção:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFCF00" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DICAS DE MANUTENÇÃO</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo Scrollable */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Text style={styles.vehicleText}>{vehicleInfo}</Text>
        <Text style={styles.subtitle}>Dicas personalizadas para o seu veículo.</Text>

        {tips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="lightbulb-outline" size={60} color="#FFCF00" />
            <Text style={styles.emptyText}>Nenhuma dica disponível no momento.</Text>
          </View>
        ) : (
          tips.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FFCF00" />
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
              </View>
              <Text style={styles.itemContent}>{item.content}</Text>
            </View>
          ))
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />
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
        overflow: 'hidden',
      },
      default: {
        flex: 1,
      }
    })
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      }
    })
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFCF00',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  itemCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  itemContent: {
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
    textAlign: 'justify',
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
});

export default MaintenanceTipsScreen;
