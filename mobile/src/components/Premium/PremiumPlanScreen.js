import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import BottomNav from '../NavBar/BottomNav';
import Header from '../Header/Header';
import axios from 'axios';
import API_BASE_URL from '../../api';
import AMPAlertModal from '../Common/AMPAlertModal';

const PremiumPlanScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [avatarUri, setAvatarUri] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState('');
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalData, setAlertModalData] = useState({
    type: 'success',
    title: '',
    message: '',
    confirmButtonText: 'Ok',
    onConfirm: () => setAlertModalVisible(false),
  });

  const fetchUserStatus = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const res = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      if (res.data?.user) {
        setIsPremium(res.data.user.is_premium || false);
        setPlanType(res.data.user.plan_type || '');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const res = await axios.get(`${API_BASE_URL}/user/vehicles/${userId}`);
      const data = Array.isArray(res.data?.vehicles) ? res.data.vehicles : [];
      setVehicles(data);
      setVehicleCount(data.length);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const res = await axios.get(`${API_BASE_URL}/user/notifications/${userId}`);
      const data = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const userId = loggedUser?.id || 1;
      await axios.put(`${API_BASE_URL}/user/${userId}`, profileForm);
      setAlertModalData({
        type: 'success',
        title: 'Sucesso!',
        message: 'Perfil atualizado com sucesso!',
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      setAlertModalData({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao salvar perfil.',
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePhoto = () => {
    setAlertModalData({
      type: 'info',
      title: 'Aviso',
      message: 'Função de alterar foto em desenvolvimento',
      confirmButtonText: 'Ok',
      onConfirm: () => setAlertModalVisible(false),
    });
    setAlertModalVisible(true);
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const handleAddVehicle = () => {
    navigation.navigate('VehicleForm', { user: loggedUser });
  };

  const markAllAsRead = async () => {
    try {
      const userId = loggedUser?.id || 1;
      await axios.post(`${API_BASE_URL}/user/notifications/mark-read/${userId}`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    if (loggedUser) {
      setProfileForm({
        full_name: loggedUser.full_name || '',
        email: loggedUser.email || '',
        phone: loggedUser.phone || ''
      });
      if (loggedUser.avatar_url) {
        setAvatarUri(loggedUser.avatar_url);
      }
    }
    fetchUserStatus();
    fetchVehicles();
    fetchNotifications();
  }, [loggedUser]);

  const plans = [
    {
      id: 1,
      title: 'Plano Mensal',
      price: '19,99',
      planType: 'mensal',
      benefits: [
        { text: 'Sem anúncios', icon: 'advertisements-off' },
        { text: 'Planejamento de viagens', icon: 'map-marker-path' },
        { text: 'Inteligência artificial para recomendações preventivas', icon: 'robot' },
        { text: 'Notificações inteligentes', icon: 'bell-ring' },
        { text: 'Captura automática de dados', icon: 'cloud-sync' },
        { text: 'Backup em nuvem', icon: 'cloud-check' },
        { text: 'Cadastro de 1 veículo', icon: 'car' }
      ],
      buttonText: 'Assinar'
    },
    {
      id: 2,
      title: 'Plano Trimestral',
      price: '56,99',
      planType: 'trimestral',
      benefits: [
        { text: 'Sem anúncios', icon: 'advertisements-off' },
        { text: 'Planejamento de viagens', icon: 'map-marker-path' },
        { text: 'Inteligência artificial para recomendações preventivas', icon: 'robot' },
        { text: 'Notificações inteligentes', icon: 'bell-ring' },
        { text: 'Captura automática de dados', icon: 'cloud-sync' },
        { text: 'Backup em nuvem', icon: 'cloud-check' },
        { text: 'Cadastro de 1 veículo', icon: 'car' }
      ],
      buttonText: 'Assinar'
    },
    {
      id: 3,
      title: 'Plano Anual',
      price: '215,99',
      planType: 'anual',
      benefits: [
        { text: 'Tudo dos outros planos', icon: 'all-inclusive' },
        { text: 'Cadastro de 1 veículo', icon: 'car' },
        { text: 'Prioridade no suporte', icon: 'headset' },
        { text: 'Economia de 10%', icon: 'percent' },
        { text: 'Futuras funcionalidades Premium incluídas', icon: 'star' }
      ],
      buttonText: 'Assinar'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
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
        isPremium={isPremium}
        planType={planType}
        navigation={navigation}
        loggedUser={loggedUser}
      />

      <View style={styles.mainContent}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>PLANO PREMIUM</Text>
          </View>
          
          <Text style={styles.subtitle}>Cuide do seu carro gastando menos!</Text>

          <TouchableOpacity 
            style={styles.compatibilityButton}
            onPress={() => navigation.navigate('VehicleCompatibility', { user: loggedUser })}
          >
            <View style={styles.compatibilityIconContainer}>
              <MaterialCommunityIcons name="car-check" size={20} color="#FFCF00" />
            </View>
            <Text style={styles.compatibilityButtonText}>Verifique a compatibilidade do seu veículo</Text>
            <Ionicons name="chevron-forward" size={24} color="#000" />
          </TouchableOpacity>

          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>R$</Text>
                  <Text style={styles.priceValue}>{plan.price}</Text>
                </View>
              </View>

              <View style={styles.benefitsList}>
                {plan.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <MaterialCommunityIcons name={benefit.icon} size={20} color="#FFCF00" style={styles.benefitIcon} />
                    <Text style={styles.benefitText}>{benefit.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => navigation.navigate('PaymentMethods', { user: loggedUser, planType: plan.planType })}
              >
                <Text style={styles.subscribeButtonText}>{plan.buttonText}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.footerSpace} />
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="steering" size={24} color="#FFCF00" />
        </View>
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />

      <AMPAlertModal
        visible={alertModalVisible}
        type={alertModalData.type}
        title={alertModalData.title}
        message={alertModalData.message}
        confirmButtonText={alertModalData.confirmButtonText}
        onConfirm={alertModalData.onConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    }),
  },
  mainContent: {
    flex: 1,
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  compatibilityButton: {
    flexDirection: 'row',
    backgroundColor: '#FFCF00',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  compatibilityButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00000020',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 5,
  },
  benefitIcon: {
    marginRight: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSpace: {
    height: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  fabInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PremiumPlanScreen;
