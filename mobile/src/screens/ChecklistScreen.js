import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../api';
import Header from '../components/Header/Header';
import BottomNav from '../components/NavBar/BottomNav';
import ChecklistItemCard from '../components/Checklist/Checklistitemcard';
import EmptyChecklist from '../components/Checklist/Emptychecklist';
import MaintenanceCostModal from '../components/Checklist/Maintenancecostmodal';

// Ordem de prioridade (menor número = mais urgente = aparece primeiro)
const PRIORITY_ORDER = {
  'URGENTE': 0,
  'PRÓXIMOS 30 DIAS': 1,
  'PRÓXIMOS 60 DIAS': 2,
  'PRÓXIMOS 90 DIAS': 3,
};

const getSortedChecklist = (list) => {
  return [...list].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[String(a.priority || '').toUpperCase()] ?? 99;
    const priorityB = PRIORITY_ORDER[String(b.priority || '').toUpperCase()] ?? 99;
    return priorityA - priorityB;
  });
};

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
  const isFetchingRef = useRef(false);

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

        setChecklist(getSortedChecklist(validChecklist));
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
    setModalVisible(true);
  };

  const confirmMarkAsDone = async (costValue) => {
    if (!vehicleId || !selectedItem) return;

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

      await axios.post(`${API_BASE_URL}/vehicle/maintenance`, maintenanceData);

      Alert.alert('Sucesso!', `${item.name || 'Item'} marcado como feito com sucesso!`);

      // 3. Fechar modal primeiro
      setIsMarkingDone(false);
      setModalVisible(false);
      setSelectedItem(null);

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
      <Header
        onLeftIconPress={() => navigation.navigate('Notifications', { user: loggedUser })}
        onRightIconPress={() => navigation.navigate('Profile', { user: loggedUser })}
        avatarUri={loggedUser?.avatar_url}
      />

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
          <EmptyChecklist />
        ) : (
          getSortedChecklist(safeChecklist).map((item) => (
            <ChecklistItemCard
              key={item.id}
              item={item}
              isMarkingDone={isMarkingDone}
              onReminderPress={() => navigation.navigate('Reminders', { user: loggedUser })}
              onMarkDonePress={() => handleMarkAsDone(item)}
            />
          ))
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Checklist" />

      <MaintenanceCostModal
        visible={modalVisible}
        itemName={selectedItem?.name}
        isSubmitting={isMarkingDone}
        onCancel={cancelMarkAsDone}
        onConfirm={confirmMarkAsDone}
      />
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
    paddingBottom: 100,
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
  footerSpace: {
    height: 20,
  },
});

export default ChecklistScreen;