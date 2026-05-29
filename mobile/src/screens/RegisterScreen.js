import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Platform } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    console.log('Iniciando processo de cadastro...');
    if (!fullName || !email || !password || !confirmPassword) {
      console.log('Erro: Campos não preenchidos');
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Erro: Senhas não coincidem');
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    try {
      const apiUrl = `${API_BASE_URL}/register`;
      console.log('Enviando requisição para:', apiUrl);
      
      const response = await axios.post(apiUrl, {
        full_name: fullName,
        email: email,
        password: password,
      });
      
      console.log('Resposta do servidor:', response.data);
      
      const newUser = response.data.user;
      
      // No web, o Alert.alert pode ser bloqueado ou não chamar o callback.
      // Vamos navegar diretamente se for sucesso.
      navigation.navigate('VehicleRegistration', { user: newUser });
      
    } catch (error) {
      console.error('Erro no cadastro:', error.response?.data || error.message);
      const message = error.response?.data?.error || 'Erro ao realizar cadastro. Verifique se o servidor está rodando.';
      Alert.alert('Erro', message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
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
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      }
    })
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
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
