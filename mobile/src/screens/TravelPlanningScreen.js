import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

export default function TravelPlanningScreen(props) {
  const { navigation, route } = props;
  const loggedUser = route.params?.user;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distance, setDistance] = useState('0.0 KM');
  const [loading, setLoading] = useState(true);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    return dist.toFixed(1);
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para usar o mapa!');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      setStartLocation('Localização atual');
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
      setLoading(false);
    }
  };

  const handleCalculateDistance = async () => {
    if (!currentLocation) {
      Alert.alert('Aviso', 'Aguardando localização atual...');
      return;
    }

    if (!endLocation) {
      Alert.alert('Aviso', 'Por favor, informe o destino');
      return;
    }

    try {
      setLoading(true);
      
      const destinationCoords = {
        latitude: currentLocation.latitude + 0.01,
        longitude: currentLocation.longitude + 0.01,
      };

      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationCoords.latitude,
        destinationCoords.longitude
      );
      setDistance(dist + ' KM');
    } catch (error) {
      console.error('Error calculating distance:', error);
      Alert.alert('Erro', 'Não foi possível calcular a distância');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (distance === '0.0 KM') {
      Alert.alert('Aviso', 'Calcule a distância primeiro');
      return;
    }
    Alert.alert('Relatório', 'Relatório de viagem gerado com sucesso!\nDistância: ' + distance);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCF00" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PLANEJE SUA VIAGEM</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <FontAwesome5 name="map-marked-alt" size={60} color="#2C2C2C" />
            <Text style={styles.mapText}>
              {Platform.OS === 'web' ? 'Mapa interativo disponível no app mobile' : 'Mapa'}
            </Text>
            {currentLocation && (
              <View style={styles.locationInfoContainer}>
                <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                <Text style={styles.locationInfo}>
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Partida</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="my-location" size={20} color="#4CAF50" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Local de partida"
                value={startLocation}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destino</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#FF5722" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Pra onde?"
                value={endLocation}
                onChangeText={setEndLocation}
              />
            </View>
          </View>

          <View style={styles.distanceContainer}>
            <Text style={styles.label}>Quilometragem:</Text>
            <View style={styles.distanceBox}>
              <Text style={styles.distanceText}>{distance}</Text>
              <TouchableOpacity
                style={styles.calculateButton}
                onPress={handleCalculateDistance}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.calculateButtonText}>Calcular Km</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
          >
            <MaterialIcons name="receipt" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.generateButtonText}>Gerar Relatório</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptySpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />
    </View>
  );
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#2C2C2C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
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
  },
  mapContainer: {
    width: '100%',
    height: 280,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    padding: 20,
  },
  mapText: {
    marginTop: 20,
    fontSize: 14,
    color: '#2C2C2C',
    textAlign: 'center',
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2C2C2C',
  },
  formContainer: {
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 15,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  distanceContainer: {
    marginBottom: 25,
  },
  distanceBox: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  distanceText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
  },
  calculateButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 40,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySpace: {
    height: 100,
  },
});
