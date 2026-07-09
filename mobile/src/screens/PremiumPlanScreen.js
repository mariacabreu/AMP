import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

const PremiumPlanScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  const plans = [
    {
      id: 1,
      title: 'Plano Mensal',
      price: '00,00',
      benefits: [
        'Sem anúncios',
        'Planejamento de viagens',
        'Controle de notificações',
        'Inserção de dados manualmente'
      ],
      buttonText: 'Assinar'
    },
    {
      id: 2,
      title: 'Plano Trimestral',
      price: '00,00',
      benefits: [
        'Desconto de 5%',
        'Captação de dados automático',
        'Scanner com OBD'
      ],
      buttonText: 'Assinar'
    },
    {
      id: 3,
      title: 'Plano Semestral', // Ajustado de Trimestral para Semestral conforme lógica de descontos progressivos comum
      price: '00,00',
      benefits: [
        'Desconto de 10%',
        'Tudo incluso',
        'Gerenciamento de até 2 veículos'
      ],
      buttonText: 'Assinar'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-circle" size={32} color="#2C2C2C" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>PLANO PREMIUM</Text>
          </View>
          
          <Text style={styles.subtitle}>Cuide do seu carro gastando menos!</Text>

          <TouchableOpacity 
            style={styles.compatibilityButton}
            onPress={() => navigation.navigate('VehicleCompatibility', { user: loggedUser })}
          >
            <MaterialCommunityIcons name="car-check" size={24} color="#000" />
            <Text style={styles.compatibilityButtonText}>Verifique a compatibilidade do seu veículo</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>

          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>R$</Text>
                  <Text style={styles.priceValue}>{plan.price}</Text>
                </View>
              </View>

              <View style={styles.benefitsList}>
                {plan.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => navigation.navigate('PaymentMethods', { user: loggedUser })}
              >
                <Text style={styles.subscribeButtonText}>{plan.buttonText}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.footerSpace} />
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="steering" size={24} color="#FFCF00" />
        </View>
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    height: Platform.OS === 'web' ? '100vh' : '100%',
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100, // Espaço para não cobrir o conteúdo com a barra
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  compatibilityButton: {
    flexDirection: 'row',
    backgroundColor: '#FFCF00',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  compatibilityButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00000020',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 5,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    marginRight: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
  },
  subscribeButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSpace: {
    height: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    height: 70,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#D9D9D9',
    marginTop: 4,
    fontWeight: '700',
  },
  navTextActive: {
    color: '#FFCF00',
  },
});

export default PremiumPlanScreen;
