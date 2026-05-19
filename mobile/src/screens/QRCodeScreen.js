import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const QRCodeScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  return (
    <SafeAreaView style={styles.container}>
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
        >
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-circle" size={32} color="#2C2C2C" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>ÁREA PIX</Text>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Pagar com PIX é Rápido, Fácil e Seguro</Text>
            <Text style={styles.infoSubtitle}>Escaneie o QR code abaixo e prossiga com o pagamento.</Text>
            <Text style={styles.infoSubtitle}>Copie e cole o Código pix</Text>
          </View>

          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=AMP_PREMIUM_PAYMENT_PIX_CODE' }} 
              style={styles.qrCode}
            />
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={() => alert('Código PIX copiado!')}>
            <Text style={styles.copyBtnText}>Copiar e colar</Text>
          </TouchableOpacity>

          <View style={styles.footerSpace} />
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="steering" size={24} color="#FFCF00" />
        </View>
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
    width: '100%',
    marginBottom: 30,
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
  infoBox: {
    width: '100%',
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  copyBtn: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    width: '80%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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

export default QRCodeScreen;
