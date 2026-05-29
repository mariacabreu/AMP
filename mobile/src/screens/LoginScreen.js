import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Platform } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      console.log('Tentando login para:', email);
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });
      
      console.log('Login bem-sucedido:', response.data);
      navigation.navigate('Home', { user: response.data.user });
    } catch (error) {
      console.error('Erro no login:', error.response?.data || error.message);
      const message = error.response?.data?.error || 'Erro ao realizar login';
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
          source={require('../assets/mow16cvf-h8ooki9.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Insira um email válido"
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
              placeholder="Insira sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Esqueceu sua senha?</Text>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  logo: {
    width: 300,
    height: 180,
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
  },
  inputContainer: {
    marginBottom: 20,
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
  },
  loginButton: {
    backgroundColor: '#2D2D2D',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    color: '#333',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'left',
  },
});

export default LoginScreen;
