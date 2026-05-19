import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Replace with your IP for physical devices

const VehicleRegistrationScreen = ({ navigation, route }) => {
  const user = route.params?.user;
  
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [transmission, setTransmission] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('Gasolina');
  
  // Novos estados para manutenção preventiva
  const [lastOilChange, setLastOilChange] = useState('');
  const [lastBeltChange, setLastBeltChange] = useState('');
  const [lastBrakeChange, setLastBrakeChange] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/brands`);
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchModels = async (brand) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/models/${brand}`);
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchYears = async (brand) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/years/${brand}`);
      setYears(response.data);
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    setSelectedModel('');
    setSelectedYear('');
    if (brand) {
      fetchModels(brand);
      fetchYears(brand);
    } else {
      setModels([]);
      setYears([]);
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
        mileage: mileage ? parseInt(mileage) : 0,
        fuel_type: fuelType,
        user_id: user?.id || 1,
        last_oil_change: lastOilChange ? parseInt(lastOilChange) : 0,
        last_belt_change: lastBeltChange ? parseInt(lastBeltChange) : 0,
        last_brake_change: lastBrakeChange ? parseInt(lastBrakeChange) : 0
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
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Image
          source={require('../assets/mow16cv7-aerakpu.png')} // Using generic logo
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.formCard}>
          <Text style={styles.infoText}>
            Apenas veículos compatíveis com OBD-II Bluetooth e com documentação de API disponível são listados.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Marca do Carro</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBrand}
                onValueChange={handleBrandChange}
                style={styles.picker}
              >
                <Picker.Item label="Selecione a Marca" value="" />
                {brands.map(brand => (
                  <Picker.Item key={brand} label={brand} value={brand} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Modelo do Carro</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedModel}
                onValueChange={setSelectedModel}
                enabled={!!selectedBrand}
                style={styles.picker}
              >
                <Picker.Item label="Selecione o Modelo" value="" />
                {models.map(model => (
                  <Picker.Item key={model} label={model} value={model} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ano do Carro</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={setSelectedYear}
                enabled={!!selectedBrand}
                style={styles.picker}
              >
                <Picker.Item label="Selecione o Ano" value="" />
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Câmbio</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={transmission}
                onValueChange={setTransmission}
                style={styles.picker}
              >
                <Picker.Item label="Selecione o Câmbio" value="" />
                <Picker.Item label="Manual" value="Manual" />
                <Picker.Item label="Automático" value="Automático" />
                <Picker.Item label="Automatizado" value="Automatizado" />
                <Picker.Item label="CVT" value="CVT" />
              </Picker>
            </View>
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Combustível</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fuelType}
                onValueChange={setFuelType}
                style={styles.picker}
              >
                <Picker.Item label="Gasolina" value="Gasolina" />
                <Picker.Item label="Etanol" value="Etanol" />
                <Picker.Item label="Flex" value="Flex" />
                <Picker.Item label="Diesel" value="Diesel" />
                <Picker.Item label="Híbrido" value="Híbrido" />
                <Picker.Item label="Elétrico" value="Elétrico" />
              </Picker>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Histórico de Manutenção (Preventiva)</Text>
          <Text style={styles.sectionSub}>Deixe 0 se não souber ou nunca tiver trocado.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>KM da última troca de ÓLEO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 45000"
              value={lastOilChange}
              onChangeText={setLastOilChange}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>KM da última troca de CORREIA DENTADA</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 40000"
              value={lastBeltChange}
              onChangeText={setLastBeltChange}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>KM da última troca de PASTILHAS DE FREIO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 48000"
              value={lastBrakeChange}
              onChangeText={setLastBrakeChange}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegisterVehicle}>
            <Text style={styles.registerButtonText}>Cadastrar Veículo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 80, // Aumentado para garantir que o botão não fique cortado
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
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFCF00',
    marginTop: 20,
    marginBottom: 5,
  },
  sectionSub: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
    marginLeft: 5,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    height: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 48,
    width: '100%',
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  registerButton: {
    backgroundColor: '#2D2D2D',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleRegistrationScreen;
