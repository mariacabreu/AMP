import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';
import Header from '../components/Header/Header';
import WelcomeBanner from '../components/Home/WelcomeBanner';
import DashboardGrid from '../components/Home/DashboardGrid';
import ProfileModal from '../components/Home/ProfileModal';
import NotificationsModal from '../components/Home/NotificationsModal';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Troca de óleo recomendada',
    description: 'Seu veículo está próximo do prazo ideal para troca de óleo.',
    time: 'Há 2 horas',
    read: false
  },
  {
    id: '2',
    title: 'Diagnóstico OBD concluído',
    description: 'Nenhuma falha crítica encontrada no último escaneamento.',
    time: 'Ontem',
    read: true
  },
  {
    id: '3',
    title: 'Bem-vindo ao app!',
    description: 'Cadastre seu veículo para liberar todas as funcionalidades.',
    time: 'Há 3 dias',
    read: true
  }
];

const HomeScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  const [status, setStatus] = useState({
    user_name: loggedUser?.full_name || 'Usuário',
    recommendation: 'Carregando informações...',
    vehicle: null,
    is_premium: loggedUser?.is_premium || false
  });

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: loggedUser?.full_name || '',
    email: loggedUser?.email || '',
    phone: loggedUser?.phone || ''
  });
  const [avatarUri, setAvatarUri] = useState(loggedUser?.avatar_url || null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

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
      navigation.navigate('VehicleCompatibility', { user: loggedUser, vehicle: status.vehicle });
    }
  };

  const openProfileModal = () => {
    setProfileForm({
      full_name: loggedUser?.full_name || status.user_name || '',
      email: loggedUser?.email || '',
      phone: loggedUser?.phone || ''
    });
    setProfileModalVisible(true);
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePhoto = () => {
    // Requer a lib "expo-image-picker" instalada no projeto.
    Alert.alert('Alterar foto', 'Conecte o expo-image-picker aqui para trocar a foto do perfil.');
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const userId = loggedUser?.id || 1;
      await axios.put(`${API_BASE_URL}/user/${userId}`, {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone
      });
      setStatus((prev) => ({ ...prev, user_name: profileForm.full_name }));
      setProfileModalVisible(false);
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
          setProfileModalVisible(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      <Header
        onLeftIconPress={() => setNotificationModalVisible(true)}
        onRightIconPress={openProfileModal}
        notificationCount={unreadCount}
        avatarUri={avatarUri}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <WelcomeBanner userName={status.user_name} recommendation={status.recommendation} />

        <DashboardGrid
          onPressOBD={() =>
            !status.is_premium
              ? navigation.navigate('VehicleCompatibility', { user: loggedUser, vehicle: status.vehicle })
              : navigation.navigate('OBD', { user: loggedUser })
          }
          onPressTravelPlanning={() => navigation.navigate('TravelPlanning', { user: loggedUser })}
          onPressVehicleRegistration={() => navigation.navigate('VehicleRegistration', { user: loggedUser })}
          onPressMaintenanceTips={
            status.is_premium
              ? () => navigation.navigate('MaintenanceTips', { user: loggedUser })
              : handlePremiumButton
          }
          onPressPartsCatalog={
            status.is_premium
              ? () => navigation.navigate('PartsCatalog', { user: loggedUser })
              : handlePremiumButton
          }
          onPressTripHistory={() => navigation.navigate('TripHistory', { user: loggedUser })}
        />

        <View style={styles.emptySpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        profileForm={profileForm}
        onChangeField={handleProfileFieldChange}
        avatarUri={avatarUri}
        onChangePhoto={handleChangePhoto}
        onSave={handleSaveProfile}
        saving={savingProfile}
        onLogout={handleLogout}
      />

      <NotificationsModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={markAllAsRead}
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center'
  },
  emptySpace: {
    height: 100
  }
});

export default HomeScreen;