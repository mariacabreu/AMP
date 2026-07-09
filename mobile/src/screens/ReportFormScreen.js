import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const ReportFormScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const vehicleId = route.params?.vehicleId;
  const editItem = route.params?.editItem; // Novo parâmetro para edição

  const [gasType, setGasType] = useState(editItem ? editItem.item.split(' ').pop() : 'Comum');
  
  // Função para converter string DD/MM/YYYY para objeto Date
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const [date, setDate] = useState(editItem ? parseDate(editItem.last_date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [liters, setLiters] = useState(editItem ? editItem.liters.toString() : '');
  const [pricePerLiter, setPricePerLiter] = useState(editItem ? (editItem.cost / editItem.liters).toFixed(2).toString() : '');
  const [totalValue, setTotalValue] = useState(editItem ? editItem.cost.toFixed(2).toString() : '');

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleAddCost = async () => {
    if (!liters || !pricePerLiter) {
      Alert.alert('Erro', 'Por favor, preencha a quantidade de litros e o valor por litro.');
      return;
    }

    const litersNum = parseFloat(liters.replace(',', '.'));
    const priceNum = parseFloat(pricePerLiter.replace(',', '.'));
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

  const updatePrice = (l, p) => {
    const lNum = parseFloat(l.replace(',', '.'));
    const pNum = parseFloat(p.replace(',', '.'));
    if (!isNaN(lNum) && !isNaN(pNum)) {
      setTotalValue((lNum * pNum).toFixed(2));
    } else {
      setTotalValue('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <Image
          source={require('../assets/mow376om-iempala.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/mow376om-wu018h0.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/mow376om-4s6plsc.png')} style={styles.topIcon} />
          </TouchableOpacity>
        </View>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Gasolina:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={gasType}
                onValueChange={(itemValue) => setGasType(itemValue)}
                style={styles.picker}
                dropdownIconColor="#2b2b2b"
              >
                <Picker.Item label="Comum" value="Comum" />
                <Picker.Item label="Aditivada" value="Aditivada" />
                <Picker.Item label="Premium" value="Premium" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de abastecimento</Text>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.input, { textAlignVertical: 'center', lineHeight: 45 }]}>
                {date.toLocaleDateString('pt-BR')}
              </Text>
              <MaterialCommunityIcons name="calendar-month" size={24} color="#2b2b2b" style={styles.inputIcon} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Litros de combustível</Text>
            <TextInput
              style={styles.inputSimple}
              value={liters}
              onChangeText={(text) => {
                setLiters(text);
                updatePrice(text, pricePerLiter);
              }}
              keyboardType="numeric"
              placeholder="Ex: 30.5"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor por Litro de combustível</Text>
            <TextInput
              style={styles.inputSimple}
              value={pricePerLiter}
              onChangeText={(text) => {
                setPricePerLiter(text);
                updatePrice(liters, text);
              }}
              keyboardType="numeric"
              placeholder="Ex: 5.49"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Total Gasto</Text>
            <View style={styles.totalDisplay}>
              <Text style={styles.totalText}>
                {totalValue ? `R$ ${totalValue.replace('.', ',')}` : 'R$ 0,00'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleAddCost}>
            <Text style={styles.submitButtonText}>
              {editItem ? 'Salvar Alterações' : 'Adicionar Custo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* FAB Bot */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={30} color="#FFCF00" />
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    width: '100%',
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
  },
  logo: {
    width: 100,
    height: 50,
  },
  headerIcons: {
    flexDirection: 'row',
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
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
  inputSimple: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  inputIcon: {
    marginLeft: 10,
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
    position: 'absolute',
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
});

export default ReportFormScreen;
