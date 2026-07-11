import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import axios from 'axios';
import API_BASE_URL from '../../api';

// Funções auxiliares para formatação
const formatCardNumber = (text) => {
  const cleaned = text.replace(/\D/g, '');
  const grouped = cleaned.match(/.{1,4}/g);
  return grouped ? grouped.join(' ') : cleaned;
};

const formatExpiry = (text) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

const formatCPF = (text) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length >= 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  } else if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}`;
  } else if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}`;
  }
  return cleaned;
};

// Função para detectar bandeira do cartão
const getCardBrand = (cardNumber) => {
  const num = cardNumber.replace(/\D/g, '');
  if (/^4/.test(num)) return 'visa';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  if (/^3(?:0[0-5]|[68])/.test(num)) return 'diners';
  if (/^6(?:011|5)/.test(num)) return 'discover';
  if (/^9/.test(num)) return 'elo';
  return null;
};

// Cores para cada bandeira
const getCardColors = (brand) => {
  switch (brand) {
    case 'visa': return { start: '#1A1F71', end: '#1A1F71' };
    case 'mastercard': return { start: '#EB001B', end: '#F79E1B' };
    case 'amex': return { start: '#2557D6', end: '#183BC1' };
    case 'elo': return { start: '#00AEEF', end: '#50B848' };
    default: return { start: '#2C2C2C', end: '#3D3D3D' };
  }
};

/**
 * CardPaymentScreen
 *
 * Tela base compartilhada por pagamento com Cartão de Crédito e Cartão de Débito.
 * O que muda entre os dois é só o título exibido — toda a lógica de formulário,
 * validação e confirmação de pagamento é idêntica.
 *
 * Props:
 * - navigation, route: parâmetros padrão de navegação
 * - title: título exibido no topo (ex: "CARTÃO DE CRÉDITO" ou "CARTÃO DE DÉBITO")
 */
const CardPaymentScreen = ({ navigation, route, title }) => {
  const loggedUser = route.params?.user || { id: 1, full_name: 'Demo User', email: 'demo@amp.com' };
  const planType = route.params?.planType || 'mensal';
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const cardBrand = getCardBrand(cardNumber);
  const cardColors = getCardColors(cardBrand);

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handlePaymentConfirm = async () => {
    try {
      // Call backend to set user's plan
      const response = await axios.post(`${API_BASE_URL}/user/set-plan/${loggedUser.id}`, { plan_type: planType });
      // Navigate back to Home with updated user data
      Alert.alert('Sucesso!', `Plano ${planType} ativado com sucesso!`);
      navigation.navigate('Home', { user: response.data.user });
    } catch (error) {
      console.error('Error activating plan:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao confirmar o pagamento.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <Header showIcons={false} />

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>{title}</Text>
          </View>

          {/* Card Visual */}
          <View style={styles.cardVisual}>
            <Animated.View
              style={[
                styles.cardSide,
                {
                  transform: [
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg']
                      })
                    }
                  ],
                  opacity: flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0, 0]
                  })
                }
              ]}
            >
              {/* Frente do cartão */}
              <View style={[
                styles.cardBackground, 
                {
                  ...Platform.select({
                    web: {
                      background: `linear-gradient(135deg, ${cardColors.start}, ${cardColors.end})`
                    },
                    default: {
                      backgroundColor: cardColors.start
                    }
                  })
                }
              ]}>
                {/* Parte superior: bandeira e chip */}
                <View style={styles.cardTopRow}>
                  {/* Chip do cartão */}
                  <View style={styles.chipContainer}>
                    <View style={styles.chip} />
                  </View>
                  {/* Bandeira do cartão */}
                  <View style={styles.cardBrandContainer}>
                    {cardBrand && (
                      <FontAwesome5 
                        name={cardBrand === 'elo' ? 'credit-card' : `cc-${cardBrand}`} 
                        size={40} 
                        color="#FFFFFF" 
                      />
                    )}
                  </View>
                </View>
                
                {/* Número do cartão */}
                <View style={styles.cardNumberContainer}>
                  <Text style={styles.cardNumberDisplay}>
                    {cardNumber || '**** **** **** ****'}
                  </Text>
                </View>
                
                {/* Informações inferiores */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.cardLabel}>NOME DO TITULAR</Text>
                    <Text style={styles.cardValueDisplay}>
                      {fullName || 'NOME AQUI'}
                    </Text>
                  </View>
                  <View style={styles.expiryContainer}>
                    <Text style={styles.cardLabel}>VALIDADE</Text>
                    <Text style={styles.cardValueDisplay}>
                      {expiry || 'MM/AA'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.cardSide,
                styles.cardBack,
                {
                  transform: [
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['180deg', '360deg']
                      })
                    }
                  ],
                  opacity: flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1]
                  })
                }
              ]}
            >
              {/* Verso do cartão */}
              <View style={[
                styles.cardBackground, 
                {
                  ...Platform.select({
                    web: {
                      background: `linear-gradient(135deg, ${cardColors.start}, ${cardColors.end})`
                    },
                    default: {
                      backgroundColor: cardColors.start
                    }
                  })
                }
              ]}>
                {/* Faixa magnética */}
                <View style={styles.magneticStripe} />
                {/* Área do CVV */}
                <View style={styles.cvvArea}>
                  <Text style={styles.cvvLabel}>CVV</Text>
                  <Text style={styles.cvvValue}>{cvv || '•••'}</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Nº do Cartão</Text>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
              onFocus={() => isFlipped && flipCard()}
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Vencimento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/AA"
                  value={expiry}
                  onChangeText={(text) => setExpiry(formatExpiry(text))}
                  maxLength={5}
                  onFocus={() => isFlipped && flipCard()}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.cvvContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="123"
                    value={cvv}
                    onChangeText={(text) => {
                      const numbersOnly = text.replace(/[^0-9]/g, '');
                      setCvv(numbersOnly);
                    }}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={3}
                    onFocus={() => !isFlipped && flipCard()}
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
              autoCapitalize="characters"
              onFocus={() => isFlipped && flipCard()}
            />

            <Text style={styles.inputLabel}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={(text) => setCpf(formatCPF(text))}
              keyboardType="numeric"
              maxLength={14}
              onFocus={() => isFlipped && flipCard()}
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
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
    flexGrow: 1,
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
    maxWidth: 400,
    aspectRatio: 1.6,
    borderRadius: 15,
    overflow: 'visible',
    marginBottom: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignSelf: 'center',
    position: 'relative',
  },
  cardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
  },
  magneticStripe: {
    width: 'calc(100% + 40px)',
    height: 40,
    backgroundColor: '#000000',
    marginLeft: -20,
    marginTop: 10,
  },
  cvvArea: {
    backgroundColor: '#FFFFFF',
    width: '25%',
    height: 30,
    marginTop: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
  cvvLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 8,
  },
  cvvValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrandContainer: {
    alignItems: 'flex-end',
  },
  chipContainer: {
    marginTop: 0,
  },
  chip: {
    width: 45,
    height: 32,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    opacity: 0.9,
  },
  cardNumberContainer: {
    marginTop: 20,
  },
  cardNumberDisplay: {
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 3,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardValueDisplay: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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

export default CardPaymentScreen;