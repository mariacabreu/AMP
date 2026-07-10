import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header/Header';

const VehicleCompatibilityScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const vehicle = route.params?.vehicle;

  // Mock data for compatibility check
  const [compatibilityResult, setCompatibilityResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Common OBD-II compatible vehicles by brand
  const compatibleBrands = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Volkswagen', 'BMW',
    'Mercedes-Benz', 'Audi', 'Hyundai', 'Kia', 'Nissan', 'Fiat',
    'Renault', 'Peugeot', 'Citroën', 'Mitsubishi', 'Subaru', 'Mazda'
  ];

  const checkCompatibility = () => {
    setIsChecking(true);
    
    // Simulate a check
    setTimeout(() => {
      let isCompatible = false;
      let message = '';
      let details = [];

      if (vehicle) {
        // Check if brand is in compatible list
        const brandMatch = compatibleBrands.some(
          brand => vehicle.brand?.toLowerCase().includes(brand.toLowerCase())
        );

        // Check if year is 2008 or newer (global OBD-II mandate) or 2012 or newer (Brazil)
        const yearValid = vehicle.year && parseInt(vehicle.year) >= 2008;

        if (brandMatch || yearValid) {
          isCompatible = true;
          message = 'Seu veículo é COMPATÍVEL com o scanner ELM327!';
          details = [
            'Marca compatível com OBD-II',
            yearValid ? 'Ano do veículo dentro do período de obrigatoriedade OBD-II' : '',
            'Suporta protocolos CAN, KWP2000 e ISO9141'
          ].filter(Boolean);
        } else {
          message = 'Seu veículo pode não ser compatível';
          details = [
            'Marca não está na lista de veículos com suporte confirmado',
            'Ano do veículo pode ser anterior à obrigatoriedade OBD-II',
            'Recomendamos verificar a compatibilidade manualmente'
          ];
        }
      } else {
        message = 'Nenhum veículo cadastrado';
        details = [
          'Cadastre seu veículo primeiro para verificar a compatibilidade',
          'Veículos fabricados a partir de 2008 (global) ou 2012 (Brasil) são compatíveis'
        ];
      }

      setCompatibilityResult({
        isCompatible,
        message,
        details
      });
      setIsChecking(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Header
        showIcons={false}
        navigation={navigation}
        loggedUser={loggedUser}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="engine"
            size={100}
            color="#FFCF00"
          />
        </View>

        <Text style={styles.title}>
          Verifique se seu veículo é compatível com o scanner ELM327
        </Text>

        <Text style={styles.subtitle}>
          A verificação é rápida e segura — não causa nenhum dano ao veículo!
        </Text>

        {vehicle && (
          <View style={styles.vehicleInfoCard}>
            <Text style={styles.vehicleInfoTitle}>Veículo cadastrado:</Text>
            <Text style={styles.vehicleInfoText}>
              {vehicle.brand} {vehicle.model} • {vehicle.year}
            </Text>
          </View>
        )}

        {compatibilityResult && (
          <View style={[
            styles.resultCard,
            compatibilityResult.isCompatible ? styles.compatibleCard : styles.incompatibleCard
          ]}>
            <View style={styles.resultIconContainer}>
              <MaterialCommunityIcons
                name={compatibilityResult.isCompatible ? "check-circle" : "alert-circle"}
                size={60}
                color={compatibilityResult.isCompatible ? "#4CAF50" : "#FFC107"}
              />
            </View>
            <Text style={[
              styles.resultTitle,
              { color: compatibilityResult.isCompatible ? "#4CAF50" : "#FFC107" }
            ]}>
              {compatibilityResult.message}
            </Text>
            <View style={styles.resultDetails}>
              {compatibilityResult.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="circle-small"
                    size={20}
                    color={compatibilityResult.isCompatible ? "#4CAF50" : "#FFC107"}
                  />
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.checkButton,
            isChecking && styles.checkButtonDisabled
          ]}
          onPress={checkCompatibility}
          disabled={isChecking}
        >
          {isChecking ? (
            <Text style={styles.checkButtonText}>Verificando...</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="magnify" size={24} color="#000" />
              <Text style={styles.checkButtonText}>
                {compatibilityResult ? "Verificar Novamente" : "Verificar Compatibilidade"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {compatibilityResult?.isCompatible && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('PremiumPlan', { user: loggedUser })}
          >
            <Text style={styles.continueButtonText}>Continuar para o plano premium</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={24} color="#FFCF00" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Informação importante</Text>
            <Text style={styles.infoText}>
              A grande maioria dos veículos fabricados no Brasil a partir de 2012 e no mundo a partir de 2008 são compatíveis com OBD-II.
            </Text>
          </View>
        </View>

        <View style={styles.emptySpace} />
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
        overflow: 'hidden'
      },
      default: {
        flex: 1
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#ffffff'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    flex: 1
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll'
      }
    })
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center'
  },
  iconContainer: {
    marginVertical: 20
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20
  },
  vehicleInfoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center'
  },
  vehicleInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8
  },
  vehicleInfoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000'
  },
  resultCard: {
    width: '100%',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center'
  },
  compatibleCard: {
    backgroundColor: '#E8F5E9'
  },
  incompatibleCard: {
    backgroundColor: '#FFF8E1'
  },
  resultIconContainer: {
    marginBottom: 15
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20
  },
  resultDetails: {
    width: '100%'
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  detailText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    flex: 1
  },
  checkButton: {
    flexDirection: 'row',
    backgroundColor: '#FFCF00',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15
  },
  checkButtonDisabled: {
    opacity: 0.6
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 10
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2C',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 25
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 10
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginTop: 20
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18
  },
  emptySpace: {
    height: 50
  }
});

export default VehicleCompatibilityScreen;
