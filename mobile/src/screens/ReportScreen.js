import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';
import Header from '../components/Header/Header';
import CostChart from '../components/Report/CostChart';
import HistoryHeader from '../components/Report/HistoryHeader';
import CostCard from '../components/Report/CostCard';
import ReportEmptyState from '../components/Report/ReportEmptyState';
import CostDetailModal from '../components/Report/CostDetailModal';
import UseReport, { formatDate } from '../components/Report/UseReport';

const ReportScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const {
    loading,
    filterType,
    setFilterType,
    isEditingMode,
    isDeletingMode,
    toggleEditingMode,
    toggleDeletingMode,
    reportData,
    realHistory,
    chartData,
    periodTotal,
    currentMonthYear,
    handleDeleteItem,
  } = UseReport(loggedUser);

  // ----- Estado do Header (igual à HomeScreen) -----
  const [status, setStatus] = useState({
    user_name: loggedUser?.full_name || 'Usuário',
    is_premium: loggedUser?.is_premium || false,
  });
  const [profileForm, setProfileForm] = useState({
    full_name: loggedUser?.full_name || '',
    email: loggedUser?.email || '',
    phone: loggedUser?.phone || '',
  });
  const [avatarUri, setAvatarUri] = useState(loggedUser?.avatar_url || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [planType, setPlanType] = useState(loggedUser?.plan_type || null);
  const [vehicles, setVehicles] = useState([]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const vehicleCount = vehicles.length;

  useEffect(() => {
    fetchUserStatus();
    fetchNotifications();
  }, [route.params?.user]);

  const fetchUserStatus = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const response = await axios.get(`${API_BASE_URL}/user/status/${userId}`);

      let isPremium = loggedUser?.is_premium || false;
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/user/${userId}`);
        isPremium = userResponse.data.is_premium;
        setPlanType(userResponse.data.plan_type || null);
      } catch (err) {
        console.error('Error fetching user details:', err);
      }

      const vehiclesData = Array.isArray(response.data?.vehicles)
        ? response.data.vehicles
        : response.data?.vehicle
        ? [response.data.vehicle]
        : [];
      setVehicles(vehiclesData);

      setStatus((prev) => ({
        ...prev,
        ...response.data,
        is_premium: isPremium,
      }));
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const res = await axios.get(`${API_BASE_URL}/user/notifications/${userId}`);
      const notifData = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setNotifications(notifData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePhoto = () => {
    Alert.alert('Alterar foto', 'Conecte o expo-image-picker aqui para trocar a foto do perfil.');
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const userId = loggedUser?.id || 1;
      await axios.put(`${API_BASE_URL}/user/${userId}`, {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      setStatus((prev) => ({ ...prev, user_name: profileForm.full_name }));
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas informações agora.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAddVehicle = () => {
    navigation.navigate('VehicleRegistration', { user: loggedUser });
  };

  // ----- Handlers do relatório -----
  const handleEditItem = (item) => {
    const isGasoline = item.item.includes('Gasolina');
    if (isGasoline) {
      navigation.navigate('ReportForm', {
        user: loggedUser,
        vehicleId: reportData.vehicle_id,
        editItem: item,
      });
    } else {
      navigation.navigate('MaintenanceEdit', {
        user: loggedUser,
        editItem: item,
      });
    }
  };

  const handleAddCost = () => {
    navigation.navigate('ReportForm', { user: loggedUser, vehicleId: reportData.vehicle_id });
  };

  const openDetailModal = (item) => {
    setSelectedDetailItem(item);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedDetailItem(null);
  };

  const handleCardPress = (item) => {
    if (isEditingMode) {
      handleEditItem(item);
    } else if (!isDeletingMode) {
      openDetailModal(item);
    }
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
        notificationCount={unreadCount}
        onMarkAllAsRead={markAllAsRead}
        profileForm={profileForm}
        onChangeField={handleProfileFieldChange}
        onChangePhoto={handleChangePhoto}
        onSaveProfile={handleSaveProfile}
        savingProfile={savingProfile}
        onLogout={handleLogout}
        isPremium={status.is_premium}
        planType={planType}
        vehicleCount={vehicleCount}
        vehicles={vehicles}
        onAddVehicle={handleAddVehicle}
      />

      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Text style={styles.screenTitle}>CONTROLE DE CUSTOS</Text>

        <CostChart
          chartData={chartData}
          periodTotal={periodTotal}
          filterType={filterType}
          onChangeFilterType={setFilterType}
          currentMonthYear={currentMonthYear}
        />

        <HistoryHeader
          isEditingMode={isEditingMode}
          isDeletingMode={isDeletingMode}
          onToggleEditing={toggleEditingMode}
          onToggleDeleting={toggleDeletingMode}
          onAddPress={handleAddCost}
        />

        {realHistory.length === 0 ? (
          <ReportEmptyState onAddPress={handleAddCost} />
        ) : (
          realHistory.map((item) => (
            <CostCard
              key={item.id}
              item={item}
              isEditingMode={isEditingMode}
              isDeletingMode={isDeletingMode}
              formatDate={formatDate}
              onPress={handleCardPress}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          ))
        )}

        <View style={styles.emptySpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />

      <CostDetailModal
        visible={detailModalVisible}
        item={selectedDetailItem}
        formatDate={formatDate}
        onClose={closeDetailModal}
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
      },
    }),
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backRow: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  backButton: {
    padding: 5,
    alignSelf: 'flex-start',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptySpace: {
    height: 100,
  },
});

export default ReportScreen;