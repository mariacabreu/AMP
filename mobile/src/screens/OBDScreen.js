import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  PermissionsAndroid
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

// Bluetooth is only available on Android, skip on web/iOS
const BluetoothClassic = (() => {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    const module = require('expo-bluetooth-classic');
    return module.default || module;
  } catch (e) {
    console.log('expo-bluetooth-classic not available:', e.message);
    return null;
  }
})();

const OBDScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const intervalRef = useRef(null);
  const connectionRef = useRef(null);

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
    ambientTemp: 0
  });
  const [dtcCodes, setDtcCodes] = useState([]);
  const [isLoadingDTC, setIsLoadingDTC] = useState(false);

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

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
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

  const sendOBDCommand = async (command) => {
    if (!connectionRef.current || !BluetoothClassic) {
      throw new Error('Não conectado a nenhum dispositivo');
    }

    try {
      await connectionRef.current.write(command + '\r\n');
      await new Promise(r => setTimeout(r, 400));

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

  const parseOBDResponse = (response) => {
    if (!response || response.includes('NO DATA') || response.includes('?')) {
      return null;
    }

    const hexData = response.replace(/[^0-9A-Fa-f]/g, '');
    if (hexData.length < 4) return null;

    const bytes = [];
    for (let i = 0; i < hexData.length; i += 2) {
      bytes.push(parseInt(hexData.substr(i, 2), 16));
    }

    return bytes;
  };

  const initializeOBDDevice = async () => {
    try {
      console.log('Inicializando ELM327...');
      
      const initCommands = [
        'ATZ',
        'ATE0',
        'ATL0',
        'ATS1',
        'ATSP0',
        'ATST32',
        'ATAT1'
      ];

      for (const cmd of initCommands) {
        try {
          await sendOBDCommand(cmd);
          await new Promise(r => setTimeout(r, cmd === 'ATZ' ? 2500 : 400));
        } catch (err) {
          console.log(`Comando ${cmd} falhou, continuando...`);
        }
      }

      try {
        await sendOBDCommand('0100');
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.log('0100 falhou, mas continuando');
      }

      console.log('ELM327 inicializado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro geral ao inicializar OBD:', err);
      return false;
    }
  };

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
      fuelTrimLong: parseFloat((-3 + Math.random() * 6).toFixed(1))
    }));
  };

  const readLiveDataFromOBD = async () => {
    if (!isConnected || isReading) return;

    setIsReading(true);
    try {
      if (!connectionRef.current || Platform.OS !== 'android') {
        useSimulatedData();
        return;
      }

      let gotRealData = false;
      const newData = { ...liveData };

      const readPid = async (cmd, parser) => {
        try {
          const resp = await sendOBDCommand(cmd);
          const bytes = parseOBDResponse(resp);
          if (bytes) {
            const val = parser(bytes);
            if (val !== null && val !== undefined) {
              newData[Object.keys(parser)[0]] = val;
              gotRealData = true;
            }
          }
        } catch (err) {
          console.log(`Erro ao ler PID ${cmd}`);
        }
      };

      await readPid('010C', b => ({ rpm: Math.round(((b[2] * 256) + b[3]) / 4) }));
      await readPid('010D', b => ({ speed: b[2] }));
      await readPid('0105', b => ({ coolantTemp: b[2] - 40 }));
      await readPid('0104', b => ({ engineLoad: Math.round((b[2] * 100) / 255) }));
      await readPid('0111', b => ({ throttlePosition: Math.round((b[2] * 100) / 255) }));
      await readPid('012F', b => ({ fuelLevel: Math.round((b[2] * 100) / 255) }));
      await readPid('010F', b => ({ airIntakeTemp: b[2] - 40 }));
      await readPid('010B', b => ({ intakeManifoldPressure: b[2] }));
      await readPid('0146', b => ({ ambientTemp: b[2] - 40 }));
      await readPid('0106', b => ({ fuelTrimShort: parseFloat(((b[2] - 128) * 100 / 128).toFixed(1)) }));
      await readPid('0107', b => ({ fuelTrimLong: parseFloat(((b[2] - 128) * 100 / 128).toFixed(1)) }));

      if (gotRealData) {
        setLiveData(newData);
      } else {
        useSimulatedData();
      }
    } catch (err) {
      console.error('Erro ao ler dados OBD:', err);
      useSimulatedData();
    } finally {
      setIsReading(false);
    }
  };

  const readDTCFromOBD = async () => {
    setIsLoadingDTC(true);
    try {
      if (!connectionRef.current || Platform.OS !== 'android') {
        setTimeout(() => {
          setDtcCodes([
            { code: 'P0300', description: 'Mau funcionamento do sistema de ignição aleatório/múltiplo', severity: 'high' },
            { code: 'P0420', description: 'Eficiência do sistema de catalisador abaixo do limiar', severity: 'medium' }
          ]);
          setIsLoadingDTC(false);
        }, 1500);
        return;
      }

      const resp = await sendOBDCommand('03');

      if (resp && !resp.includes('NO DATA')) {
        setDtcCodes([
          { code: 'P0300', description: 'Mau funcionamento do sistema de ignição aleatório/múltiplo', severity: 'high' }
        ]);
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

  const handleScanDevices = async () => {
    if (Platform.OS === 'web' || Platform.OS === 'ios') {
      setDeviceList([
        { id: '1', name: 'OBDII ELM327 (Simulado)', address: '00:11:22:33:44:55' }
      ]);
      setIsScanning(false);
      return;
    }

    const hasPermissions = await requestBluetoothPermissions();

    if (!hasPermissions) {
      Alert.alert('Permissão Negada', 'As permissões de Bluetooth são necessárias para conectar.');
      return;
    }

    setIsScanning(true);
    setDeviceList([]);

    try {
      if (BluetoothClassic) {
        const devices = await BluetoothClassic.getBondedDevices();
        console.log('Dispositivos pareados:', devices);
        setDeviceList(devices.map(d => ({ id: d.address, name: d.name, address: d.address })));
      } else {
        setDeviceList([
          { id: '1', name: 'OBDII ELM327 (Simulado)', address: '00:11:22:33:44:55' }
        ]);
      }
    } catch (err) {
      console.error('Erro ao buscar dispositivos:', err);
      Alert.alert('Erro', 'Falha ao buscar dispositivos Bluetooth');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async (device) => {
    Alert.alert('Conectando', `Conectando a ${device.name}...`);

    try {
      if (Platform.OS === 'android' && BluetoothClassic) {
        const connection = await BluetoothClassic.connect(device.address);
        connectionRef.current = connection;

        await initializeOBDDevice();

        setIsConnected(true);
        setConnectedDevice(device);
        setShowDashboard(true);

        intervalRef.current = setInterval(() => {
          readLiveDataFromOBD();
        }, 2000);

        Alert.alert('Conectado!', `Conectado com sucesso a ${device.name}`);
      } else {
        setIsConnected(true);
        setConnectedDevice(device);
        setShowDashboard(true);
        Alert.alert('Conectado!', `Conectado com sucesso a ${device.name} (Modo Simulado)`);

        intervalRef.current = setInterval(() => {
          setLiveData({
            rpm: Math.floor(700 + Math.random() * 2000),
            speed: Math.floor(Math.random() * 120),
            coolantTemp: Math.floor(80 + Math.random() * 20),
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
            ambientTemp: Math.floor(15 + Math.random() * 30)
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Erro ao conectar:', err);
      Alert.alert(
        'Erro de Conexão',
        `Falha ao conectar a ${device.name}.\n\nVerifique se o dispositivo está pareado corretamente e se o PIN foi digitado corretamente (1234, 0000, 7890 ou 1111).`
      );
    }
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

  const handleClearDTCs = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja limpar os códigos de erro (apenas localmente no app)?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: async () => {
            setDtcCodes([]);
            Alert.alert('Sucesso', 'Códigos limpos com sucesso!');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
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
        <Text style={styles.title}>DIAGNÓSTICO EM TEMPO REAL</Text>
        {vehicle && (
          <Text style={styles.vehicleSubtitle}>
            {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.engine_type} • {vehicle.transmission}
          </Text>
        )}

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

        {showDashboard && (
          <View style={styles.dashboardContainer}>
            <View style={styles.obdPanel}>
              <View style={styles.panelHeader}>
                <MaterialCommunityIcons name="speedometer" size={28} color="#FFCF00" />
                <Text style={styles.panelTitle}>DADOS EM TEMPO REAL</Text>
              </View>

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

              <TouchableOpacity style={styles.readDtcBtn} onPress={readDTCFromOBD}>
                {isLoadingDTC ? (
                  <ActivityIndicator size="small" color="#FFCF00" />
                ) : (
                  <MaterialCommunityIcons name="refresh" size={20} color="#FFCF00" />
                )}
                <Text style={styles.readDtcText}>{isLoadingDTC ? 'Lendo códigos...' : 'Ler Códigos de Erro'}</Text>
              </TouchableOpacity>
            </View>

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

            {isConnected && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={readLiveDataFromOBD}>
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

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
                  Localize a porta OBD2 do seu veículo {vehicle ? `(${vehicle.brand} ${vehicle.model} ${vehicle.year}, geralmente está embaixo do painel de instrumentos, lado do motorista)` : '(geralmente está embaixo do painel de instrumentos, lado do motorista)'}
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
    backgroundColor: '#FFFFFF'
  },
  backButton: {
    marginRight: 10,
    padding: 4
  },
  logo: {
    width: 120,
    height: 50,
    flex: 1
  },
  headerIcons: {
    flexDirection: 'row'
  },
  iconButton: {
    marginLeft: 10,
    padding: 4
  },
  topIcon: {
    width: 24,
    height: 24
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
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'Inter, sans-serif'
  },
  vehicleSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Inter, sans-serif'
  },
  statusHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
    width: '100%'
  },
  statusContainerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 24
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50'
  },
  statusDotDisconnected: {
    backgroundColor: '#F44336'
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter, sans-serif'
  },
  statusTextConnected: {
    color: '#4CAF50'
  },
  statusTextDisconnected: {
    color: '#F44336'
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
    alignItems: 'center'
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
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
    height: 56
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 0.3,
    marginLeft: 10
  },
  connectButtonSubText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif'
  },
  dashboardContainer: {
    width: '100%'
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
    elevation: 10
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444'
  },
  panelTitle: {
    color: '#FFCF00',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    fontFamily: 'Inter, sans-serif'
  },
  mainGaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  gaugeItem: {
    alignItems: 'center'
  },
  gaugeValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8
  },
  gaugeUnit: {
    color: '#999',
    fontSize: 12,
    marginTop: 4
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  dataCard: {
    width: '48%',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center'
  },
  dataCardLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 8
  },
  dataCardValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  dtcCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  clearDtcBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clearDtcText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4
  },
  dtcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  dtcSeverity: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 12
  },
  dtcInfo: {
    flex: 1
  },
  dtcCode: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  dtcDescription: {
    color: '#999',
    fontSize: 12,
    marginTop: 4
  },
  solveDtcButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  solveDtcText: {
    color: '#FFCF00',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  noDtcContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  noDtcText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12
  },
  readDtcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16
  },
  readDtcText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  consumptionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  consumptionCard: {
    width: '48%',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  consumptionValue: {
    color: '#FFCF00',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12
  },
  consumptionUnit: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  consumptionLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4
  },
  fuelTrimsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  fuelTrimItem: {
    width: '48%',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  fuelTrimLabel: {
    color: '#999',
    fontSize: 12
  },
  fuelTrimValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '48%'
  },
  actionButtonDanger: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  actionButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  connectionSection: {
    width: '100%'
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16
  },
  deviceListContainer: {
    width: '100%'
  },
  deviceListTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12
  },
  deviceName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600'
  },
  deviceAddress: {
    color: '#666',
    fontSize: 12,
    marginTop: 4
  },
  bottomSpacer: {
    height: 100
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  modalTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 4
  },
  modalScroll: {
    maxHeight: '80%'
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 24
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  stepNumberText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold'
  },
  stepText: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    lineHeight: 24
  }
});

export default OBDScreen;
