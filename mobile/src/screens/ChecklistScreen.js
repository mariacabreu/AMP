import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

  // ----- Estado do Header (notificações + perfil) -----
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [avatarUri, setAvatarUri] = useState(loggedUser?.avatar_url || null);
  const [profileForm, setProfileForm] = useState({
    full_name: loggedUser?.full_name || loggedUser?.name || '',
    email: loggedUser?.email || '',
    phone: loggedUser?.phone || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [isPremium, setIsPremium] = useState(!!loggedUser?.is_premium);
  const [planType, setPlanType] = useState(loggedUser?.plan_type || null);
  const [vehicle, setVehicle] = useState(null);

  // Garantir que checklist sempre seja um array
  const safeChecklist = Array.isArray(checklist) ? checklist : [];

  useEffect(() => {
    fetchChecklist();
    fetchNotifications();
  }, []);

  const fetchChecklist = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      const userId = loggedUser?.id || 1;
      const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      const vehicleData = statusRes.data?.vehicle;
      const vehiclesData = statusRes.data?.vehicles;

      // Atualiza dados de perfil vindos do backend, se existirem
      if (statusRes.data?.user) {
        const u = statusRes.data.user;
        setProfileForm({
          full_name: u.full_name || u.name || '',
          email: u.email || '',
          phone: u.phone || ''
        });
        setAvatarUri(u.avatar_url || null);
        setIsPremium(!!u.is_premium);
        setPlanType(u.plan_type || null);
      }

      const selectedVehicle = Array.isArray(vehiclesData) ? vehiclesData[0] : vehicleData;
      setVehicle(selectedVehicle);

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

  // ----- Notificações -----
  const fetchNotifications = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const res = await axios.get(`${API_BASE_URL}/user/notifications/${userId}`);
      const data = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setNotifications(data);
      setNotificationCount(data.filter((n) => !n.read).length);
    } catch (error) {
      // Endpoint pode não existir ainda; falha silenciosa pra não travar a tela
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationCount(0);
    try {
      const userId = loggedUser?.id || 1;
      await axios.patch(`${API_BASE_URL}/user/notifications/${userId}/read-all`);
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
    }
  };

  // ----- Perfil -----
  const handleChangeField = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePhoto = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para trocar a foto.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        // Set as data URI (base64)
        const base64Uri = `data:image/jpeg;base64,${selectedImage.base64}`;
        setAvatarUri(base64Uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const userId = loggedUser?.id || 1;
      const updateData = { ...profileForm };
      // Include avatar if it's been changed
      if (avatarUri) {
        updateData.avatar = avatarUri;
      }
      await axios.patch(`${API_BASE_URL}/user/${userId}`, updateData);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVehicle = () => {
    navigation.navigate('AddVehicle', { user: loggedUser });
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          // Limpe aqui qualquer token/estado de sessão salvo (AsyncStorage, contexto, etc.)
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }]
          });
        }
      }
    ]);
  };

  // ----- Checklist -----
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
        avatarUri={avatarUri}
        notifications={notifications}
        notificationCount={notificationCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        profileForm={profileForm}
        onChangeField={handleChangeField}
        onChangePhoto={handleChangePhoto}
        onSaveProfile={handleSaveProfile}
        savingProfile={savingProfile}
        onLogout={handleLogout}
        isPremium={isPremium}
        planType={planType}
        vehicle={vehicle}
        navigation={navigation}
        loggedUser={loggedUser}
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