import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';

const CreditPaymentScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');

  const handlePaymentConfirm = async () => {
    try {
      // Call backend to activate premium
      const response = await axios.post(`${API_BASE_URL}/user/activate-premium/${loggedUser.id}`);
      // Navigate back to Home with updated user data
      navigation.navigate('Home', { user: response.data.user });
    } catch (error) {
      console.error('Error activating premium:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao confirmar o pagamento.');
    }
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.mainContent}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-circle" size={32} color="#2C2C2C" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>CARTÃO DE CRÉDITO</Text>
          </View>
          
          {/* Card Visual */}
          <View style={styles.cardVisual}>
            <Image 
              source={require('../assets/screenshot_834_1190.png')} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Nº do Cartão</Text>
            <TextInput 
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Vencimento</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="MM/AA"
                  value={expiry}
                  onChangeText={setExpiry}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.cvvContainer}>
                  <TextInput 
                    style={[styles.input, { flex: 1 }]}
                    placeholder="123"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                  <View style={styles.cvvIcon} />
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput 
              style={styles.input}
              placeholder="Como está no cartão"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.inputLabel}>CPF</Text>
            <TextInput 
              style={styles.input}
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
            />

            <Text style={styles.termsText}>
              Ao clicar no botão abaixo você concorda com nossos <Text style={styles.linkText}>termos</Text> e <Text style={styles.linkText}>Políticas de Privacidade</Text>
            </Text>

            <TouchableOpacity style={styles.finalBtn} onPress={handlePaymentConfirm}>
              <Text style={styles.finalBtnText}>Finalizar Compra</Text>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerSpace} />
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="steering" size={24} color="#FFCF00" />
        </View>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
    backgroundColor: '#fff',
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
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  cardVisual: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardBrand: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bankName: {
    color: '#fff',
    fontSize: 14,
    position: 'absolute',
    top: 20,
    right: 20,
  },
  chipContainer: {
    marginTop: 10,
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  cardNumberDisplay: {
    color: '#fff',
    fontSize: 20,
    letterSpacing: 2,
    marginTop: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: '#ccc',
    fontSize: 8,
  },
  cardValueDisplay: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cvvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    paddingRight: 10,
  },
  cvvIcon: {
    width: 35,
    height: 25,
    resizeMode: 'contain',
  },
  termsText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 16,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  finalBtn: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  finalBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  fabInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSpace: {
    height: 20,
  }
});

export default CreditPaymentScreen;
