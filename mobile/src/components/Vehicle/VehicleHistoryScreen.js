import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Modal, Image, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../api';
import BottomNav from '../NavBar/BottomNav';

const VehicleHistoryScreen = ({ navigation, route }) => {
  const { vehicleId, user } = route.params || { vehicleId: 1, user: null };
  
  const [oilKm, setOilKm] = useState('');
  const [beltKm, setBeltKm] = useState('');
  const [brakeKm, setBrakeKm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSaveHistory = async () => {
    console.log('Salvando histórico do veículo:', vehicleId);
    if (!oilKm) {
      Alert.alert('Aviso', 'Por favor, informe pelo menos a última troca de óleo.');
      return;
    }

    const history = [
      { item: 'Troca de Óleo', last_km: parseInt(oilKm) },
    ];
    
    if (beltKm) history.push({ item: 'Troca de Correia', last_km: parseInt(beltKm) });
    if (brakeKm) history.push({ item: 'Troca de Pastilhas', last_km: parseInt(brakeKm) });

    try {
      const response = await axios.post(`${API_BASE_URL}/vehicle/maintenance`, {
        vehicle_id: vehicleId,
        history: history
      });
      
      console.log('Histórico salvo com sucesso:', response.data);
      setShowModal(true);
      
    } catch (error) {
      console.error('Erro ao salvar histórico:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível salvar o histórico.');
    }
  };

  const handleFinish = () => {
    setShowModal(false);
    navigation.navigate('Home', { user: user });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        <Text style={styles.title}>Histórico do Veículo</Text>
        <Text style={styles.subtitle}>
          Para recomendações precisas, precisamos saber quando foram as últimas manutenções.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Km da última troca de óleo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 80000"
              value={oilKm}
              onChangeText={setOilKm}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Km da última troca de correia (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 60000"
              value={beltKm}
              onChangeText={setBeltKm}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Km da última troca de pastilhas (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 75000"
              value={brakeKm}
              onChangeText={setBrakeKm}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveHistory}>
            <Text style={styles.saveButtonText}>Finalizar e ir para Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.modalLogo}
              resizeMode="contain"
            />
            <Text style={styles.modalTitle}>Conta Criada!</Text>
            <Text style={styles.modalText}>
              Seu cadastro foi finalizado com sucesso. Bem-vindo ao AMP!
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleFinish}>
              <Text style={styles.modalButtonText}>Ir para Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} user={user} activeScreen="Config" />
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
      },
      default: {
        flex: 1,
      }
    })
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
        height: '100%',
      }
    })
  },
  scrollContent: {
     flexGrow: 1,
     paddingHorizontal: 20,
     paddingVertical: 60,
     paddingBottom: 100,
     alignItems: 'center',
   },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e1e1e',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  saveButton: {
    backgroundColor: '#2b2b2b',
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalLogo: {
    width: 150,
    height: 100,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e1e1e',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#2b2b2b',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navBar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#2b2b2b',
    height: 70,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#D9D9D9',
    marginTop: 4,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#FFCF00',
  },
});

export default VehicleHistoryScreen;
