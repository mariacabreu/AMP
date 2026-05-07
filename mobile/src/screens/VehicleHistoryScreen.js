import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const VehicleHistoryScreen = ({ navigation, route }) => {
  const { vehicleId, user } = route.params || { vehicleId: 1, user: null };
  
  const [oilKm, setOilKm] = useState('');
  const [beltKm, setBeltKm] = useState('');
  const [brakeKm, setBrakeKm] = useState('');

  const handleSaveHistory = async () => {
    if (!oilKm) {
      Alert.alert('Aviso', 'Por favor, informe pelo menos a última troca de óleo.');
      return;
    }

    const history = [
      { item: 'Troca de Óleo', last_km: parseInt(oilKm) },
    ];
    
    if (beltKm) history.push({ item: 'Troca de Correia', last_km: parseInt(beltKm) });
    if (brakeKm) history.push({ item: 'Troca de Pastilhas', last_km: parseInt(brakeKm) });

    try {
      await axios.post(`${API_BASE_URL}/vehicle/maintenance`, {
        vehicle_id: vehicleId,
        history: history
      });

      Alert.alert('Sucesso', 'Histórico salvo! Vamos para sua Home.', [
        { text: 'OK', onPress: () => navigation.navigate('Home', { user: user }) }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o histórico.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Histórico do Veículo</Text>
        <Text style={styles.subtitle}>
          Para recomendações precisas, precisamos saber quando foram as últimas manutenções.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Km da última troca de óleo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 80000"
              value={oilKm}
              onChangeText={setOilKm}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Km da última troca de correia (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 60000"
              value={beltKm}
              onChangeText={setBeltKm}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Km da última troca de pastilhas (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 75000"
              value={brakeKm}
              onChangeText={setBrakeKm}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveHistory}>
            <Text style={styles.saveButtonText}>Finalizar e ir para Home</Text>
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
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
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
  },
  saveButton: {
    backgroundColor: '#2D2D2D',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleHistoryScreen;
