import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';
import Header from '../components/Header/Header';
import SearchBar from '../components/PartsCatalog/SearchBar';
import CategoryFilter from '../components/PartsCatalog/CategoryFilter';
import PartsList from '../components/PartsCatalog/PartsList';
import PartDetailModal from '../components/PartsCatalog/PartDetailModal';
import usePartsCatalog from '../components/PartsCatalog/UsePartsCatalog';

const PartsCatalogScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  // ----- Estado da tela de peças (catálogo) -----
  const [search, setSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { loading, data, categories, selectedCategory, setSelectedCategory } =
    usePartsCatalog(loggedUser);

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

  // ----- Handlers do catálogo de peças -----
  const handlePartPress = (part) => {
    setSelectedPart(part);
    setModalVisible(true);
  };

  const filteredParts = useMemo(() => {
    return data.parts.filter((part) => {
      const matchesCategory =
        selectedCategory === 'Todos' || (part.category || 'Geral') === selectedCategory;
      const matchesSearch = (part.name || '').toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [data.parts, selectedCategory, search]);

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
        navigation={navigation}
        loggedUser={loggedUser}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Text style={styles.screenTitle}>CATÁLOGO DE PEÇAS</Text>

        <SearchBar value={search} onChangeText={setSearch} />

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <Text style={styles.vehicleInfo}>Peças para: {data.vehicle}</Text>

        <PartsList
          parts={filteredParts}
          selectedCategory={selectedCategory}
          onPartPress={handlePartPress}
        />

        <View style={styles.emptySpace} />
      </ScrollView>

      <PartDetailModal
        visible={modalVisible}
        part={selectedPart}
        onClose={() => setModalVisible(false)}
      />

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Peças" />
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
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      },
    }),
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  emptySpace: {
    height: 100,
  },
});

export default PartsCatalogScreen;