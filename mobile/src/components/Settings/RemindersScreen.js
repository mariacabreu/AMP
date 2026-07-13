import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Alert,
  TextInput,
  Image
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import BottomNav from '../NavBar/BottomNav';
import CustomCalendarModal from '../Common/CustomCalendarModal';
import CustomSwitch from '../Settings/CustomSwitch';

const iconForItem = (item) => {
  const text = item.toLowerCase();
  if (text.includes('óleo')) return 'oil';
  if (text.includes('freio')) return 'car-brake-abs';
  if (text.includes('correia')) return 'timer-sand';
  return 'wrench';
};

const formatDate = (date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const ReminderCard = ({ reminder, onToggle, onEditDate, onDelete }) => (
  <View style={styles.reminderCard}>
    <View style={styles.reminderInfo}>
      <View style={styles.iconBadge}>
        <MaterialCommunityIcons name={iconForItem(reminder.item)} size={24} color="#B8860B" />
      </View>
      <View style={styles.reminderTextContainer}>
        <Text style={styles.reminderName} numberOfLines={1}>{reminder.item}</Text>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={13} color="#888" />
          <Text style={styles.reminderDate}>{formatDate(reminder.date)}</Text>
        </View>
      </View>
    </View>

    <View style={styles.reminderActions}>
      <CustomSwitch
        value={reminder.enabled}
        onValueChange={onToggle}
      />
      <TouchableOpacity style={styles.actionButton} onPress={onEditDate} activeOpacity={0.7}>
        <MaterialCommunityIcons name="calendar-edit" size={20} color="#2D2D2D" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete} activeOpacity={0.7}>
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF4444" />
      </TouchableOpacity>
    </View>
  </View>
);

const RemindersScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  // Mock checklist items (podemos sincronizar com ChecklistScreen depois)
  const [reminders, setReminders] = useState([
    { id: 1, item: 'Troca de Óleo', enabled: true, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { id: 2, item: 'Troca de Pastilhas de Freio', enabled: false, date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { id: 3, item: 'Troca de Correia Dentada', enabled: true, date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  ]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [newReminderText, setNewReminderText] = useState('');
  const [reminderToDelete, setReminderToDelete] = useState(null);

  const toggleReminder = (id) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const openDatePicker = (reminder) => {
    setSelectedReminder(reminder);
    setShowCalendar(true);
  };

  // Chamado assim que o usuário toca em um dia no calendário
  const handleSelectDate = (date) => {
    if (selectedReminder) {
      setReminders((prev) =>
        prev.map((r) => (r.id === selectedReminder.id ? { ...r, date } : r))
      );
    }
  };

  const closeCalendar = () => {
    setShowCalendar(false);
    setSelectedReminder(null);
  };

  const addNewReminder = () => {
    if (!newReminderText.trim()) {
      Alert.alert('Aviso', 'Por favor, insira um nome para o lembrete!');
      return;
    }

    const newReminder = {
      id: Date.now(),
      item: newReminderText.trim(),
      enabled: true,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    setReminders((prev) => [...prev, newReminder]);
    setNewReminderText('');
    setShowAddModal(false);
  };

  // Abre o modal customizado de confirmação (funciona igual em web e nativo)
  const deleteReminder = (reminder) => {
    setReminderToDelete(reminder);
  };

  const confirmDeleteReminder = () => {
    if (reminderToDelete) {
      setReminders((prev) => prev.filter((r) => r.id !== reminderToDelete.id));
    }
    setReminderToDelete(null);
  };

  const cancelDeleteReminder = () => {
    setReminderToDelete(null);
  };

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>LEMBRETES PROGRAMÁVEIS</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Configure lembretes para as manutenções do seu checklist
        </Text>

        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={40} color="#CCC" />
            <Text style={styles.emptyStateText}>Nenhum lembrete cadastrado ainda</Text>
          </View>
        ) : (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={() => toggleReminder(reminder.id)}
              onEditDate={() => openDatePicker(reminder)}
              onDelete={() => deleteReminder(reminder)}
            />
          ))
        )}

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={22} color="#FFCF00" />
          <Text style={styles.addButtonText}>Adicionar Novo Lembrete</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Modal: Adicionar Lembrete */}
      <Modal animationType="slide" transparent visible={showAddModal} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Lembrete</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="text-box-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Nome do lembrete (ex: Troca de filtro de ar)"
                placeholderTextColor="#AAA"
                value={newReminderText}
                onChangeText={setNewReminderText}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={addNewReminder}>
                <Text style={styles.confirmButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendário para escolher a data do lembrete (mesmo componente usado em Adicionar Custo - Combustível) */}
      <CustomCalendarModal
        visible={showCalendar}
        selectedDate={selectedReminder?.date}
        onSelect={handleSelectDate}
        onClose={closeCalendar}
      />

      {/* Modal de confirmação de exclusão (mesmo CSS do DeleteAccountModal) */}
      <Modal animationType="fade" transparent visible={!!reminderToDelete} onRequestClose={cancelDeleteReminder}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <MaterialCommunityIcons name="alert-octagon" size={50} color="#FF4444" />
            <Text style={styles.deleteModalTitle}>Excluir Lembrete</Text>
            <Text style={styles.deleteModalText}>
              Tem certeza que deseja excluir o lembrete{' '}
              <Text style={{ fontWeight: '800', color: '#000' }}>"{reminderToDelete?.item}"</Text>?
              Essa ação não pode ser desfeita.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalCancelButton]}
                onPress={cancelDeleteReminder}
              >
                <Text style={styles.deleteModalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalConfirmButton]}
                onPress={confirmDeleteReminder}
              >
                <Text style={styles.deleteModalConfirmButtonText}>Sim, Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Config" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
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
      default: { flex: 1 },
    }),
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    zIndex: 2,
    alignSelf: 'flex-start',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({ web: { overflowY: 'scroll' } }),
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    bottom: 16,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 60,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTextContainer: {
    marginLeft: 14,
    flexShrink: 1,
  },
  reminderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  reminderDate: {
    fontSize: 12,
    color: '#888',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFF0F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFCF00',
    fontSize: 15,
    fontWeight: '700',
  },
  footerSpace: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#FFCF00',
  },
  cancelButtonText: {
    color: '#444',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deleteModalContent: {
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
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
    color: '#000',
  },
  deleteModalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteModalConfirmButton: {
    backgroundColor: '#FF4444',
  },
  deleteModalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteModalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default RemindersScreen;