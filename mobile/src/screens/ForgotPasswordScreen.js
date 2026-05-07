import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }
    Alert.alert('Sucesso', 'Um link de recuperação foi enviado para seu email.');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Image
          source={require('../assets/mow16cvs-4jz7ffc.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Insira o email cadastrado"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.resetButton]} 
              onPress={handleResetPassword}
            >
              <Text style={styles.resetButtonText}>Nova Senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },
  logo: {
    width: 300,
    height: 180,
    marginBottom: 40,
  },
  formCard: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputContainer: {
    marginBottom: 24,
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
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#000',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#2D2D2D',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
