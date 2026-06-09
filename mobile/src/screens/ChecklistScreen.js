import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';

const ChecklistScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [vehicleInfo, setVehicleInfo] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      const vehicleId = statusRes.data.vehicle?.id;
      
      if (vehicleId) {
        // Usando o endpoint de IA para recomendações personalizadas
        const response = await axios.get(`${API_BASE_URL}/vehicle/checklist/ai/${vehicleId}`);
        setChecklist(response.data.checklist.map(item => ({ ...item, checked: false })));
        setVehicleInfo(`${response.data.vehicle} (${response.data.mileage} km)`);
      }
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENTE':
        return '#FF4444';
      case 'PRÓXIMOS 30 DIAS':
        return '#FF8C00';
      case 'PRÓXIMOS 60 DIAS':
        return '#1E90FF';
      case 'PRÓXIMOS 90 DIAS':
        return '#32CD32';
      default:
        return '#666';
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
        scrollEnabled={true}
      >
        <Text style={styles.screenTitle}>CHECKLIST PREVENTIVO</Text>
        <Text style={styles.vehicleText}>{vehicleInfo}</Text>
        <Text style={styles.subtitle}>Baseado na quilometragem e histórico informado.</Text>

        {checklist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-decagram" size={60} color="#FFCF00" />
            <Text style={styles.emptyText}>Tudo em dia! Nenhuma manutenção preventiva necessária agora.</Text>
          </View>
        ) : (
          checklist.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <TouchableOpacity 
                  style={[styles.checkbox, item.checked && styles.checkboxChecked]} 
                  onPress={() => toggleCheck(item.id)}
                >
                  {item.checked && <MaterialCommunityIcons name="check" size={20} color="#000" />}
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.textContainer}>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                  <Text style={styles.reasonTitle}>POR QUE TROCAR?</Text>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
                <Image source={{ uri: item.image_url }} style={styles.partImage} resizeMode="contain" />
              </View>
            </View>
          ))
        )}

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
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="clipboard-check" size={24} color="#FFCF00" />
          <Text style={[styles.navText, styles.navTextActive]}>Checklist</Text>
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
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      }
    })
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 100, // Espaço para não cobrir o conteúdo com a barra
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 5,
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
    padding: 15,
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
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FFCF00',
    borderColor: '#FFCF00',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  priorityBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  descriptionText: {
    fontSize: 11,
    color: '#000',
    lineHeight: 14,
    textAlign: 'justify',
    marginBottom: 8,
  },
  reasonTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 10,
    color: '#444',
    lineHeight: 12,
    textAlign: 'justify',
  },
  partImage: {
    width: 80,
    height: 80,
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

export default ChecklistScreen;
