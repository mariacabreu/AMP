
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

const TravelPlanningScreen = ({ navigation, route }) =&gt; {
  const loggedUser = route.params?.user;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distance, setDistance] = useState('0.0 KM');
  const [loading, setLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [region, setRegion] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Função para calcular distância entre dois pontos (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) =&gt; {
    const R = 6371; // Radius da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    return distance.toFixed(1);
  };

  useEffect(() =&gt; {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () =&gt; {
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
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
      setLoading(false);
    }
  };

  const handleCalculateDistance = async () =&gt; {
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
      
      // Simulação de busca de endereço para destino (para demonstração)
      // Em produção, você usaria uma API de geocoding como Google Maps, Mapbox, etc.
      const destinationCoords = {
        latitude: currentLocation.latitude + 0.01,
        longitude: currentLocation.longitude + 0.01,
      };

      // Criar rota entre os dois pontos
      const routeCoords = [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: destinationCoords.latitude, longitude: destinationCoords.longitude },
      ];

      setRouteCoordinates(routeCoords);
      
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationCoords.latitude,
        destinationCoords.longitude
      );
      setDistance(`${dist} KM`);

    } catch (error) {
      console.error('Error calculating distance:', error);
      Alert.alert('Erro', 'Não foi possível calcular a distância');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () =&gt; {
    if (distance === '0.0 KM') {
      Alert.alert('Aviso', 'Calcule a distância primeiro');
      return;
    }
    Alert.alert('Relatório', `Relatório de viagem gerado com sucesso!\nDistância: ${distance}`);
  };

  if (loading) {
    return (
      &lt;View style={styles.loadingContainer}&gt;
        &lt;ActivityIndicator size="large" color="#FFCF00" /&gt;
        &lt;Text style={styles.loadingText}&gt;Carregando...&lt;/Text&gt;
      &lt;/View&gt;
    );
  }

  return (
    &lt;View style={styles.container}&gt;
      &lt;View style={styles.header}&gt;
        &lt;TouchableOpacity onPress={() =&gt; navigation.goBack()}&gt;
          &lt;MaterialIcons name="arrow-back" size={28} color="#000" /&gt;
        &lt;/TouchableOpacity&gt;
        &lt;Text style={styles.headerTitle}&gt;PLANEJE SUA VIAGEM&lt;/Text&gt;
        &lt;View style={{ width: 28 }} /&gt;
      &lt;/View&gt;

      &lt;ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      &gt;
        {/* Mapa */}
        &lt;View style={styles.mapContainer}&gt;
          &lt;View style={styles.mapPlaceholder}&gt;
            &lt;FontAwesome5 name="map-marked-alt" size={60} color="#2C2C2C" /&gt;
            &lt;Text style={styles.mapText}&gt;
              {Platform.OS === 'web' ? 'Mapa interativo disponível no app mobile' : 'Mapa'}
            &lt;/Text&gt;
            {currentLocation &amp;&amp; (
              &lt;View style={styles.locationInfoContainer}&gt;
                &lt;MaterialIcons name="my-location" size={20} color="#4CAF50" /&gt;
                &lt;Text style={styles.locationInfo}&gt;
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                &lt;/Text&gt;
              &lt;/View&gt;
            )}
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Formulário */}
        &lt;View style={styles.formContainer}&gt;
          &lt;View style={styles.inputGroup}&gt;
            &lt;Text style={styles.label}&gt;Partida&lt;/Text&gt;
            &lt;View style={styles.inputContainer}&gt;
              &lt;MaterialIcons name="my-location" size={20} color="#4CAF50" style={styles.inputIcon} /&gt;
              &lt;TextInput
                style={styles.input}
                placeholder="Local de partida"
                value={startLocation}
                editable={false}
              /&gt;
            &lt;/View&gt;
          &lt;/View&gt;

          &lt;View style={styles.inputGroup}&gt;
            &lt;Text style={styles.label}&gt;Destino&lt;/Text&gt;
            &lt;View style={styles.inputContainer}&gt;
              &lt;FontAwesome5 name="map-marker-alt" size={20} color="#FF5722" style={styles.inputIcon} /&gt;
              &lt;TextInput
                style={styles.input}
                placeholder="Pra onde?"
                value={endLocation}
                onChangeText={setEndLocation}
              /&gt;
            &lt;/View&gt;
          &lt;/View&gt;

          &lt;View style={styles.distanceContainer}&gt;
            &lt;Text style={styles.label}&gt;Quilometragem:&lt;/Text&gt;
            &lt;View style={styles.distanceBox}&gt;
              &lt;Text style={styles.distanceText}&gt;{distance}&lt;/Text&gt;
              &lt;TouchableOpacity
                style={styles.calculateButton}
                onPress={handleCalculateDistance}
                disabled={loading}
              &gt;
                {loading ? (
                  &lt;ActivityIndicator size="small" color="#FFF" /&gt;
                ) : (
                  &lt;Text style={styles.calculateButtonText}&gt;Calcular Km&lt;/Text&gt;
                )}
              &lt;/TouchableOpacity&gt;
            &lt;/View&gt;
          &lt;/View&gt;

          &lt;TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
          &gt;
            &lt;MaterialIcons name="receipt" size={20} color="#FFF" style={{ marginRight: 8 }} /&gt;
            &lt;Text style={styles.generateButtonText}&gt;Gerar Relatório&lt;/Text&gt;
          &lt;/TouchableOpacity&gt;
        &lt;/View&gt;

        &lt;View style={styles.emptySpace} /&gt;
      &lt;/ScrollView&gt;

      &lt;BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" /&gt;
    &lt;/View&gt;
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

export default TravelPlanningScreen;

