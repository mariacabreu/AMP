import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const InitialScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/mow16cv7-aerakpu.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          Seja-bem vindo ao seu aplicativo de manutenção preventiva
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.question}>Você já possui uma conta?</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, styles.outlineButton]} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.outlineButtonText}>Criar Conta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.filledButton]} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.filledButtonText}>Entrar</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 300,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
  },
  question: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  outlineButtonText: {
    color: '#000000',
    fontSize: 16,
  },
  filledButton: {
    backgroundColor: '#1e1e1e',
  },
  filledButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default InitialScreen;
