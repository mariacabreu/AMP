import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

const FuelScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    liters: '',
    cost: '',
    km: ''
  });

  useEffect(() => {
    fetchFuelRecords();
  }, []);

  const fetchFuelRecords = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      const vehicleData = statusRes.data.vehicle;
      setVehicle(vehicleData);
      
      if (vehicleData) {
        // Buscar histórico de manutenção e filtrar por combustível
        // Por enquanto, usaremos dados de exemplo
        setFuelRecords([
          { id: 1, date: '2024-07-05', liters: 45.5, cost: 280.00, km: 15200 },
          { id: 2, date: '2024-06-20', liters: 42.0, cost: 260.00, km: 14850 },
          { id: 3, date: '2024-06-05', liters: 48.0, cost: 295.00, km: 14500 }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar registros de combustível:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    try {
      // Salvar novo registro de combustível
      // Por enquanto, só fechamos o modal
      setModalVisible(false);
      setNewRecord({ liters: '', cost: '', km: '' });
      // Atualizar a lista
      await fetchFuelRecords();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
    }
  };

  const calculateAverageConsumption = () => {
    if (fuelRecords.length < 2) return 0;
    const totalLiters = fuelRecords.reduce((sum, r) => sum + parseFloat(r.liters), 0);
    const kmDifference = fuelRecords[0].km - fuelRecords[fuelRecords.length - 1].km;
    if (kmDifference <= 0) return 0;
    return (totalLiters / (kmDifference / 100)).toFixed(2);
  };

  const calculateTotalCost = () => {
    return fuelRecords.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0).toFixed(2);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFCF00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Text style={styles.screenTitle}>COMBUSTÍVEL</Text>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fuel" size={30} color="#FFCF00" />
            <Text style={styles.statValue}>{calculateAverageConsumption()}</Text>
            <Text style={styles.statLabel}>km/L</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="cash" size={30} color="#FFCF00" />
            <Text style={styles.statValue}>R$ {calculateTotalCost()}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        {vehicle && (
          <Text style={styles.vehicleInfo}>
            {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.mileage || 0} km
          </Text>
        )}

        {/* Fuel Records List */}
        <Text style={styles.sectionTitle}>Histórico</Text>
        {fuelRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="fuel" size={50} color="#D9D9D9" />
            <Text style={styles.emptyStateText}>Nenhum registro de combustível.</Text>
          </View>
        ) : (
          fuelRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <MaterialCommunityIcons name="fuel" size={24} color="#FFCF00" />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordLiters}>{record.liters} L</Text>
                  <Text style={styles.recordDate}>{record.date}</Text>
                </View>
              </View>
              <View style={styles.recordRight}>
                <Text style={styles.recordCost}>R$ {record.cost.toFixed(2)}</Text>
                <Text style={styles.recordKm}>{record.km} km</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* FAB to add new record */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="#FFCF00" />
      </TouchableOpacity>

      {/* Add Record Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Abastecimento</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Litros"
              keyboardType="numeric"
              value={newRecord.liters}
              onChangeText={(text) => setNewRecord({...newRecord, liters: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Valor Total (R$)"
              keyboardType="numeric"
              value={newRecord.cost}
              onChangeText={(text) => setNewRecord({...newRecord, cost: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Quilometragem"
              keyboardType="numeric"
              value={newRecord.km}
              onChangeText={(text) => setNewRecord({...newRecord, km: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleSaveRecord}
              >
                <Text style={styles.confirmButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
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
      }
    })
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginVertical: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFCF00',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#D9D9D9',
    marginTop: 5,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 15,
  },
  recordCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordInfo: {
    marginLeft: 15,
  },
  recordLiters: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordCost: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFCF00',
  },
  recordKm: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#D9D9D9',
    fontSize: 16,
    marginTop: 10,
  },
  footerSpace: {
    height: 100,
  },
  fab: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#2C2C2C',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }
    })
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#D9D9D9',
  },
  confirmButton: {
    backgroundColor: '#FFCF00',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
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
  navText: {
    color: '#D9D9D9',
    fontSize: 10,
    fontWeight: '800'
  },
  navTextActive: {
    color: '#FFCF00'
  }
});

export default FuelScreen;
