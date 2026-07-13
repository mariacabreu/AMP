import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';
import Header from '../components/Header/Header';
import CustomDropdown from '../components/Report/ReportFormEdit/CustomDropdown';
import CustomCalendarModal from '../components/Report/ReportFormEdit/CustomCalendarModal';
import useReportForm from '../components/Report/ReportFormEdit/UseReportForm';
import sharedStyles from '../components/Report/ReportFormEdit/SharedStyles';

const ReportFormScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const vehicleId = route.params?.vehicleId;
  const editItem = route.params?.editItem;

  const {
    gasTypeOptions,
    gasType,
    setGasType,
    gasTypeDropdownOpen,
    setGasTypeDropdownOpen,
    date,
    setDate,
    showDatePicker,
    setShowDatePicker,
    formattedLiters,
    formattedPricePerLiter,
    onChangeLiters,
    onChangePrice,
    totalValue,
    handleAddCost,
  } = useReportForm({ editItem, vehicleId, loggedUser, navigation });

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

  useFocusEffect(
    useCallback(() => {
      if (!loggedUser?.id) {
        return undefined;
      }

      fetchUserStatus();
      fetchNotifications();

      return undefined;
    }, [loggedUser?.id])
  );

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

  return (
    <View style={styles.container}>
      {/* Header padrão, igual ao HomeScreen */}
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>
          {editItem ? 'EDITAR CUSTO - COMBUSTÍVEL' : 'ADICIONAR CUSTO - COMBUSTÍVEL'}
        </Text>

        <View style={styles.formCard}>
          <CustomDropdown
            label="Tipo de Gasolina:"
            items={gasTypeOptions}
            selectedValue={gasType}
            onSelect={setGasType}
            isOpen={gasTypeDropdownOpen}
            setIsOpen={setGasTypeDropdownOpen}
          />

          <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>Data de abastecimento</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Text style={[styles.input, { textAlignVertical: 'center', lineHeight: 45 }]}>
                {date.toLocaleDateString('pt-BR')}
              </Text>
              <MaterialCommunityIcons name="calendar-month" size={24} color="#2b2b2b" style={styles.inputIcon} />
            </TouchableOpacity>
          </View>

          {/* Campo Litros com marca "L" fixa e máscara numérica */}
          <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>Litros de combustível</Text>
            <View style={styles.unitInputWrapper}>
              <TextInput
                style={styles.unitInput}
                value={formattedLiters}
                onChangeText={onChangeLiters}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#999"
              />
              <Text style={styles.unitSuffix}>L</Text>
            </View>
          </View>

          {/* Campo Valor por Litro com marca "R$" fixa e máscara numérica */}
          <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>Valor por Litro de combustível</Text>
            <View style={styles.unitInputWrapper}>
              <Text style={styles.unitPrefix}>R$ </Text>
              <TextInput
                style={styles.unitInput}
                value={formattedPricePerLiter}
                onChangeText={onChangePrice}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>Valor Total Gasto</Text>
            <View style={styles.totalDisplay}>
              <Text style={styles.totalText}>{totalValue ? `R$ ${totalValue.replace('.', ',')}` : 'R$ 0,00'}</Text>
            </View>
          </View>

          {editItem ? (
            <View style={styles.formActionButtons}>
              <TouchableOpacity
                style={[styles.formActionButton, styles.formCancelButton]}
                onPress={() => navigation.navigate('Report', { user: loggedUser })}
              >
                <Text style={styles.formCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formActionButton, styles.submitButton, { marginTop: 0 }]}
                onPress={handleAddCost}
              >
                <Text style={styles.submitButtonText}>Salvar Alterações</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleAddCost}>
              <Text style={styles.submitButtonText}>Adicionar Custo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* FAB Bot */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={30} color="#FFCF00" />
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />

      {/* Mini Calendário */}
      <CustomCalendarModal
        visible={showDatePicker}
        selectedDate={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
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
    width: '100%',
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 1,
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  inputIcon: {
    marginLeft: 10,
  },
  unitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
    paddingHorizontal: 15,
  },
  unitPrefix: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  unitSuffix: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  unitInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  totalDisplay: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2b2b2b',
  },
  submitButton: {
    backgroundColor: '#2b2b2b',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fab: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#FFCF00',
  },
  emptySpace: {
    height: 100,
  },
  formActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formActionButton: {
    flex: 1,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  formCancelButton: {
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  formCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportFormScreen;
