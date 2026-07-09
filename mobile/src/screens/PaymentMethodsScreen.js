import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

const PaymentMethodsScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  const paymentMethods = [
    {
      id: 'credit',
      title: 'Cartão Crédito',
      icons: ['visa', 'mastercard', 'elo'], // Placeholder for icon names
      screen: 'CreditPayment'
    },
    {
      id: 'debit',
      title: 'Cartão Débito',
      icons: ['visa', 'mastercard', 'elo'],
      screen: 'DebitPayment'
    },
    {
      id: 'pix',
      title: 'PIX',
      icons: ['pix'],
      screen: 'QRCode'
    }
  ];

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
            <Text style={styles.screenTitle}>FORMAS DE PAGAMENTOS</Text>
          </View>
          
          <Text style={styles.subtitle}>Hora do pit stop: escolha seu método de pagamento</Text>

          {paymentMethods.map((method) => (
            <TouchableOpacity 
              key={method.id} 
              style={styles.methodCard}
              onPress={() => navigation.navigate(method.screen, { user: loggedUser })}
            >
              <View style={styles.methodLeft}>
                {method.id === 'pix' ? (
                  <MaterialCommunityIcons name="rhombus-split" size={30} color="#32BCAD" />
                ) : (
                  <View style={styles.brandIcons}>
                    <Text style={[styles.brandText, { color: '#1A1F71' }]}>VISA</Text>
                    <Text style={[styles.brandText, { color: '#EB001B' }]}>Master</Text>
                    <Text style={[styles.brandText, { color: '#00A4E4' }]}>elo</Text>
                  </View>
                )}
                <Text style={styles.methodTitle}>{method.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ))}

          <View style={styles.footerSpace} />
        </ScrollView>
      </View>

      {/* Floating Action Button / Bottom Icon from Figma */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="steering" size={24} color="#FFCF00" />
        </View>
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />
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
    paddingBottom: 120,
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
    left: 0,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  methodCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 15,
  },
  brandIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    marginRight: 5,
    fontStyle: 'italic',
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
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#D9D9D9',
    fontSize: 10,
    marginTop: 4,
  },
  footerSpace: {
    height: 40,
  }
});

export default PaymentMethodsScreen;
