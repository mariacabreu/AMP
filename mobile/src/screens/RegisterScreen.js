import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register', {
        full_name: fullName,
        email: email,
        password: password,
      });
      
      const newUser = response.data.user;
      const successMessage = response.status === 201 
        ? 'Cadastro realizado com sucesso!' 
        : 'Usuário já cadastrado. Entrando...';
      
      Alert.alert('Sucesso', successMessage, [
        { text: 'OK', onPress: () => navigation.navigate('VehicleRegistration', { user: newUser }) }
      ]);
    } catch (error) {
      console.error('Registration Error:', error.response?.data);
      const message = error.response?.data?.error || 'Erro ao realizar cadastro';
      Alert.alert('Erro', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../assets/mow16cuz-sf57r2w.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Repita sua senha</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Cadastrar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.premiumText}>Conheça nosso plano premium !</Text>
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
    paddingVertical: 40,
  },
  logo: {
    width: 300,
    height: 150,
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
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  registerButton: {
    backgroundColor: '#2D2D2D',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#1E1E1E',
  },
});

export default RegisterScreen;
