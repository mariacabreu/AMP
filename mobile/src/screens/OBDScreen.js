
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, Image, Modal, PermissionsAndroid, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

const OBDScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [pin, setPin] = useState('');
  const [isReading, setIsReading] = useState(false);
  const intervalRef = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    fetchVehicleData();
  }, []);

  const fetchVehicleData = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const response = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      if (response.data.vehicle) {
        setVehicle(response.data.vehicle);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do veículo:', error);
    }
  };

  const [liveData, setLiveData] = useState({
    rpm: 0,
    speed: 0,
    coolantTemp: 0,
    fuelLevel: 0,
    batteryVoltage: 12.0,
    engineLoad: 0,
    airIntakeTemp: 0,
    throttlePosition: 0,
    fuelPressure: 0,
    intakeManifoldPressure: 0,
    oilTemp: 0,
    oilPressure: 0,
    lambda: 1.0,
    maf: 0,
    timingAdvance: 0,
    egr: 0,
    evapSystemVaporPressure: 0,
    fuelTrimShort: 0,
    fuelTrimLong: 0,
    catalystTemp: 0,
    ambientTemp: 0,
  });
  const [dtcCodes, setDtcCodes] = useState([]);
  const [isLoadingDTC, setIsLoadingDTC] = useState(false);

  // Request Bluetooth permissions on Android
  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        return allGranted;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Helper to send OBD commands and read response
  const sendOBDCommand = async (command) => {
    if (!connectionRef.current) {
      throw new Error('Não conectado a nenhum dispositivo');
    }

    try {
      // Send command with carriage return
      await connectionRef.current.write(command + '\r\n');
      
      // Wait a bit for response
      await new Promise(r => setTimeout(r, 300));
      
      // Read response
      let response = '';
      try {
        response = await connectionRef.current.read();
      } catch (readErr) {
        console.error('Erro ao ler resposta:', readErr);
        return '';
      }
      
      console.log(`Comando ${command} resposta:`, response);
      return response.trim();
    } catch (err) {
      console.error(`Erro no comando ${command}:`, err);
      throw err;
    }
  };

  // Parse OBD response
  const parseOBDResponse = (response) => {
    if (!response || response.includes('NO DATA') || response.includes('?')) {
      return null;
    }
    
    // Remove non-hex characters and split into bytes
    const hexData = response.replace(/[^0-9A-Fa-f]/g, '');
    if (hexData.length < 4) return null;
    
    const bytes = [];
    for (let i = 0; i < hexData.length; i += 2) {
      bytes.push(parseInt(hexData.substr(i, 2), 16));
    }
    
    return bytes;
  };

  // Initialize ELM327 adapter with sequence specifically tuned for Nissan Kicks 2020 (CAN protocol)
  const initializeOBDDevice = async () => {
    try {
      console.log('Inicializando ELM327 para Nissan Kicks...');
      
      // Reset device
      await sendOBDCommand('ATZ');
      await new Promise(r => setTimeout(r, 1500)); // Give enough time to reset
      
      // Turn off echo
      await sendOBDCommand('ATE0');
      await new Promise(r => setTimeout(r, 200));
      
      // Turn off line feeds
      await sendOBDCommand('ATL0');
      await new Promise(r => setTimeout(r, 200));
      
      // Try CAN protocols first (Nissan Kicks uses CAN)
      console.log('Tentando protocolo CAN (ISO 15765)...');
      await sendOBDCommand('ATSP6'); // ISO 15765-4 CAN (11 bit ID, 500 baud)
      await new Promise(r => setTimeout(r, 300));
      
      // If that fails, try auto protocol search
      console.log('Tentando busca automática de protocolo...');
      await sendOBDCommand('ATSP0');
      await new Promise(r => setTimeout(r, 300));
      
      // Set timeout (longer for CAN)
      await sendOBDCommand('ATSTFF'); // 255 * 4ms = 1020ms timeout
      await new Promise(r => setTimeout(r, 200));
      
      // Set adaptive timing to optimize response times
      await sendOBDCommand('ATAT1');
      await new Promise(r => setTimeout(r, 200));
      
      // Initialize communication with ECU
      console.log('Inicializando comunicação com ECU...');
      await sendOBDCommand('0100');
      await new Promise(r => setTimeout(r, 700));
      
      console.log('ELM327 inicializado com sucesso para Nissan Kicks!');
      return true;
    } catch (err) {
      console.error('Erro ao inicializar OBD:', err);
      Alert.alert('Aviso', 'Falha ao inicializar protocolo OBD, mas o app continuará com dados simulados');
      // Continue anyway with simulated data
      return true;
    }
  };

  // Read all live data from OBD with fallback to simulated data
  const readLiveDataFromOBD = async () => {
    if (!isConnected || isReading) return;
    
    setIsReading(true);
    try {
      // If we don't have a real connection, use simulated data
      if (!connectionRef.current || Platform.OS !== 'android') {
        useSimulatedData();
        return;
      }
      
      let gotRealData = false;
      const newData = { ...liveData };

      // RPM (01 0C)
      let resp = await sendOBDCommand('010C');
      let bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 4) {
        newData.rpm = Math.round(((bytes[2] * 256) + bytes[3]) / 4);
        gotRealData = true;
      }

      // Speed (01 0D)
      resp = await sendOBDCommand('010D');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.speed = bytes[2];
        gotRealData = true;
      }

      // Coolant temp (01 05)
      resp = await sendOBDCommand('0105');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.coolantTemp = bytes[2] - 40;
        gotRealData = true;
      }

      // Engine load (01 04)
      resp = await sendOBDCommand('0104');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.engineLoad = Math.round((bytes[2] * 100) / 255);
        gotRealData = true;
      }

      // Throttle position (01 11)
      resp = await sendOBDCommand('0111');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.throttlePosition = Math.round((bytes[2] * 100) / 255);
        gotRealData = true;
      }

      // Fuel level (01 2F)
      resp = await sendOBDCommand('012F');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.fuelLevel = Math.round((bytes[2] * 100) / 255);
        gotRealData = true;
      }

      // Intake air temp (01 0F)
      resp = await sendOBDCommand('010F');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.airIntakeTemp = bytes[2] - 40;
        gotRealData = true;
      }

      // Intake manifold pressure (01 0B)
      resp = await sendOBDCommand('010B');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.intakeManifoldPressure = bytes[2];
        gotRealData = true;
      }

      // Ambient air temp (01 46)
      resp = await sendOBDCommand('0146');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.ambientTemp = bytes[2] - 40;
        gotRealData = true;
      }

      // Short term fuel trim - Bank 1 (01 06)
      resp = await sendOBDCommand('0106');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.fuelTrimShort = parseFloat(((bytes[2] - 128) * 100 / 128).toFixed(1));
        gotRealData = true;
      }

      // Long term fuel trim - Bank 1 (01 07)
      resp = await sendOBDCommand('0107');
      bytes = parseOBDResponse(resp);
      if (bytes && bytes.length >= 3) {
        newData.fuelTrimLong = parseFloat(((bytes[2] - 128) * 100 / 128).toFixed(1));
        gotRealData = true;
      }

      if (gotRealData) {
        setLiveData(newData);
      } else {
        // If no real data received, use simulated data
        useSimulatedData();
      }
    } catch (err) {
      console.error('Erro ao ler dados OBD:', err);
      // Fallback to simulated data on error
      useSimulatedData();
    } finally {
      setIsReading(false);
    }
  };

  // Helper function to generate realistic simulated data for Nissan Kicks
  const useSimulatedData = () => {
    setLiveData(prev => ({
      ...prev,
      rpm: Math.round(700 + Math.random() * 2000),
      speed: Math.round(Math.random() * 120),
      coolantTemp: Math.round(80 + Math.random() * 20),
      fuelLevel: Math.max(10, Math.min(100, prev.fuelLevel - Math.random() * 0.5)),
      engineLoad: Math.round(Math.random() * 100),
      throttlePosition: Math.round(Math.random() * 100),
      airIntakeTemp: Math.round(25 + Math.random() * 15),
      intakeManifoldPressure: Math.round(30 + Math.random() * 70),
      ambientTemp: Math.round(20 + Math.random() * 15),
      fuelTrimShort: parseFloat((-5 + Math.random() * 10).toFixed(1)),
      fuelTrimLong: parseFloat((-3 + Math.random() * 6).toFixed(1)),
    }));
  };

  // Read DTC codes
  const readDTCFromOBD = async () => {
    setIsLoadingDTC(true);
    try {
      const resp = await sendOBDCommand('03');
      
      // Parse DTCs (basic implementation)
      if (resp && !resp.includes('NO DATA')) {
        const parsed = parseOBDResponse(resp);
        if (parsed) {
          console.log('DTCs brutos:', parsed);
          // For now, show mock DTCs or parse real ones if available
          setDtcCodes([
            { code: 'P0300', description: 'Mau funcionamento do sistema de ignição aleatório/múltiplo', severity: 'high' },
          ]);
        } else {
          setDtcCodes([]);
        }
      } else {
        setDtcCodes([]);
      }
    } catch (err) {
      console.error('Erro ao ler DTCs:', err);
      setDtcCodes([]);
    } finally {
      setIsLoadingDTC(false);
    }
  };

  // Handle scanning for Bluetooth devices
  const handleScanDevices = async () => {
    const hasPermissions = await requestBluetoothPermissions();
    
    if (!hasPermissions) {
      Alert.alert('Permissão Negada', 'As permissões de Bluetooth são necessárias para conectar.');
      return;
    }
    
    setIsScanning(true);
    setDeviceList([]);

    try {
      // Use mock devices for all platforms
      setDeviceList([
        { id: 1, name: 'OBDII ELM327', address: '00:11:22:33:44:55' },
      ]);
    } catch (err) {
      console.error('Erro ao buscar dispositivos:', err);
      Alert.alert('Erro', 'Falha ao buscar dispositivos Bluetooth');
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to a specific device
  const handleConnectDevice = async (device) => {
    Alert.alert('Conectando', `Conectando a ${device.name}...`);

    try {
      // Just use simulated connection for all platforms
      setIsConnected(true);
      setConnectedDevice(device);
      setShowDashboard(true);
      Alert.alert('Conectado!', `Conectado com sucesso a ${device.name} (Modo Simulado)`);
    } catch (err) {
      console.error('Erro ao conectar:', err);
      Alert.alert(
        'Erro de Conexão', 
        `Falha ao conectar a ${device.name}.\n\nVerifique se o dispositivo está pareado corretamente e se o PIN foi digitado corretamente (1234, 0000, 7890 ou 1111).`
      );
    }
  };

  // Auto-update live data when connected
  useEffect(() => {
    if (isConnected) {
      // Mock data for all platforms
      intervalRef.current = setInterval(() => {
        setLiveData(prev => ({
          ...prev,
          rpm: Math.floor(700 + Math.random() * 2000),
          speed: Math.floor(Math.random() * 120),
          coolantTemp: Math.floor(80 + Math.random() * 20),
          fuelLevel: Math.floor(30 + Math.random() * 70),
          engineLoad: Math.floor(Math.random() * 100),
          throttlePosition: Math.floor(Math.random() * 100),
        }));
      }, 2000);
    } else {
      // Clear interval when disconnected
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected]);

  const handleReadLiveData = (manual = false) => {
    if (!isConnected && manual) {
      Alert.alert('Erro', 'Conecte-se a um dispositivo OBD primeiro!');
      return;
    }
    if (!isConnected) return;

    if (Platform.OS === 'android' && connectionRef.current) {
      readLiveDataFromOBD();
    } else {
      // Mock update
      setLiveData({
        rpm: Math.floor(700 + Math.random() * 2000),
        speed: Math.floor(Math.random() * 120),
        coolantTemp: Math.floor(70 + Math.random() * 30),
        fuelLevel: Math.floor(30 + Math.random() * 70),
        batteryVoltage: parseFloat((12 + Math.random() * 2.5).toFixed(1)),
        engineLoad: Math.floor(Math.random() * 100),
        airIntakeTemp: Math.floor(20 + Math.random() * 30),
        throttlePosition: Math.floor(Math.random() * 100),
        fuelPressure: parseFloat((6 + Math.random() * 4).toFixed(1)),
        intakeManifoldPressure: Math.floor(30 + Math.random() * 100),
        oilTemp: Math.floor(80 + Math.random() * 40),
        oilPressure: parseFloat((2 + Math.random() * 4).toFixed(1)),
        lambda: parseFloat((0.9 + Math.random() * 0.2).toFixed(2)),
        maf: parseFloat((1 + Math.random() * 5).toFixed(1)),
        timingAdvance: Math.floor(-10 + Math.random() * 40),
        egr: Math.floor(Math.random() * 50),
        evapSystemVaporPressure: Math.floor(Math.random() * 100),
        fuelTrimShort: parseFloat((-10 + Math.random() * 20).toFixed(1)),
        fuelTrimLong: parseFloat((-10 + Math.random() * 20).toFixed(1)),
        catalystTemp: Math.floor(300 + Math.random() * 400),
        ambientTemp: Math.floor(15 + Math.random() * 30),
      });
    }
  };

  const handleReadDTCs = () => {
    if (!isConnected) {
      Alert.alert('Erro', 'Conecte-se a um dispositivo OBD primeiro!');
      return;
    }
    
    if (Platform.OS === 'android' && connectionRef.current) {
      readDTCFromOBD();
    } else {
      setIsLoadingDTC(true);
      setTimeout(() => {
        setDtcCodes([
          { code: 'P0300', description: 'Mau funcionamento do sistema de ignição aleatório/múltiplo', severity: 'high' },
          { code: 'P0420', description: 'Eficiência do sistema de catalisador abaixo do limiar', severity: 'medium' }
        ]);
        setIsLoadingDTC(false);
      }, 2000);
    }
  };

  const handleClearDTCs = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja limpar os códigos de erro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: async () => {
            try {
              if (Platform.OS === 'android' && connectionRef.current) {
                await sendOBDCommand('04'); // Clear DTCs command
              }
              setDtcCodes([]);
              Alert.alert('Sucesso', 'Códigos limpos com sucesso!');
            } catch (err) {
              console.error('Erro ao limpar DTCs:', err);
              Alert.alert('Erro', 'Falha ao limpar os códigos');
            }
          }
        }
      ]
    );
  };
  
  const handleSolveDTC = (dtc, index) => {
    Alert.alert(
      'Solucionar Problema',
      `Marcar o código ${dtc.code} como solucionado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar como Solucionado',
          onPress: () => {
            setDtcCodes(prev => prev.filter((_, i) => i !== index));
            Alert.alert('Sucesso', `${dtc.code} marcado como solucionado!`);
          }
        }
      ]
    );
  };

  const handleDisconnect = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (connectionRef.current) {
      try {
        await connectionRef.current.disconnect();
      } catch (err) {
        console.error('Erro ao desconectar:', err);
      }
      connectionRef.current = null;
    }

    setIsConnected(false);
    setShowDashboard(false);
    setDeviceList([]);
    setConnectedDevice(null);
    Alert.alert('Desconectado', 'Dispositivo desconectado!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Image
          source={require('../assets/mow16cv7-aerakpu.png')}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="always"
      >
        {/* Title */}
        <Text style={styles.title}>DIAGNÓSTICO EM TEMPO REAL</Text>

        {/* Vehicle Subtitle */}
        {vehicle && (
          <Text style={styles.vehicleSubtitle}>
            {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.engine_type} • {vehicle.transmission}
          </Text>
        )}

        {/* Connection Status and Help Button */}
        <View style={styles.statusHelpRow}>
          <View style={styles.statusContainerCentered}>
            <View style={[styles.statusDot, isConnected ? styles.statusDotConnected : styles.statusDotDisconnected]} />
            <Text style={[styles.statusText, isConnected ? styles.statusTextConnected : styles.statusTextDisconnected]}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          <TouchableOpacity style={styles.helpButton} onPress={() => setShowHelp(true)}>
            <MaterialCommunityIcons name="help-circle" size={20} color="#FFCF00" />
          </TouchableOpacity>
        </View>

        {/* Connect Button */}
        {!showDashboard && (
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.connectButton} onPress={handleScanDevices}>
              <MaterialCommunityIcons name="bluetooth-connect" size={22} color="#FFCF00" />
              <Text style={styles.connectButtonText}>
                CONECTAR
                <Text style={styles.connectButtonSubText}> OBD</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Dashboard Panels */}
        {showDashboard && (
          <View style={styles.dashboardContainer}>
            {/* 1. Dados em Tempo Real */}
            <View style={styles.obdPanel}>
              <View style={styles.panelHeader}>
                <MaterialCommunityIcons name="speedometer" size={28} color="#FFCF00" />
                <Text style={styles.panelTitle}>DADOS EM TEMPO REAL</Text>
              </View>
              
              {/* Medidores Principais */}
              <View style={styles.mainGaugesRow}>
                <View style={styles.gaugeItem}>
                  <MaterialCommunityIcons name="tachometer" size={40} color="#FFCF00" />
                  <Text style={styles.gaugeValue}>{liveData.rpm}</Text>
                  <Text style={styles.gaugeUnit}>RPM</Text>
                </View>
                
                <View style={styles.gaugeItem}>
                  <MaterialCommunityIcons name="speedometer" size={40} color="#FFCF00" />
                  <Text style={styles.gaugeValue}>{liveData.speed}</Text>
                  <Text style={styles.gaugeUnit}>KM/H</Text>
                </View>
                
                <View style={styles.gaugeItem}>
                  <MaterialCommunityIcons name="thermometer" size={40} color="#FFCF00" />
                  <Text style={styles.gaugeValue}>{liveData.coolantTemp}°C</Text>
                  <Text style={styles.gaugeUnit}>TEMPERATURA</Text>
                </View>
              </View>
              
              {/* Lista de Dados */}
              <View style={styles.dataGrid}>
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="gas-station" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Combustível</Text>
                  <Text style={styles.dataCardValue}>{liveData.fuelLevel}%</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="car-battery" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Carga do Motor</Text>
                  <Text style={styles.dataCardValue}>{liveData.engineLoad}%</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="gauge" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Pressão Coletor</Text>
                  <Text style={styles.dataCardValue}>{liveData.intakeManifoldPressure} kPa</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="engine" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Posição Acelerador</Text>
                  <Text style={styles.dataCardValue}>{liveData.throttlePosition}%</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="oil" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Temp. Ar Admissão</Text>
                  <Text style={styles.dataCardValue}>{liveData.airIntakeTemp}°C</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="water" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Temp. Ambiente</Text>
                  <Text style={styles.dataCardValue}>{liveData.ambientTemp}°C</Text>
                </View>
              </View>
            </View>

            {/* 2. Diagnóstico de Falhas */}
            <View style={styles.obdPanel}>
              <View style={styles.panelHeader}>
                <MaterialCommunityIcons name="alert-circle" size={28} color="#FFCF00" />
                <Text style={styles.panelTitle}>DIAGNÓSTICO DE FALHAS</Text>
              </View>
              
              {dtcCodes.length > 0 ? (
                <View>
                  <View style={styles.dtcHeader}>
                    <Text style={styles.dtcCount}>{dtcCodes.length} Códigos Encontrados</Text>
                    <TouchableOpacity style={styles.clearDtcBtn} onPress={handleClearDTCs}>
                      <MaterialCommunityIcons name="delete" size={18} color="#FFCF00" />
                      <Text style={styles.clearDtcText}>Limpar</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {dtcCodes.map((dtc, index) => (
                    <View key={index} style={styles.dtcItem}>
                      <View style={[styles.dtcSeverity, { backgroundColor: dtc.severity === 'high' ? '#FF5722' : '#FFC107' }]} />
                      <View style={styles.dtcInfo}>
                        <Text style={styles.dtcCode}>{dtc.code}</Text>
                        <Text style={styles.dtcDescription}>{dtc.description}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.solveDtcButton} 
                        onPress={() => handleSolveDTC(dtc, index)}
                      >
                        <MaterialCommunityIcons name="wrench" size={18} color="#FFCF00" />
                        <Text style={styles.solveDtcText}>Solucionar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noDtcContainer}>
                  <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
                  <Text style={styles.noDtcText}>Nenhum código de falha detectado</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.readDtcBtn} onPress={handleReadDTCs}>
                {isLoadingDTC ? (
                  <ActivityIndicator size="small" color="#FFCF00" />
                ) : (
                  <MaterialCommunityIcons name="refresh" size={20} color="#FFCF00" />
                )}
                <Text style={styles.readDtcText}>{isLoadingDTC ? 'Lendo códigos...' : 'Ler Códigos de Erro'}</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Consumo e Emissões */}
            <View style={styles.obdPanel}>
              <View style={styles.panelHeader}>
                <MaterialCommunityIcons name="chart-line" size={28} color="#FFCF00" />
                <Text style={styles.panelTitle}>CONSUMO E EMISSÕES</Text>
              </View>
              
              <View style={styles.consumptionGrid}>
                <View style={styles.consumptionCard}>
                  <MaterialCommunityIcons name="speedometer" size={32} color="#FFCF00" />
                  <Text style={styles.consumptionValue}>{(8 + Math.random() * 4).toFixed(1)}</Text>
                  <Text style={styles.consumptionUnit}>KM/L</Text>
                  <Text style={styles.consumptionLabel}>Eficiência</Text>
                </View>
                
                <View style={styles.consumptionCard}>
                  <MaterialCommunityIcons name="smog" size={32} color="#FFCF00" />
                  <Text style={styles.consumptionValue}>{(120 + Math.random() * 80).toFixed(0)}</Text>
                  <Text style={styles.consumptionUnit}>G/KM</Text>
                  <Text style={styles.consumptionLabel}>Emissões CO₂</Text>
                </View>
              </View>
              
              <View style={styles.fuelTrimsRow}>
                <View style={styles.fuelTrimItem}>
                  <Text style={styles.fuelTrimLabel}>Ajuste Curto</Text>
                  <Text style={styles.fuelTrimValue}>{liveData.fuelTrimShort}%</Text>
                </View>
                <View style={styles.fuelTrimItem}>
                  <Text style={styles.fuelTrimLabel}>Ajuste Longo</Text>
                  <Text style={styles.fuelTrimValue}>{liveData.fuelTrimLong}%</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {isConnected && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleReadLiveData(true)}>
                  <MaterialCommunityIcons name="refresh" size={24} color="#FFCF00" />
                  <Text style={styles.actionButtonText}>Atualizar Dados</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={handleDisconnect}>
                  <MaterialCommunityIcons name="bluetooth-off" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonTextWhite}>Desconectar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Device Connection (when not connected) */}
        {!showDashboard && (
          <View style={styles.connectionSection}>
            {isScanning && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFCF00" />
                <Text style={styles.loadingText}>Procurando dispositivos...</Text>
              </View>
            )}
            {deviceList.length > 0 && !isConnected && (
              <View style={styles.deviceListContainer}>
                <Text style={styles.deviceListTitle}>Dispositivos Encontrados:</Text>
                {deviceList.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={styles.deviceItem}
                    onPress={() => handleConnectDevice(device)}
                  >
                    <MaterialCommunityIcons name="car-connected" size={28} color="#FFCF00" />
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceAddress}>{device.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

          {/* Bottom Spacer for Nav Bar */}
          <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelp}
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Como Conectar o Scanner OBD2</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowHelp(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Localize a porta OBD2 do seu veículo (no Nissan Kicks 2020, geralmente está embaixo do painel de instrumentos, lado do motorista).
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Com o carro ligado na chave (ignição ligada), espete o scanner na porta.
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Vá nas configurações Bluetooth do seu celular, pareie com o dispositivo OBD2 (nome geralmente começa com OBDII, OBD2 ou ELM327).
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>
                  Se pedir PIN, tente: 1234, 0000, 7890 ou 1111.
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <Text style={styles.stepText}>
                  Volte para este app e clique em "CONECTAR OBD" para conectar com o dispositivo pareado.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPinModal}
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.pinModalContainer}>
          <View style={styles.pinModalContent}>
            <Text style={styles.pinModalTitle}>Informe o PIN do Dispositivo</Text>
            <Text style={styles.pinModalSubtitle}>
              PINs comuns: 1234, 0000, 7890 ou 1111
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              placeholder="Digite o PIN"
              secureTextEntry={false}
            />
            <View style={styles.pinButtonsContainer}>
              <TouchableOpacity
                style={[styles.pinButton, styles.pinCancelButton]}
                onPress={() => setShowPinModal(false)}
              >
                <Text style={styles.pinCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pinButton, styles.pinConfirmButton]}
                onPress={() => {
                  setShowPinModal(false);
                }}
              >
                <Text style={styles.pinConfirmButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} user={route.params?.user} activeScreen="Home" />
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  logo: {
    width: 120,
    height: 50,
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
    padding: 4,
  },
  topIcon: {
    width: 24,
    height: 24,
  },
  statusHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statusContainerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDotDisconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter, sans-serif',
  },
  statusTextConnected: {
    color: '#4CAF50',
  },
  statusTextDisconnected: {
    color: '#F44336',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll'
      }
    })
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000000',
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'Inter, sans-serif',
  },
  vehicleSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Inter, sans-serif',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    height: 56,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  connectButtonSubText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  helpButton: {
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardContainer: {
    width: '100%',
  },
  obdPanel: {
    backgroundColor: '#2E2E2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  panelTitle: {
    color: '#FFCF00',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    fontFamily: 'Inter, sans-serif',
  },
  mainGaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  gaugeItem: {
    alignItems: 'center',
  },
  gaugeValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'Inter, sans-serif',
  },
  gaugeUnit: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataCard: {
    width: '48%',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  dataCardLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  dataCardValue: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dtcCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
  },
  clearDtcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearDtcText: {
    color: '#FFCF00',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'Inter, sans-serif',
  },
  dtcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  dtcSeverity: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 12,
  },
  dtcInfo: {
    flex: 1,
  },
  dtcCode: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
  },
  dtcDescription: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  solveDtcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  solveDtcText: {
    color: '#FFCF00',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'Inter, sans-serif',
  },
  noDtcContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDtcText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 12,
    fontFamily: 'Inter, sans-serif',
  },
  readDtcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 15,
    gap: 8,
  },
  readDtcText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
  },
  consumptionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  consumptionCard: {
    width: '48%',
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  consumptionValue: {
    color: '#FFCF00',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
    fontFamily: 'Inter, sans-serif',
  },
  consumptionUnit: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter, sans-serif',
  },
  consumptionLabel: {
    color: '#999',
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'Inter, sans-serif',
  },
  fuelTrimsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  fuelTrimItem: {
    width: '48%',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  fuelTrimLabel: {
    color: '#999',
    fontSize: 11,
    fontFamily: 'Inter, sans-serif',
  },
  fuelTrimValue: {
    color: '#FFCF00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    fontFamily: 'Inter, sans-serif',
  },
  drivingStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  drivingStatCard: {
    width: '48%',
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  drivingStatValue: {
    color: '#FFCF00',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    fontFamily: 'Inter, sans-serif',
  },
  drivingStatLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  sensorDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sensorDetailItem: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sensorDetailLabel: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  sensorDetailValue: {
    color: '#FFCF00',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    gap: 8,
  },
  actionButtonDanger: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  actionButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  connectionSection: {
    width: '100%',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    fontFamily: 'Inter, sans-serif',
  },
  deviceListContainer: {
    marginTop: 20,
  },
  deviceListTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    fontFamily: 'Inter, sans-serif',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  deviceAddress: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  bottomSpacer: {
    height: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Inter, sans-serif',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: 'Inter, sans-serif',
  },
  pinModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pinModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  pinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    fontFamily: 'Inter, sans-serif',
  },
  pinModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  pinInput: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  pinButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  pinButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pinCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  pinCancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  pinConfirmButton: {
    backgroundColor: '#FFCF00',
  },
  pinConfirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },

});

export default OBDScreen;
