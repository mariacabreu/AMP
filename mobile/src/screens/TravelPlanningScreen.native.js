import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, UrlTile } from 'react-native-maps';
import BottomNav from '../components/NavBar/BottomNav';

export default function TravelPlanningScreen(props) {
  const { navigation, route } = props;
  const loggedUser = route.params?.user;
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [selectedStartLocation, setSelectedStartLocation] = useState(null);
  const [searchingStart, setSearchingStart] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [distance, setDistance] = useState('0.0 KM');
  const [duration, setDuration] = useState('');
  const [mapRegion, setMapRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeStatus, setRouteStatus] = useState('Selecione um destino e calcule a rota');

  const formatDistance = (distanceInMeters) => {
    return `${(distanceInMeters / 1000).toFixed(1)} KM`;
  };

  const formatDuration = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.round((durationInSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }

    return `${minutes} min`;
  };

  const openRouteInMap = async () => {
    const origin = selectedStartLocation || currentLocation;
    if (!origin || !selectedDestination) {
      return;
    }

    const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${selectedDestination.latitude}%2C${selectedDestination.longitude}`;
    await Linking.openURL(directionsUrl);
  };

  const fetchLocationLabel = async (coords) => {
    try {
      console.log('Fetching location label for coords:', coords);
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=pt-BR&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18`;
      console.log('Reverse geocode URL:', reverseUrl);
      const response = await fetch(reverseUrl, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
          'User-Agent': 'AMP-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Falha ao buscar endereço atual: ${response.status}`);
      }

      const data = await response.json();
      console.log('Reverse geocode response:', data);
      const address = data.address || {};
      
      const streetParts = [
        address.road,
        address.house_number,
      ].filter(Boolean);
      
      let label = '';
      
      if (streetParts.length > 0) {
        label = streetParts.join(', ');
        
        const neighbourhood = address.neighbourhood || address.suburb || address.city_district;
        if (neighbourhood) {
          label += `, ${neighbourhood}`;
        }
        
        const city = address.city || address.town || address.village || address.municipality;
        if (city) {
          label += `, ${city}`;
        }
        
        const possibleNames = [
          data.name,
          address.shop,
          address.amenity,
          address.building,
          address.office,
          address.hotel,
          address.restaurant,
          address.cafe,
          address.supermarket,
          address.mall,
        ].filter(Boolean);
        
        if (possibleNames.length > 0) {
          label += ` (${possibleNames[0]})`;
        }
      } else {
        label = data.display_name || 'Localização atual';
      }

      console.log('Final location label:', label);
      return label;
    } catch (error) {
      console.error('Error fetching current location label:', error);
      return 'Localização atual';
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const fetchStartSuggestions = async (query) => {
    try {
      console.log('Fetching start suggestions for query:', query);
      setSearchingStart(true);

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=pt-BR&q=${encodeURIComponent(query)}`;
      console.log('Request URL:', url);
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
          'User-Agent': 'AMP-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch start suggestions: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      const suggestions = data.map((item) => {
        const address = item.address || {};
        const titleParts = [
          address.road,
          address.house_number,
          address.neighbourhood || address.suburb,
          address.city_district,
          address.city || address.town || address.village || address.municipality || address.county,
        ].filter(Boolean);
        const subtitleParts = [
          address.state,
          address.region,
          address.country,
        ].filter(Boolean);
        const fallbackParts = item.display_name.split(',').map((part) => part.trim());
        const title = titleParts.slice(0, 3).join(', ') || fallbackParts.slice(0, 2).join(', ');
        const subtitle = subtitleParts.join(', ') || fallbackParts.slice(2).join(', ');

        return {
          id: `${item.place_id}`,
          label: title || item.display_name,
          subtitle,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        };
      });

      console.log('Processed suggestions:', suggestions);
      setStartSuggestions(suggestions);
      setShowStartSuggestions(true);
    } catch (error) {
      console.error('Error fetching start suggestions:', error);
      setStartSuggestions([]);
    } finally {
      setSearchingStart(false);
    }
  };

  const handleStartChange = (text) => {
    setStartLocation(text);
    setSelectedStartLocation(null);
    setDistance('0.0 KM');
    setDuration('');
    setMapRegion(null);
    setRouteStatus('Selecione um local de partida sugerido para calcular a rota');
    setShowStartSuggestions(true);
  };

  const handleSelectStart = (location) => {
    setSelectedStartLocation(location);
    setStartLocation(location.label);
    setStartSuggestions([]);
    setShowStartSuggestions(false);
    setDistance('0.0 KM');
    setDuration('');
    setMapRegion(null);
    setRouteStatus('Partida selecionada. Selecione um destino para traçar a rota');
  };

  const handleResetToCurrentLocation = async () => {
    console.log('=== handleResetToCurrentLocation CALLED ===');
    setSelectedStartLocation(null);
    setStartSuggestions([]);
    setShowStartSuggestions(false);
    setDistance('0.0 KM');
    setDuration('');
    setMapRegion(null);
    await getCurrentLocation();
  };

  useEffect(() => {
    const query = startLocation.trim();

    if (query.length < 3) {
      setStartSuggestions([]);
      setSearchingStart(false);
      return undefined;
    }

    if (selectedStartLocation && selectedStartLocation.label === query) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      fetchStartSuggestions(query);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [startLocation, selectedStartLocation]);

  useEffect(() => {
    const query = endLocation.trim();

    if (query.length < 3) {
      setDestinationSuggestions([]);
      setSearchingDestination(false);
      return undefined;
    }

    if (selectedDestination && selectedDestination.label === query) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      fetchDestinationSuggestions(query);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [endLocation, selectedDestination]);

  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const getCurrentLocation = async () => {
    console.log('=== getCurrentLocation STARTING ===');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Permissão negada');
        Alert.alert('Permissão negada', 'Precisamos da sua localização para usar o mapa!');
        throw new Error('Permissão negada');
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('✅ Got location:', location);

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      const label = await fetchLocationLabel(coords);
      console.log('✅ Setting startLocation to:', label);
      setStartLocation(label);
      setRouteStatus('Localização atual obtida. Escolha um destino para traçar a rota');
      return;
    } catch (error) {
      console.error('❌ Error in getCurrentLocation, using fallback:', error);
    }
    
    console.log('⚠️ Using fallback location');
    const fallbackCoords = {
      latitude: -23.5505,
      longitude: -46.6333,
    };
    setCurrentLocation(fallbackCoords);
    let label = 'São Paulo, SP (localização padrão)';
    try {
      const fallbackLabel = await fetchLocationLabel(fallbackCoords);
      if (fallbackLabel !== 'Localização atual') {
        label = fallbackLabel;
      }
    } catch (labelError) {
      console.log('Could not get fallback label');
    }
    setStartLocation(label);
    setRouteStatus('Usando localização aproximada. Ative a geolocalização para rota mais precisa');
    console.log('=== getCurrentLocation DONE ===');
  };

  const fetchDestinationSuggestions = async (query) => {
    try {
      console.log('Fetching destination suggestions for query:', query);
      setSearchingDestination(true);

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=pt-BR&q=${encodeURIComponent(query)}`;
      console.log('Request URL:', url);
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
          'User-Agent': 'AMP-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch destination suggestions: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      const suggestions = data.map((item) => {
        const address = item.address || {};
        const titleParts = [
          address.road,
          address.house_number,
          address.neighbourhood || address.suburb,
          address.city_district,
          address.city || address.town || address.village || address.municipality || address.county,
        ].filter(Boolean);
        const subtitleParts = [
          address.state,
          address.region,
          address.country,
        ].filter(Boolean);
        const fallbackParts = item.display_name.split(',').map((part) => part.trim());
        const title = titleParts.slice(0, 3).join(', ') || fallbackParts.slice(0, 2).join(', ');
        const subtitle = subtitleParts.join(', ') || fallbackParts.slice(2).join(', ');

        return {
          id: `${item.place_id}`,
          label: title || item.display_name,
          subtitle,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        };
      });

      console.log('Processed suggestions:', suggestions);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
      setDestinationSuggestions([]);
    } finally {
      setSearchingDestination(false);
    }
  };

  const handleDestinationChange = (text) => {
    setEndLocation(text);
    setSelectedDestination(null);
    setDistance('0.0 KM');
    setDuration('');
    setMapRegion(null);
    setRouteStatus('Selecione um destino sugerido para calcular a rota');
    setShowDestinationSuggestions(true);
  };

  const handleSelectDestination = (destination) => {
    setSelectedDestination(destination);
    setEndLocation(destination.label);
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
    setDistance('0.0 KM');
    setDuration('');
    setMapRegion(null);
    setRouteStatus('Destino selecionado. Toque em "Calcular Km" para buscar a rota');
  };

  const handleCalculateDistance = async () => {
    const origin = selectedStartLocation || currentLocation;

    if (!origin?.latitude || !origin?.longitude) {
      Alert.alert('Aviso', 'Aguardando localização de partida...');
      return;
    }

    if (!endLocation) {
      Alert.alert('Aviso', 'Por favor, informe o destino');
      return;
    }

    if (!selectedDestination?.latitude || !selectedDestination?.longitude) {
      Alert.alert('Aviso', 'Selecione um destino sugerido para calcular a distância');
      return;
    }

    try {
      setCalculatingRoute(true);
      setRouteStatus('Calculando rota...');

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${selectedDestination.longitude},${selectedDestination.latitude}?overview=simplified&geometries=geojson&steps=false`;
      const response = await fetch(routeUrl, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
        },
      });

      if (!response.ok) {
        throw new Error(`Falha ao calcular rota: ${response.status}`);
      }

      const data = await response.json();
      const routeData = data.routes?.[0];

      if (!routeData) {
        throw new Error('Rota não encontrada');
      }

      const geoJsonCoords = routeData.geometry?.coordinates || [];
      const nativeCoords = geoJsonCoords.map(([lon, lat]) => {
        if (typeof lat === 'number' && typeof lon === 'number') {
          return { latitude: lat, longitude: lon };
        }
        return null;
      }).filter(Boolean);
      console.log('nativeCoords.length:', nativeCoords.length);
      console.log('nativeCoords[0]:', nativeCoords[0]);
      console.log('nativeCoords last:', nativeCoords[nativeCoords.length - 1]);
      setRouteCoordinates(nativeCoords);

      // Calculate and set map region with safe deltas
      const midLat = (origin.latitude + selectedDestination.latitude) / 2;
      const midLon = (origin.longitude + selectedDestination.longitude) / 2;
      const latDelta = Math.max(
        Math.abs(origin.latitude - selectedDestination.latitude) * 1.5,
        0.02
      );
      const lonDelta = Math.max(
        Math.abs(origin.longitude - selectedDestination.longitude) * 1.5,
        0.02
      );

      console.log({
        origin: origin,
        destination: selectedDestination,
        midLat,
        midLon,
        latDelta,
        lonDelta,
      });

      const newRegion = {
        latitude: midLat,
        longitude: midLon,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
      };

      setMapRegion(newRegion);
      
      // Animate to region on map
      mapRef.current?.animateToRegion(newRegion, 1000);

      setDistance(formatDistance(routeData.distance));
      setDuration(formatDuration(routeData.duration));
      setRouteStatus('Rota calculada com sucesso');
    } catch (error) {
      console.error('Error calculating distance:', error);
      setDistance('0.0 KM');
      setDuration('');
      setRouteCoordinates([]);
      setMapRegion(null);
      setRouteStatus('Não foi possível obter a rota pela API no momento');
      Alert.alert('Erro', 'Não foi possível calcular a rota e a distância');
    } finally {
      setCalculatingRoute(false);
    }
  };

  const getMaintenanceRecommendations = (distanceKm) => {
    if (!distanceKm) {
      return [
        'Verificar nível do óleo',
        'Checar pressão dos pneus'
      ];
    }

    if (distanceKm < 500) {
      return [
        'Verificar nível do óleo',
        'Checar pressão dos pneus'
      ];
    } else if (distanceKm >= 500 && distanceKm < 1500) {
      return [
        'Verificar nível do óleo',
        'Checar pressão dos pneus',
        'Verificar sistema de freios',
        'Revisar nível do líquido de arrefecimento'
      ];
    } else if (distanceKm >= 1500 && distanceKm < 3000) {
      return [
        'Trocar óleo do motor (se próximo do vencimento)',
        'Verificar sistema de freios completo',
        'Checar alinhamento e balanceamento',
        'Revisar nível do líquido de arrefecimento',
        'Inspecionar bateria e cabos',
        'Verificar pressão e estado dos pneus'
      ];
    } else {
      return [
        'Trocar óleo do motor e filtro',
        'Revisar sistema de freios completo (pastilhas, discos, fluido)',
        'Verificar alinhamento e balanceamento',
        'Checar nível e qualidade do líquido de arrefecimento',
        'Inspecionar sistema de suspensão',
        'Verificar bateria, cabos e terminais',
        'Checar estado dos pneus (desgaste, pressão)',
        'Revisar nível do fluido de direção hidráulica',
        'Inspecionar correias e mangueiras do motor'
      ];
    }
  };

  const handleGenerateReport = () => {
    if (distance === '0.0 KM') {
      Alert.alert('Aviso', 'Calcule a distância primeiro');
      return;
    }
    const numericDistance = parseFloat(distance.replace(' KM', '').replace(',', '.'));
    
    const newTrip = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-BR'),
      startLocation: startLocation,
      endLocation: endLocation,
      distance: distance,
      duration: duration,
      vehicleStatus: numericDistance < 1500 ? 'Bom estado geral' : 'Requer atenção',
      maintenanceItems: getMaintenanceRecommendations(numericDistance)
    };

    navigation.navigate('TripHistory', { user: loggedUser, newTrip: newTrip });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={require('../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>PLANEJAMENTO DE VIAGEM</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subtitle}>Planeje a sua viagem com segurança.</Text>

        <View style={styles.mapContainer}>
          {(() => {
            const origin = selectedStartLocation || currentLocation;
            const hasRouteData = origin && selectedDestination && mapRegion;
            
            if (calculatingRoute) {
              return (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="large" color="#FFCF00" />
                  <Text style={styles.mapText}>{routeStatus}</Text>
                </View>
              );
            }
            
            if (hasRouteData) {
              const coords = origin;
              const dest = selectedDestination;
              
              return (
                <View style={styles.mapPreviewWrapper}>
                  <MapView
                    ref={mapRef}
                    style={styles.mapImage}
                    initialRegion={mapRegion}
                    onRegionChangeComplete={(newRegion) => {
                      if (newRegion) {
                        setMapRegion(newRegion);
                      }
                    }}
                  >
                    {/* OpenStreetMap tiles */}
                    <UrlTile
                      urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maximumZ={19}
                    />
                    {coords?.latitude && coords?.longitude && (
                      <Marker coordinate={coords} title="Origem" pinColor="#4CAF50" />
                    )}
                    {dest?.latitude && dest?.longitude && (
                      <Marker coordinate={dest} title="Destino" pinColor="#FF5722" />
                    )}
                    {routeCoordinates.length > 0 && (
                      <Polyline
                        coordinates={routeCoordinates.filter((c) => 
                        Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
                      )}
                        strokeColor="#1f6feb"
                        strokeWidth={5}
                      />
                    )}
                  </MapView>
                  <View style={styles.mapOverlay}>
                    <View style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>{distance}</Text>
                      {!!duration && <Text style={styles.routeBadgeSubtext}>Tempo estimado: {duration}</Text>}
                    </View>
                    <TouchableOpacity style={styles.mapLinkButton} onPress={openRouteInMap}>
                      <MaterialIcons name="open-in-new" size={18} color="#FFF" />
                      <Text style={styles.mapLinkButtonText}>Abrir rota</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } else {
              return (
                <View style={styles.mapPlaceholder}>
                  <FontAwesome5 name="map-marked-alt" size={60} color="#2C2C2C" />
                  <Text style={styles.mapText}>{routeStatus}</Text>
                  {currentLocation?.latitude && currentLocation?.longitude && (
                    <View style={styles.locationInfoContainer}>
                      <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                      <Text style={styles.locationInfo}>
                        {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
          })()}
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
                onChangeText={handleStartChange}
                onFocus={() => setShowStartSuggestions(true)}
                editable={true}
              />
              <TouchableOpacity onPress={handleResetToCurrentLocation} style={styles.resetButton}>
                <MaterialIcons name="refresh" size={18} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            {(searchingStart || (showStartSuggestions && startSuggestions.length > 0)) && (
              <View style={styles.suggestionsContainer}>
                {searchingStart && (
                  <View style={styles.suggestionLoading}>
                    <ActivityIndicator size="small" color="#2C2C2C" />
                    <Text style={styles.suggestionLoadingText}>Buscando endereços...</Text>
                  </View>
                )}
                {!searchingStart && startSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectStart(suggestion)}
                  >
                    <MaterialIcons name="location-on" size={18} color="#4CAF50" />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionTitle}>{suggestion.label}</Text>
                      {!!suggestion.subtitle && (
                        <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destino</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#FF5722" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Pra onde?"
                value={endLocation}
                onChangeText={handleDestinationChange}
                onFocus={() => setShowDestinationSuggestions(true)}
              />
            </View>
            {(searchingDestination || (showDestinationSuggestions && destinationSuggestions.length > 0)) && (
              <View style={styles.suggestionsContainer}>
                {searchingDestination && (
                  <View style={styles.suggestionLoading}>
                    <ActivityIndicator size="small" color="#2C2C2C" />
                    <Text style={styles.suggestionLoadingText}>Buscando endereços...</Text>
                  </View>
                )}
                {!searchingDestination && destinationSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectDestination(suggestion)}
                  >
                    <MaterialIcons name="location-on" size={18} color="#FF5722" />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionTitle}>{suggestion.label}</Text>
                      {!!suggestion.subtitle && (
                        <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.distanceContainer}>
            <Text style={styles.label}>Quilometragem:</Text>
            <View style={styles.distanceBox}>
              <Text style={styles.distanceText}>{distance}</Text>
              <TouchableOpacity
                style={styles.calculateButton}
                onPress={handleCalculateDistance}
                disabled={calculatingRoute}
              >
                {calculatingRoute ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.calculateButtonText}>Calcular Km</Text>
                )}
              </TouchableOpacity>
            </View>
            {!!duration && (
              <Text style={styles.durationText}>Tempo estimado de trajeto: {duration}</Text>
            )}
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
    flex: 1
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    zIndex: 2,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    bottom: 16,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
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
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
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
  mapPreviewWrapper: {
    flex: 1,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeBadge: {
    backgroundColor: '#ffffffee',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '65%',
  },
  routeBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  routeBadgeSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#444444',
  },
  mapLinkButton: {
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapLinkButtonText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
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
  resetButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#00000022',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  suggestionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2C2C2C',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000011',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  suggestionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#666666',
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
  durationText: {
    marginTop: 10,
    fontSize: 13,
    color: '#444444',
  },
  calculateButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#2E2E2E',
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
    backgroundColor: '#2E2E2E',
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
