import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

// Dropdown customizado, no mesmo padrão usado no VehicleRegistrationScreen
const CustomDropdown = ({ label, items, selectedValue, onSelect, isOpen, setIsOpen }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (Platform.OS === 'web' && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      if (Platform.OS === 'web') {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [setIsOpen]);

  const displayLabel = items.find(item => item.value === selectedValue)?.label || selectedValue;

  return (
    <View style={[styles.inputGroup, isOpen && styles.inputGroupOpen]} ref={dropdownRef}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.customPickerContainer, isOpen && styles.customPickerContainerOpen]}>
        <TouchableOpacity
          style={styles.customPickerButton}
          activeOpacity={0.7}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.customPickerText}>{displayLabel}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
        </TouchableOpacity>
        {isOpen && Platform.select({
          web: (
            <div style={{
              position: 'absolute',
              top: 52,
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              zIndex: 1000000
            }}>
              {items.map((item, index) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.value);
                    setIsOpen(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    backgroundColor: selectedValue === item.value ? '#F5F5F5' : '#ffffff',
                    padding: '12px 16px',
                    borderBottom: index < items.length - 1 ? '1px solid #F0F0F0' : 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#333',
                    userSelect: 'none'
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ),
          default: (
            <View style={styles.dropdownList}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    selectedValue === item.value && styles.selectedDropdownItem,
                    index === items.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedValue === item.value && styles.selectedDropdownItemText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        })}
      </View>
    </View>
  );
};

// Mini calendário customizado, funciona igual em web e mobile
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const CustomCalendarModal = ({ visible, selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (visible) {
      setViewDate(selectedDate || new Date());
    }
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const goToPreviousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const daysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }
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
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    onSelect(new Date(year, month, day));
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.calendarModalContent}>
          {/* Cabeçalho com navegação de mês */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthLabel}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-forward" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Cabeçalho dos dias da semana */}
          <View style={styles.calendarWeekRow}>
            {WEEKDAY_LABELS.map((label, idx) => (
              <View key={idx} style={styles.calendarWeekdayCell}>
                <Text style={styles.calendarWeekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Grade de dias */}
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
                    <Text style={[
                      styles.calendarDayText,
                      isSelectedDay(day) && styles.calendarDayTextSelected
                    ]}>
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

const ReportFormScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const vehicleId = route.params?.vehicleId;
  const editItem = route.params?.editItem; // Novo parâmetro para edição

  const gasTypeOptions = [
    { label: 'Comum', value: 'Comum' },
    { label: 'Aditivada', value: 'Aditivada' },
    { label: 'Premium', value: 'Premium' }
  ];

  const [gasType, setGasType] = useState(editItem ? editItem.item.split(' ').pop() : 'Comum');
  const [gasTypeDropdownOpen, setGasTypeDropdownOpen] = useState(false);
  
  // Função para converter string DD/MM/YYYY para objeto Date
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const [date, setDate] = useState(editItem ? parseDate(editItem.last_date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Litros: armazenado como dígitos brutos, mascarado com 2 casas decimais + sufixo "L"
  const [rawLiters, setRawLiters] = useState(
    editItem ? String(Math.round(editItem.liters * 100)) : ''
  );

  // Valor por Litro: armazenado como dígitos brutos, mascarado com 2 casas decimais + prefixo "R$"
  const [rawPricePerLiter, setRawPricePerLiter] = useState(
    editItem ? String(Math.round((editItem.cost / editItem.liters) * 100)) : ''
  );

  // Litros formatado para exibição (ex: "30,50")
  const formattedLiters = useMemo(() => {
    const cleaned = rawLiters.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawLiters]);

  // Valor por litro formatado para exibição (ex: "5,49")
  const formattedPricePerLiter = useMemo(() => {
    const cleaned = rawPricePerLiter.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawPricePerLiter]);

  // Valores numéricos reais calculados a partir dos dígitos brutos
  const litersNum = useMemo(() => {
    const cleaned = rawLiters.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? parseInt(cleaned, 10) / 100 : 0;
  }, [rawLiters]);

  const priceNum = useMemo(() => {
    const cleaned = rawPricePerLiter.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? parseInt(cleaned, 10) / 100 : 0;
  }, [rawPricePerLiter]);

  // Valor total calculado automaticamente
  const totalValue = useMemo(() => {
    if (litersNum > 0 && priceNum > 0) {
      return (litersNum * priceNum).toFixed(2);
    }
    return '';
  }, [litersNum, priceNum]);

  const handleAddCost = async () => {
    if (litersNum <= 0 || priceNum <= 0) {
      Alert.alert('Erro', 'Por favor, preencha a quantidade de litros e o valor por litro.');
      return;
    }

    const calculatedTotal = litersNum * priceNum;
    
    try {
      // Priorizando o vehicleId que vem do parâmetro, senão usa 1 como fallback seguro
      const vId = vehicleId || 1;
      console.log('Enviando custo para veículo ID:', vId);
      
      const response = await axios.post(`${API_BASE_URL}/vehicle/maintenance`, {
        vehicle_id: vId,
        history: [{
          item: `Gasolina tipo ${gasType}`,
          last_km: 0, 
          last_date: date.toLocaleDateString('pt-BR'),
          cost: calculatedTotal,
          liters: litersNum
        }]
      });

      console.log('Resposta servidor:', response.data);
      navigation.navigate('Report', { user: loggedUser });
    } catch (error) {
      console.error('Erro detalhado:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível salvar o custo. Verifique se você possui um veículo cadastrado.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        {editItem ? (
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Image source={require('../assets/logo.png')} style={styles.topIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Image source={require('../assets/logo.png')} style={styles.topIcon} />
              </TouchableOpacity>
            </View>
          </>
        )}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de abastecimento</Text>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.input, { textAlignVertical: 'center', lineHeight: 45 }]}>
                {date.toLocaleDateString('pt-BR')}
              </Text>
              <MaterialCommunityIcons name="calendar-month" size={24} color="#2b2b2b" style={styles.inputIcon} />
            </TouchableOpacity>
          </View>

          {/* Campo Litros com marca "L" fixa e máscara numérica */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Litros de combustível</Text>
            <View style={styles.unitInputWrapper}>
              <TextInput
                style={styles.unitInput}
                value={formattedLiters}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/[^0-9]/g, '');
                  setRawLiters(cleanedText);
                }}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#999"
              />
              <Text style={styles.unitSuffix}>L</Text>
            </View>
          </View>

          {/* Campo Valor por Litro com marca "R$" fixa e máscara numérica */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor por Litro de combustível</Text>
            <View style={styles.unitInputWrapper}>
              <Text style={styles.unitPrefix}>R$ </Text>
              <TextInput
                style={styles.unitInput}
                value={formattedPricePerLiter}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/[^0-9]/g, '');
                  setRawPricePerLiter(cleanedText);
                }}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Total Gasto</Text>
            <View style={styles.totalDisplay}>
              <Text style={styles.totalText}>
                {totalValue ? `R$ ${totalValue.replace('.', ',')}` : 'R$ 0,00'}
              </Text>
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
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  backButton: {
    padding: 5,
    zIndex: 2,
  },
  // Logo centralizada de forma absoluta, sem alterar suas dimensões originais (100x50)
  logo: {
    width: 100,
    height: 50,
    position: 'absolute',
    left: '50%',
    marginLeft: -50, // metade da largura (100/2), garante centralização exata
    top: 10, // (altura do header 70 - altura da logo 50) / 2
  },
  headerIcons: {
    flexDirection: 'row',
    zIndex: 2,
  },
  iconButton: {
    marginLeft: 15,
  },
  topIcon: {
    width: 30,
    height: 30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Espaço para não cobrir pela sidebar
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
      }
    })
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  inputGroupOpen: {
    zIndex: 1000,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  // Dropdown customizado, no mesmo padrão do VehicleRegistrationScreen
  customPickerContainer: {
    position: 'relative',
  },
  customPickerContainerOpen: {
    zIndex: 10000,
  },
  customPickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customPickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownItemText: {
    color: '#2D2D2D',
    fontWeight: '600',
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
  // Campo com marca fixa (L ou R$), mesmo padrão visual dos demais inputs
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
  navBar: {
     position: Platform.OS === 'web' ? 'fixed' : 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     flexDirection: 'row',
     backgroundColor: '#2b2b2b',
     height: 70,
     justifyContent: 'space-around',
     alignItems: 'center',
     paddingBottom: 10,
     zIndex: 1000,
   },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#D9D9D9',
    marginTop: 4,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#FFCF00',
  },
  emptySpace: {
    height: 100,
  },
  // Estilos do mini calendário customizado
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

export default ReportFormScreen;