import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Platform, TouchableWithoutFeedback, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';

const CustomDropdown = ({ label, items, selectedValue, onSelect, placeholder, enabled = true, onOpen, isOpen, setIsOpen }) => {
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

  const displayLabel = items.find(item => {
    const itemValue = typeof item === 'object' ? item.value : item;
    return itemValue === selectedValue;
  })?.label || selectedValue || placeholder;

  return (
    <View style={[styles.inputContainer, isOpen && styles.inputContainerOpen]} ref={dropdownRef}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.customPickerContainer, !enabled && styles.disabledPicker, isOpen && styles.customPickerContainerOpen]}>
        <TouchableOpacity
          style={styles.customPickerButton}
          activeOpacity={0.7}
          onPress={() => {
            if (enabled) {
              console.log('Dropdown button pressed, current isOpen:', isOpen);
              if (onOpen) onOpen();
              setIsOpen(!isOpen);
            }
          }}
          disabled={!enabled}
        >
          <Text style={[styles.customPickerText, !selectedValue && styles.placeholderText]}>
            {displayLabel}
          </Text>
          <Ionicons 
            name={isOpen ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#666" 
          />
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
              maxHeight: 200,
              overflowY: 'auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              zIndex: 1000000
            }}>
              {items.map((item, index) => {
                const itemValue = typeof item === 'object' ? item.value : item;
                const itemLabel = typeof item === 'object' ? item.label : item;
                return (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Web div clicked', itemValue, itemLabel);
                      onSelect(itemValue);
                      setIsOpen(false);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      backgroundColor: selectedValue === itemValue ? '#F5F5F5' : '#ffffff',
                      padding: '12px 16px',
                      borderBottom: '1px solid #F0F0F0',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#333',
                      userSelect: 'none'
                    }}
                  >
                    {itemLabel}
                  </div>
                );
              })}
            </div>
          ),
          default: (
            <View style={styles.dropdownList}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {items.map((item, index) => {
                  const itemValue = typeof item === 'object' ? item.value : item;
                  const itemLabel = typeof item === 'object' ? item.label : item;
                  return (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        selectedValue === itemValue && styles.selectedDropdownItem,
                        pressed && { backgroundColor: '#F0F0F0' }
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log('Pressable item clicked', itemValue, itemLabel, e);
                        onSelect(itemValue);
                        setIsOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedValue === itemValue && styles.selectedDropdownItemText
                      ]}>
                        {itemLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )
        })}
      </View>
    </View>
  );
};

const VehicleRegistrationScreen = ({ navigation, route }) => {
  const user = route.params?.user;
  
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [engines, setEngines] = useState([]);
  const [years, setYears] = useState([]);
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [transmission, setTransmission] = useState('');
  const [engineType, setEngineType] = useState('');
  const [usageType, setUsageType] = useState('Misto');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('Gasolina');

  const [openDropdown, setOpenDropdown] = useState(null);

  const transmissionOptions = [
    { label: 'Selecione o Câmbio', value: '' },
    { label: 'Manual', value: 'Manual' },
    { label: 'Automático', value: 'Automático' },
    { label: 'Automatizado', value: 'Automatizado' },
    { label: 'CVT', value: 'CVT' }
  ];

  const usageTypeOptions = [
    { label: 'Urbano (Cidade/Trânsito)', value: 'Urbano' },
    { label: 'Rodoviário (Estrada)', value: 'Rodoviário' },
    { label: 'Misto (Cidade e Estrada)', value: 'Misto' },
    { label: 'Trabalho/Severo (Uber/Entrega)', value: 'Severo' }
  ];

  const fuelTypeOptions = [
    { label: 'Gasolina', value: 'Gasolina' },
    { label: 'Etanol', value: 'Etanol' },
    { label: 'Flex', value: 'Flex' },
    { label: 'Diesel', value: 'Diesel' },
    { label: 'Híbrido', value: 'Híbrido' },
    { label: 'Elétrico', value: 'Elétrico' }
  ];

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/brands`);
      console.log('Fetched brands:', response.data);
      const formattedBrands = [{ label: 'Selecione a Marca', value: '' }, ...response.data.map(b => ({ label: b, value: b }))];
      console.log('Formatted brands:', formattedBrands);
      setBrands(formattedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchModels = async (brand) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/models/${brand}`);
      setModels([{ label: 'Selecione o Modelo', value: '' }, ...response.data.map(m => ({ label: m, value: m }))]);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchEngines = async (brand, model) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/engines/${brand}/${model}`);
      setEngines([{ label: 'Selecione a Motorização', value: '' }, ...response.data.map(e => ({ label: e, value: e }))]);
    } catch (error) {
      console.error('Error fetching engines:', error);
    }
  };

  const fetchYears = async (brand, model) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/years/${brand}/${model}`);
      setYears([{ label: 'Selecione o Ano', value: '' }, ...response.data.map(y => ({ label: y.toString(), value: y.toString() }))]);
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const handleBrandChange = (brand) => {
    console.log('handleBrandChange called with:', brand);
    setSelectedBrand(brand);
    setSelectedModel('');
    setEngineType('');
    setSelectedYear('');
    if (brand) {
      fetchModels(brand);
    } else {
      setModels([]);
      setEngines([]);
      setYears([]);
    }
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    setEngineType('');
    setSelectedYear('');
    if (model) {
      fetchEngines(selectedBrand, model);
      fetchYears(selectedBrand, model);
    } else {
      setEngines([]);
      setYears([]);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setEngineType('');
    // Re-fetch engines to ensure we have correct list
    if (selectedBrand && selectedModel) {
      fetchEngines(selectedBrand, selectedModel);
    }
  };

  const handleRegisterVehicle = async () => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      Alert.alert('Erro', 'Por favor, preencha a marca, modelo e ano do veículo.');
      return;
    }

    try {
      console.log('Cadastrando veículo para o usuário:', user?.id);
      const response = await axios.post(`${API_BASE_URL}/vehicle/register`, {
        brand: selectedBrand,
        model: selectedModel,
        year: parseInt(selectedYear),
        transmission,
        engine_type: engineType,
        usage_type: usageType,
        mileage: mileage ? parseInt(mileage) : 0,
        fuel_type: fuelType,
        user_id: user?.id || 1
      });

      console.log('Veículo cadastrado:', response.data);
      navigation.navigate('VehicleHistory', { vehicleId: response.data.vehicle.id, user: user });
      
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error.response?.data || error.message);
      const message = error.response?.data?.error || 'Erro ao cadastrar veículo';
      Alert.alert('Erro', message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButtonInside} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Image
          source={require('../assets/mow16cv7-aerakpu.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.formCard}>
          <Text style={styles.infoText}>
            Apenas veículos compatíveis com OBD-II Bluetooth e com documentação de API disponível são listados.
          </Text>

          <CustomDropdown
            label="Marca do Carro"
            items={brands}
            selectedValue={selectedBrand}
            onSelect={handleBrandChange}
            placeholder="Selecione a Marca"
            isOpen={openDropdown === 'brand'}
            setIsOpen={(open) => setOpenDropdown(open ? 'brand' : null)}
            onOpen={() => setOpenDropdown('brand')}
          />

          <CustomDropdown
            label="Modelo do Carro"
            items={models}
            selectedValue={selectedModel}
            onSelect={handleModelChange}
            placeholder="Selecione o Modelo"
            enabled={!!selectedBrand}
            isOpen={openDropdown === 'model'}
            setIsOpen={(open) => setOpenDropdown(open ? 'model' : null)}
            onOpen={() => setOpenDropdown('model')}
          />

          <CustomDropdown
            label="Ano do Carro"
            items={years}
            selectedValue={selectedYear}
            onSelect={handleYearChange}
            placeholder="Selecione o Ano"
            enabled={!!selectedModel}
            isOpen={openDropdown === 'year'}
            setIsOpen={(open) => setOpenDropdown(open ? 'year' : null)}
            onOpen={() => setOpenDropdown('year')}
          />

          <CustomDropdown
            label="Câmbio"
            items={transmissionOptions}
            selectedValue={transmission}
            onSelect={setTransmission}
            placeholder="Selecione o Câmbio"
            isOpen={openDropdown === 'transmission'}
            setIsOpen={(open) => setOpenDropdown(open ? 'transmission' : null)}
            onOpen={() => setOpenDropdown('transmission')}
          />

          <CustomDropdown
            label="Motorização (Contexto para IA)"
            items={engines}
            selectedValue={engineType}
            onSelect={setEngineType}
            placeholder="Selecione a Motorização"
            enabled={!!selectedBrand && !!selectedModel && !!selectedYear}
            isOpen={openDropdown === 'engine'}
            setIsOpen={(open) => setOpenDropdown(open ? 'engine' : null)}
            onOpen={() => setOpenDropdown('engine')}
          />

          <CustomDropdown
            label="Perfil de Uso (Recomendações IA)"
            items={usageTypeOptions}
            selectedValue={usageType}
            onSelect={setUsageType}
            placeholder="Selecione o Perfil de Uso"
            isOpen={openDropdown === 'usage'}
            setIsOpen={(open) => setOpenDropdown(open ? 'usage' : null)}
            onOpen={() => setOpenDropdown('usage')}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quilometragem</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50000"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
            />
          </View>

          <CustomDropdown
            label="Combustível"
            items={fuelTypeOptions}
            selectedValue={fuelType}
            onSelect={setFuelType}
            placeholder="Selecione o Combustível"
            isOpen={openDropdown === 'fuel'}
            setIsOpen={(open) => setOpenDropdown(open ? 'fuel' : null)}
            onOpen={() => setOpenDropdown('fuel')}
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegisterVehicle}>
            <Text style={styles.registerButtonText}>Cadastrar Veículo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
        overflow: 'visible',
      },
      default: {
        flex: 1,
      }
    })
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'visible',
        overflowX: 'hidden',
        height: '100%',
      }
    })
  },
  backButtonInside: {
    alignSelf: 'flex-start',
    marginTop: 40,
    marginLeft: 20,
    marginBottom: 10,
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 100,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 20,
  },
  formCard: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 1,
      }
    })
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  inputContainerOpen: {
    zIndex: 1000,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  customPickerContainer: {
    position: 'relative',
  },
  customPickerContainerOpen: {
    zIndex: 10000,
  },
  disabledPicker: {
    opacity: 0.5,
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
  placeholderText: {
    color: '#999',
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
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      web: {
        position: 'absolute',
        zIndex: 100000,
      }
    })
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
  registerButton: {
    backgroundColor: '#2D2D2D',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleRegistrationScreen;