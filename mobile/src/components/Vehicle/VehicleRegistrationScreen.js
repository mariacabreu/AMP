import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../api';
import CustomDropdown from '../Report/ReportFormEdit/CustomDropdown';
import { styles } from '../Vehicle/VehicleFormStyles';

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
      const formattedBrands = [{ label: 'Selecione a Marca', value: '' }, ...response.data.map(b => ({ label: b, value: b }))];
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

      Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!');
      console.log('Resposta do servidor:', response.data);

      // Navega para a tela de histórico inicial do veículo
      if (navigation && response.data?.vehicle?.id) {
        navigation.replace('VehicleHistory', { user, vehicleId: response.data.vehicle.id });
      }
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
          source={require('../../assets/logo.png')}
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

export default VehicleRegistrationScreen;