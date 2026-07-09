
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Pressable,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/NavBar/BottomNav';

const STORAGE_KEY = 'trip_history';

const TripHistoryScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Carregar viagens do AsyncStorage ao montar a tela
  useEffect(() => {
    loadTrips();
  }, []);

  // Adicionar nova viagem se chegar via params
  useEffect(() => {
    if (route.params?.newTrip) {
      addTrip(route.params.newTrip);
    }
  }, [route.params?.newTrip]);

  const loadTrips = async () => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        setTrips(JSON.parse(storedTrips));
      }
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    }
  };

  const saveTrips = async (newTrips) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips));
      setTrips(newTrips);
    } catch (error) {
      console.error('Erro ao salvar viagens:', error);
    }
  };

  const addTrip = async (newTrip) => {
    try {
      // Primeiro carrega as viagens atuais do storage
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      let currentTrips = storedTrips ? JSON.parse(storedTrips) : [];
      
      // Verifica se a viagem já existe
      const exists = currentTrips.some(trip => trip.id === newTrip.id);
      if (!exists) {
        currentTrips = [newTrip, ...currentTrips];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentTrips));
        setTrips(currentTrips);
      }
    } catch (error) {
      console.error('Erro ao adicionar viagem:', error);
    }
  };

  // Função para abrir o modal com detalhes da viagem
  const handleTripPress = (trip) => {
    setSelectedTrip(trip);
    setModalVisible(true);
  };

  // Função para excluir uma viagem
  const handleDeleteTrip = (tripId, event) => {
    // Parar a propagação para não abrir o modal de detalhes
    event.stopPropagation();
    
    Alert.alert(
      'Excluir Viagem',
      'Tem certeza que deseja excluir essa viagem do histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: () => {
            const updatedTrips = trips.filter(trip => trip.id !== tripId);
            saveTrips(updatedTrips);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTÓRICO DE VIAGENS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="route" size={60} color="#D9D9D9" />
            <Text style={styles.emptyText}>Nenhuma viagem registrada</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => handleTripPress(trip)}
            >
              <View style={styles.tripHeader}>
                <Text style={styles.tripDate}>{trip.date}</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    onPress={(e) => handleDeleteTrip(trip.id, e)}
                    style={styles.deleteButton}
                  >
                    <MaterialIcons name="delete" size={22} color="#D32F2F" />
                  </TouchableOpacity>
                  <MaterialIcons name="keyboard-arrow-right" size={24} color="#666" />
                </View>
              </View>
              
              <View style={styles.routeContainer}>
                <View style={styles.routeLine}>
                  <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                  <Text style={styles.routeText} numberOfLines={2}>
                    {trip.startLocation}
                  </Text>
                </View>
                
                <View style={styles.routeLine}>
                  <MaterialIcons name="location-on" size={20} color="#FF5722" />
                  <Text style={styles.routeText} numberOfLines={2}>
                    {trip.endLocation}
                  </Text>
                </View>
              </View>

              <View style={styles.tripInfoRow}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="straighten" size={16} color="#FFCF00" />
                  <Text style={styles.infoText}>{trip.distance}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="timer" size={16} color="#FFCF00" />
                  <Text style={styles.infoText}>{trip.duration}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* Modal com detalhes da viagem */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Viagem</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={26} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.detailDate}>{selectedTrip.date}</Text>
                
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Rota</Text>
                  <View style={styles.detailRoute}>
                    <View style={styles.detailRouteItem}>
                      <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                      <Text style={styles.detailRouteText}>{selectedTrip.startLocation}</Text>
                    </View>
                    <View style={styles.detailRouteItem}>
                      <MaterialIcons name="location-on" size={20} color="#FF5722" />
                      <Text style={styles.detailRouteText}>{selectedTrip.endLocation}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Dados da Viagem</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distância:</Text>
                    <Text style={styles.detailValue}>{selectedTrip.distance}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duração estimada:</Text>
                    <Text style={styles.detailValue}>{selectedTrip.duration}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Estado do Veículo</Text>
                  <View style={styles.statusBox}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.statusText}>{selectedTrip.vehicleStatus}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Manutenção Recomendada</Text>
                  {selectedTrip.maintenanceItems.map((item, index) => (
                    <View key={index} style={styles.maintenanceItem}>
                      <MaterialIcons name="check" size={18} color="#4CAF50" />
                      <Text style={styles.maintenanceText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#ffffff'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000'
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll'
      }
    })
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 20
  },
  tripCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  deleteButton: {
    padding: 4
  },
  tripDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFCF00'
  },
  routeContainer: {
    marginBottom: 12
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  routeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#333'
  },
  emptySpace: {
    height: 100
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 12
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000'
  },
  modalContent: {
    flexGrow: 1
  },
  detailDate: {
    fontSize: 14,
    color: '#FFCF00',
    fontWeight: '700',
    marginBottom: 20
  },
  detailSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12
  },
  detailRoute: {
    marginBottom: 8
  },
  detailRouteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  detailRouteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700'
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600'
  },
  maintenanceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  maintenanceText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  }
});

export default TripHistoryScreen;
