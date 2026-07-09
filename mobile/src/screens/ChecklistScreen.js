import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

const ChecklistScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [vehicleId, setVehicleId] = useState(null);
  const [currentMileage, setCurrentMileage] = useState(0);
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rawCost, setRawCost] = useState('');
  const isFetchingRef = useRef(false);

  // Valor formatado para exibição no input
  const formattedCost = useMemo(() => {
    const cleaned = rawCost.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawCost]);

  // Garantir que checklist sempre seja um array
  const safeChecklist = Array.isArray(checklist) ? checklist : [];

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      const userId = loggedUser?.id || 1;
      const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      const vehicle = statusRes.data?.vehicle;
      
      if (vehicle && vehicle.id) {
        setVehicleId(vehicle.id);
        setCurrentMileage(Number(vehicle.mileage) || 0);
        
        // Usando o endpoint de IA para recomendações personalizadas
        const response = await axios.get(`${API_BASE_URL}/vehicle/checklist/ai/${vehicle.id}`);
        const checklistData = Array.isArray(response.data?.checklist) ? response.data.checklist : [];
        
        // Garantir que cada item seja válido
        const validChecklist = checklistData
          .filter(item => item && typeof item === 'object')
          .map((item, index) => ({ 
            id: item && item.id !== undefined && item.id !== null ? item.id : index,
            name: String(item?.name || 'Item de Manutenção'),
            description: String(item?.description || 'Descrição não disponível'),
            reason: String(item?.reason || 'Motivo não disponível'),
            priority: String(item?.priority || 'PRÓXIMOS 30 DIAS')
          }));
        
        setChecklist(validChecklist);
        setVehicleInfo(`${String(response.data?.vehicle || 'Veículo')} (${Number(response.data?.mileage) || 0} km)`);
      } else {
        setChecklist([]);
      }
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
      setChecklist([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };
  
  const handleMarkAsDone = (item) => {
    setSelectedItem(item);
    setRawCost('000');
    setModalVisible(true);
  };

  const confirmMarkAsDone = async () => {
    if (!vehicleId || !selectedItem) return;
    
    // VALIDAÇÃO: Verificar se o custo foi inserido (maior que 0)
    const cleanedCost = rawCost.replace(/[^0-9]/g, '');
    const costValue = cleanedCost.length > 0 ? parseInt(cleanedCost, 10) / 100 : 0;
    
    if (costValue <= 0) {
      Alert.alert('Aviso!', 'Por favor, insira o valor gasto com a manutenção.');
      return;
    }
    
    try {
      setIsMarkingDone(true);
      const item = selectedItem;
      
      // REMOVER O ITEM DA LISTA LOCALMENTE (FEEDBACK INSTANTÂNEO)
      setChecklist(prevChecklist => prevChecklist.filter(i => i.id !== item.id));
      
      // Mapear o item para o campo correspondente no veículo
      let updateData = {};
      
      const itemNameLower = (item.name || '').toLowerCase();
      
      if (itemNameLower.includes('óleo') || itemNameLower.includes('oil')) {
        updateData.last_oil_change = currentMileage;
      } else if (itemNameLower.includes('correia') || itemNameLower.includes('corrente') || itemNameLower.includes('dentada')) {
        updateData.last_belt_change = currentMileage;
      } else if (itemNameLower.includes('freio') || itemNameLower.includes('pastilha')) {
        updateData.last_brake_change = currentMileage;
      }
      
      // 1. Atualizar o veículo
      if (Object.keys(updateData).length > 0) {
        await axios.patch(`${API_BASE_URL}/vehicle/${vehicleId}`, updateData);
      }

      // 2. Salvar no histórico de manutenção
      const maintenanceData = {
        vehicle_id: vehicleId,
        history: [{
          item: item.name || 'Manutenção',
          last_km: currentMileage,
          last_date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
          cost: costValue
        }]
      };
      
      console.log('Dados da manutenção:', maintenanceData);
      
      await axios.post(`${API_BASE_URL}/vehicle/maintenance`, maintenanceData);

      Alert.alert('Sucesso!', `${item.name || 'Item'} marcado como feito com sucesso!`);
      
      // 3. Fechar modal primeiro
      setIsMarkingDone(false);
      setModalVisible(false);
      setSelectedItem(null);
      setRawCost('');
      
      // 4. Atualizar o checklist após o modal fechar (para sincronizar com o servidor)
      setTimeout(async () => {
        await fetchChecklist();
      }, 100);
    } catch (error) {
      console.error('Erro ao marcar como feito:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      Alert.alert('Erro', 'Erro ao marcar como feito. Tente novamente.');
      setIsMarkingDone(false);
      setModalVisible(false);
      setSelectedItem(null);
      // Se deu erro, restaurar o checklist original
      fetchChecklist();
    }
  };

  const cancelMarkAsDone = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setRawCost('');
  };

  const getPriorityColor = (priority) => {
    const safePriority = String(priority || '').toUpperCase();
    switch (safePriority) {
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

        {safeChecklist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-decagram" size={60} color="#FFCF00" />
            <Text style={styles.emptyText}>Tudo em dia! Nenhuma manutenção preventiva necessária agora.</Text>
          </View>
        ) : (
          safeChecklist.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.textContainer}>
                  <Text style={styles.descriptionText}>{item.description || 'Descrição não disponível'}</Text>
                  <Text style={styles.reasonTitle}>POR QUE TROCAR?</Text>
                  <Text style={styles.reasonText}>{item.reason || 'Motivo não disponível'}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.markDoneButton, isMarkingDone && { opacity: 0.5 }]} 
                onPress={() => handleMarkAsDone(item)}
                disabled={isMarkingDone}
              >
                <MaterialCommunityIcons name="check-circle" size={18} color="#FFCF00" />
                <Text style={styles.markDoneText}>{isMarkingDone ? 'Processando...' : 'Marcar como Feito'}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Checklist" />

      {/* Modal de Confirmação */}
      {modalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={cancelMarkAsDone}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <MaterialCommunityIcons name="alert-circle" size={50} color="#FFCF00" />
              <Text style={styles.modalTitle}>Valor da Manutenção</Text>
              <Text style={styles.modalText}>
                Adicione o valor gasto com essa manutenção:
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>R$ </Text>
                <TextInput
                  style={styles.costInput}
                  placeholder="0,00"
                  value={formattedCost}
                  onChangeText={(text) => {
                    // Armazena apenas os dígitos brutos
                    const cleanedText = text.replace(/[^0-9]/g, '');
                    setRawCost(cleanedText);
                  }}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={cancelMarkAsDone}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmMarkAsDone} disabled={isMarkingDone}>
                  {isMarkingDone ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Sim, Concluído</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  markDoneText: {
    color: '#FFCF00',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    ...Platform.select({
      web: {
        maxWidth: 400,
      }
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#2E2E2E',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFCF00',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
  },
  currencyPrefix: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  costInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});

export default ChecklistScreen;
