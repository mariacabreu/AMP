import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../../api';
import BottomNav from '../../NavBar/BottomNav';
import Header from '../../Header/Header';

// Mini calendário customizado (mesmo padrão do ReportFormScreen)
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const CustomCalendarModal = ({ visible, selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (visible) setViewDate(selectedDate || new Date());
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const goToPreviousMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const daysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(day);
    return grid;
  }, [year, month]);

  const isSelectedDay = (day) => {
    if (!selectedDate || !day) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    onSelect(new Date(year, month, day));
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.calendarModalContent}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthLabel}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-forward" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekRow}>
            {WEEKDAY_LABELS.map((label, idx) => (
              <View key={idx} style={styles.calendarWeekdayCell}>
                <Text style={styles.calendarWeekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarDaysGrid}>
            {daysGrid.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.calendarDayCell}
                onPress={() => handleSelectDay(day)}
                disabled={!day}
                activeOpacity={0.7}
              >
                {day && (
                  <View style={[
                    styles.calendarDayCircle,
                    isSelectedDay(day) && styles.calendarDaySelected,
                    !isSelectedDay(day) && isToday(day) && styles.calendarDayToday
                  ]}>
                    <Text style={[styles.calendarDayText, isSelectedDay(day) && styles.calendarDayTextSelected]}>
                      {day}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.calendarCloseButton} onPress={onClose}>
            <Text style={styles.calendarCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// Converte string de data (DD/MM/YYYY ou YYYY-MM-DD) para objeto Date
const parseFlexibleDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const MaintenanceEditScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const editItem = route.params?.editItem;

  const [date, setDate] = useState(parseFlexibleDate(editItem?.last_date));
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Valor com máscara de moeda, mesmo padrão do ReportFormScreen
  const [rawCost, setRawCost] = useState(
    editItem ? String(Math.round(editItem.cost * 100)) : ''
  );

  const formattedCost = useMemo(() => {
    const cleaned = rawCost.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawCost]);

  const costNum = useMemo(() => {
    const cleaned = rawCost.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? parseInt(cleaned, 10) / 100 : 0;
  }, [rawCost]);

  const handleSave = async () => {
    if (costNum <= 0) {
      Alert.alert('Erro', 'Por favor, insira o valor gasto com a manutenção.');
      return;
    }

    try {
      setIsSaving(true);
      await axios.put(`${API_BASE_URL}/vehicle/maintenance/${editItem.id}`, {
        last_date: date.toLocaleDateString('pt-BR'),
        cost: costNum
      });
      setIsSaving(false);
      navigation.navigate('Report', { user: loggedUser });
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error.response?.data || error.message);
      setIsSaving(false);
      Alert.alert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    }
  };

  const handleCancel = () => {
    navigation.navigate('Report', { user: loggedUser });
  };

  // ----- Estado do Header (igual à HomeScreen / ReportScreen) -----
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

  return (
    <View style={styles.container}>
      {/* Header padrão, igual ao HomeScreen/ReportScreen */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>EDITAR CUSTO - MANUTENÇÃO</Text>

        <View style={styles.formCard}>
          {/* Nome da peça/serviço - somente leitura */}
          <View style={styles.partNameWrapper}>
            <MaterialCommunityIcons name="tools" size={30} color="#2b2b2b" />
            <Text style={styles.partName}>{editItem?.item || 'Manutenção'}</Text>
          </View>

          {/* Data com calendário editável */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data da manutenção</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.input, { textAlignVertical: 'center', lineHeight: 45 }]}>
                {date.toLocaleDateString('pt-BR')}
              </Text>
              <MaterialCommunityIcons name="calendar-month" size={24} color="#2b2b2b" style={styles.inputIcon} />
            </TouchableOpacity>
          </View>

          {/* Valor com máscara de moeda */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor gasto</Text>
            <View style={styles.unitInputWrapper}>
              <Text style={styles.unitPrefix}>R$ </Text>
              <TextInput
                style={styles.unitInput}
                value={formattedCost}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/[^0-9]/g, '');
                  setRawCost(cleanedText);
                }}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.formActionButtons}>
            <TouchableOpacity
              style={[styles.formActionButton, styles.formCancelButton]}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={styles.formCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formActionButton, styles.submitButton, { marginTop: 0 }, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.submitButtonText}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* FAB Bot */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={30} color="#FFCF00" />
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />

      <CustomCalendarModal
        visible={showCalendar}
        selectedDate={date}
        onSelect={setDate}
        onClose={() => setShowCalendar(false)}
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
  scrollView: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      }
    })
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  partNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  partName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
    flexShrink: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
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
  unitInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
  // Mini calendário
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 340,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textTransform: 'capitalize',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#FFCF00',
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#FFCF00',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  calendarCloseButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  calendarCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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

export default MaintenanceEditScreen;