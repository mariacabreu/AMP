import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, DatePickerIOS, DatePickerAndroid, Alert, Switch, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/NavBar/BottomNav';

const RemindersScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  // Mock checklist items (we can sync with ChecklistScreen later)
  const [reminders, setReminders] = useState([
    { id: 1, item: 'Troca de Óleo', enabled: true, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { id: 2, item: 'Troca de Pastilhas de Freio', enabled: false, date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { id: 3, item: 'Troca de Correia Dentada', enabled: true, date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  ]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [newReminderText, setNewReminderText] = useState('');

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const openDatePicker = (reminder) => {
    setSelectedReminder(reminder);
    setTempDate(reminder.date);
    setShowDatePicker(true);
  };

  const saveDate = () => {
    if (selectedReminder) {
      setReminders(prev => prev.map(r => 
        r.id === selectedReminder.id ? { ...r, date: tempDate } : r
      ));
    }
    setShowDatePicker(false);
    setSelectedReminder(null);
  };

  const addNewReminder = () => {
    if (!newReminderText.trim()) {
      Alert.alert('Aviso', 'Por favor, insira um nome para o lembrete!');
      return;
    }

    const newReminder = {
      id: Date.now(),
      item: newReminderText,
      enabled: true,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    setReminders(prev => [...prev, newReminder]);
    setNewReminderText('');
    setShowAddModal(false);
    Alert.alert('Sucesso', 'Lembrete adicionado!');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LEMBRETES PROGRAMÁVEIS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Configure lembretes para as manutenções do seu checklist
        </Text>

        {reminders.map(reminder => (
          <View key={reminder.id} style={styles.reminderCard}>
            <View style={styles.reminderInfo}>
              <MaterialCommunityIcons
                name={reminder.item.toLowerCase().includes('óleo') ? 'oil' :
                  reminder.item.toLowerCase().includes('freio') ? 'car-brake' :
                  reminder.item.toLowerCase().includes('correia') ? 'timing-belt' : 'tools'}
                size={32}
                color="#FFCF00"
              />
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderName}>{reminder.item}</Text>
                <Text style={styles.reminderDate}>
                  Lembrete em: {formatDate(reminder.date)}
                </Text>
              </View>
            </View>

            <View style={styles.reminderActions}>
              <Switch
                value={reminder.enabled}
                onValueChange={() => toggleReminder(reminder.id)}
                trackColor={{ false: '#d9d9d9', true: '#FFCF00' }}
                thumbColor="#fff"
              />
              <TouchableOpacity
                style={styles.editDateButton}
                onPress={() => openDatePicker(reminder)}
              >
                <MaterialCommunityIcons name="calendar-edit" size={24} color="#2D2D2D" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Confirmar Exclusão',
                    `Tem certeza que quer excluir o lembrete "${reminder.item}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: () => {
                          setReminders(prev => prev.filter(r => r.id !== reminder.id));
                        }
                      }
                    ]
                  );
                }}
              >
                <MaterialCommunityIcons name="trash-can" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar Novo Lembrete</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Lembrete</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#2D2D2D" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="text" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Nome do lembrete (ex: Troca de filtro de ar)"
                value={newReminderText}
                onChangeText={setNewReminderText}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addNewReminder}
              >
                <Text style={styles.saveButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha a Data</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#2D2D2D" />
              </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' ? (
              <DatePickerIOS
                date={tempDate}
                onDateChange={setTempDate}
                mode="date"
                style={styles.datePicker}
              />
            ) : (
              <View style={styles.androidDateContainer}>
                <Text style={styles.dateText}>{formatDate(tempDate)}</Text>
                <TouchableOpacity
                  style={styles.pickDateButton}
                  onPress={async () => {
                    try {
                      const { action, year, month, day } = await DatePickerAndroid.open({
                        date: tempDate,
                        minDate: new Date()
                      });
                      if (action === DatePickerAndroid.dateSetAction) {
                        setTempDate(new Date(year, month, day));
                      }
                    } catch ({ code, message }) {
                      console.warn('Erro no DatePicker:', message);
                    }
                  }}
                >
                  <MaterialCommunityIcons name="calendar" size={24} color="#FFCF00" />
                  <Text style={styles.pickDateText}>Alterar Data</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveDate}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000'
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'scroll' }
    })
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15
  },
  reminderTextContainer: {
    marginLeft: 15
  },
  reminderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000'
  },
  reminderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  editDateButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD0D0'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    paddingVertical: 18,
    marginTop: 20
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20
  },
  inputIcon: {
    marginRight: 12
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000'
  },
  datePicker: {
    width: '100%',
    height: 200,
    marginBottom: 20
  },
  androidDateContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20
  },
  dateText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20
  },
  pickDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCF00',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30
  },
  pickDateText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8
  },
  cancelButton: {
    backgroundColor: '#e0e0e0'
  },
  saveButton: {
    backgroundColor: '#FFCF00'
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700'
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700'
  },
  footerSpace: {
    height: 50
  }
});

export default RemindersScreen;
