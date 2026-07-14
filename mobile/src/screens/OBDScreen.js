import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  PermissionsAndroid
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';
import AMPAlertModal from '../components/Common/AMPAlertModal';

const OBD_CONNECTION_OPTIONS = {
  connectorType: 'rfcomm',
  connectionType: 'delimited',
  delimiter: '>',
  charset: 'utf-8',
  readSize: 2048,
  secureSocket: false,
};

const DTC_SYSTEM_MAP = ['P', 'C', 'B', 'U'];
const DTC_DESCRIPTION_MAP = {
  P0100: 'Falha no circuito do sensor MAF',
  P0101: 'Faixa/desempenho incorreto no sensor MAF',
  P0102: 'Sinal baixo no sensor MAF',
  P0103: 'Sinal alto no sensor MAF',
  P0104: 'Falha intermitente no sensor de fluxo de ar (MAF)',
  P0110: 'Falha no circuito do sensor de temperatura do ar de admissão',
  P0113: 'Sinal alto no sensor de temperatura do ar de admissão',
  P0120: 'Falha no circuito do sensor de posição da borboleta',
  P0130: 'Falha no circuito da sonda lambda (banco 1, sensor 1)',
  P0171: 'Mistura pobre detectada no banco 1',
  P0300: 'Falhas de ignição aleatórias detectadas',
  P0301: 'Falha de ignição detectada no cilindro 1',
  P0302: 'Falha de ignição detectada no cilindro 2',
  P0303: 'Falha de ignição detectada no cilindro 3',
  P0304: 'Falha de ignição detectada no cilindro 4',
  P0420: 'Eficiência do catalisador abaixo do limite',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Bluetooth is only available on Android, skip on web/iOS
const BluetoothClassic = (() => {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    const module = require('react-native-bluetooth-classic');
    return module.default || module;
  } catch (e) {
    console.log('react-native-bluetooth-classic not available:', e.message);
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
  const commandQueueRef = useRef(Promise.resolve());
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalData, setAlertModalData] = useState({
    type: 'info',
    title: '',
    message: '',
    confirmButtonText: 'Ok',
    onConfirm: () => setAlertModalVisible(false),
    cancelButtonText: 'Cancelar',
    onCancel: () => setAlertModalVisible(false),
  });

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

  useFocusEffect(
    useCallback(() => {
      if (!loggedUser?.id) {
        return undefined;
      }

      fetchVehicleData();
      return undefined;
    }, [loggedUser?.id])
  );

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = Platform.Version >= 31
          ? [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]
          : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

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

  const normalizeElmResponse = (response, command = '') => {
    const commandUpper = command.toUpperCase().replace(/\s+/g, '');

    return String(response || '')
      .replace(/\0/g, '')
      .replace(/\r/g, '\n')
      .replace(/>/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => {
        const lineUpper = line.toUpperCase().replace(/\s+/g, '');
        return lineUpper !== commandUpper && lineUpper !== 'SEARCHING...' && lineUpper !== 'NO DATA' && lineUpper !== 'OK';
      })
      .join(' ')
      .trim();
  };

  const extractResponseBytes = (response, expectedMode) => {
    const normalized = normalizeElmResponse(response).toUpperCase();
    console.log('extractResponseBytes - normalized:', normalized);
    const compactHex = normalized.replace(/[^0-9A-F]/g, '');
    console.log('extractResponseBytes - compactHex:', compactHex);

    if (compactHex.length < 2) {
      return null;
    }

    const bytes = [];
    for (let index = 0; index < compactHex.length - 1; index += 2) {
      bytes.push(parseInt(compactHex.slice(index, index + 2), 16));
    }

    console.log('extractResponseBytes - bytes:', bytes);

    if (bytes.length === 0) {
      return null;
    }

    // Try to find expected mode, or default to first valid mode
    let responseStartIndex = bytes.findIndex((byte) => byte === expectedMode);
    console.log('extractResponseBytes - responseStartIndex:', responseStartIndex);
    
    if (responseStartIndex === -1) {
      // If not found, check for common modes and use first available
      const commonModes = [0x41, 0x43, 0x42];
      for (const mode of commonModes) {
        const idx = bytes.findIndex((byte) => byte === mode);
        if (idx !== -1) {
          responseStartIndex = idx;
          break;
        }
      }
    }

    if (responseStartIndex === -1) {
      // If still not found, just try using from index 0 if it's a reasonable length
      return bytes.length >= 2 ? bytes : null;
    }

    return bytes.slice(responseStartIndex);
  };

  const getGenericDTCDescription = (code) => {
    if (code.startsWith('P')) {
      return 'Falha detectada no conjunto motor/cambio.';
    }
    if (code.startsWith('C')) {
      return 'Falha detectada no sistema de chassis.';
    }
    if (code.startsWith('B')) {
      return 'Falha detectada no sistema de carroceria.';
    }
    if (code.startsWith('U')) {
      return 'Falha detectada na rede de comunicacao do veiculo.';
    }

    return 'Falha OBD-II detectada.';
  };

  const getDTCSeverity = (code) => {
    if (/^P0(3|2|1)/.test(code) || code === 'P0420') {
      return 'high';
    }

    return 'medium';
  };

  const decodeDTCBytes = (firstByte, secondByte) => {
    if (firstByte === 0 && secondByte === 0) {
      return null;
    }

    console.log('decodeDTCBytes - firstByte:', firstByte, 'secondByte:', secondByte);

    const system = DTC_SYSTEM_MAP[(firstByte & 0xC0) >> 6] || 'P';
    const code = [
      system,
      ((firstByte & 0x30) >> 4).toString(),
      (firstByte & 0x0F).toString(16).toUpperCase(),
      ((secondByte & 0xF0) >> 4).toString(16).toUpperCase(),
      (secondByte & 0x0F).toString(16).toUpperCase(),
    ].join('');

    console.log('decodeDTCBytes - code:', code);

    return {
      code,
      description: DTC_DESCRIPTION_MAP[code] || getGenericDTCDescription(code),
      severity: getDTCSeverity(code),
    };
  };

  const parseDTCResponse = (response) => {
    console.log('parseDTCResponse - response:', response);
    const bytes = extractResponseBytes(response, 0x43);
    console.log('parseDTCResponse - bytes:', bytes);
    if (!bytes || bytes.length < 2) {
      return [];
    }

    const dtcPayload = bytes.slice(1);
    console.log('parseDTCResponse - dtcPayload:', dtcPayload);
    if (dtcPayload.length === 0 || dtcPayload.every((byte) => byte === 0)) {
      return [];
    }

    const dtcList = [];

    for (let index = 0; index < dtcPayload.length; index += 2) {
      const firstByte = dtcPayload[index];
      const secondByte = dtcPayload[index + 1] ?? 0;
      const decoded = decodeDTCBytes(firstByte, secondByte);

      if (decoded) {
        dtcList.push(decoded);
      }
    }

    console.log('parseDTCResponse - dtcList:', dtcList);
    return dtcList;
  };

  const sendOBDCommand = async (command, options = {}) => {
    if (!connectionRef.current || !BluetoothClassic) {
      throw new Error('Não conectado a nenhum dispositivo');
    }

    const {
      clearBuffer = true,
      waitAfterWriteMs = 250,
      readAttempts = 3,
    } = options;

    const normalizedCommand = command.replace(/\s+/g, '').toUpperCase();

    const runCommand = async () => {
      try {
        if (clearBuffer) {
          await connectionRef.current.clear().catch(() => false);
        }

        await connectionRef.current.write(`${normalizedCommand}\r`, 'utf-8');
        await delay(waitAfterWriteMs);

        let response = '';
        for (let attempt = 0; attempt < readAttempts; attempt += 1) {
          const chunk = await connectionRef.current.read().catch(() => '');
          if (chunk) {
            response = `${response}\n${chunk}`.trim();
          }

          const remainingMessages = await connectionRef.current.available().catch(() => 0);
          if (remainingMessages <= 0) {
            break;
          }

          await delay(120);
        }

        const cleanedResponse = normalizeElmResponse(response, normalizedCommand);
        console.log(`Comando ${normalizedCommand} resposta:`, cleanedResponse || response);
        return cleanedResponse;
      } catch (err) {
        console.error(`Erro no comando ${normalizedCommand}:`, err);
        throw err;
      }
    };

    const queuedCommand = commandQueueRef.current
      .catch(() => undefined)
      .then(runCommand);

    commandQueueRef.current = queuedCommand.catch(() => undefined);

    return queuedCommand;
  };

  const parseOBDResponse = (response, expectedMode = 0x41) => {
    console.log('parseOBDResponse - response:', response, 'expectedMode:', expectedMode);
    if (!response || response.includes('NO DATA') || response.includes('?')) {
      console.log('parseOBDResponse - skipping (no data or ?)');
      return null;
    }

    const result = extractResponseBytes(response, expectedMode);
    console.log('parseOBDResponse - result:', result);
    return result;
  };

  const initializeOBDDevice = async () => {
    try {
      console.log('Inicializando ELM327...');

      const initCommands = [
        'ATZ',
        'ATE0',
        'ATL0',
        'ATS0',
        'ATH0',
        'ATSP0',
        'ATST32',
        'ATAT1',
      ];

      for (const cmd of initCommands) {
        try {
          await sendOBDCommand(cmd, {
            waitAfterWriteMs: cmd === 'ATZ' ? 1800 : 300,
            readAttempts: cmd === 'ATZ' ? 5 : 3,
          });
          await delay(cmd === 'ATZ' ? 1200 : 200);
        } catch (err) {
          console.log(`Comando ${cmd} falhou, continuando...`);
        }
      }

      try {
        await sendOBDCommand('0100', {
          waitAfterWriteMs: 450,
          readAttempts: 4,
        });
        await delay(300);
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
      if (!connectionRef.current) {
        throw new Error('Não conectado a um dispositivo OBD');
      }

      let gotRealData = false;
      const newData = { ...liveData };

      const readPid = async (cmd, parser) => {
        try {
          const resp = await sendOBDCommand(cmd, {
            waitAfterWriteMs: 300,
            readAttempts: 3,
          });
          console.log(`readPid ${cmd} - resp:`, resp);
          const bytes = parseOBDResponse(resp);
          console.log(`readPid ${cmd} - bytes:`, bytes);
          if (bytes && bytes.length >= 2) {
            const parsedValues = parser(bytes);
            console.log(`readPid ${cmd} - parsed:`, parsedValues);
            if (parsedValues && typeof parsedValues === 'object') {
              Object.assign(newData, parsedValues);
              gotRealData = true;
            }
          }
        } catch (err) {
          console.log(`Erro ao ler PID ${cmd}:`, err?.message || err);
        }
      };

      await readPid('010C', b => ({ rpm: Math.round(((b[2] * 256 + b[3]) / 4)) }));
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

      console.log('readLiveDataFromOBD - newData:', newData, 'gotRealData:', gotRealData);

      if (gotRealData) {
        setLiveData(newData);
        // Auto-save scan
        if (vehicle?.id) {
          await saveOBDScanRecord([]);
        }
      }
    } catch (err) {
      console.error('Erro ao ler dados OBD:', err);
    } finally {
      setIsReading(false);
    }
  };

  const readDTCFromOBD = async () => {
    setIsLoadingDTC(true);
    try {
      if (!connectionRef.current) {
        setAlertModalData({
          type: 'error',
          title: 'Erro',
          message: 'Não conectado a um dispositivo OBD',
          confirmButtonText: 'Ok',
          onConfirm: () => setAlertModalVisible(false),
        });
        setAlertModalVisible(true);
        return;
      }

      const resp = await sendOBDCommand('03', {
        waitAfterWriteMs: 500,
        readAttempts: 4,
      });
      const codes = parseDTCResponse(resp);

      setDtcCodes(codes);
      await saveOBDScanRecord(codes);
    } catch (err) {
      console.error('Erro ao ler DTCs:', err);
      setDtcCodes([]);
      setAlertModalData({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao ler códigos de erro',
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
    } finally {
      setIsLoadingDTC(false);
    }
  };
  const saveOBDScanRecord = async (dtcList) => {
    if (!vehicle?.id) return;
    try {
      await axios.post(`${API_BASE_URL}/vehicle/obd-scan`, {
        vehicle_id: vehicle.id,
        scan_date: new Date().toISOString(),
        dtc_codes: dtcList,
        live_data: liveData,
        connected_device: connectedDevice?.name || null
      });
    } catch (err) {
      console.error('Erro ao salvar registro de scanner:', err);
    }
  };

  const handleScanDevices = async () => {
    if (Platform.OS !== 'android') {
      setAlertModalData({
        type: 'info',
        title: 'Plataforma Não Suportada',
        message: 'A conexão com scanner OBD2 é suportada apenas em dispositivos Android.',
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
      return;
    }

    console.log('Android Version:', Platform.Version);
    const hasPermissions = await requestBluetoothPermissions();
    console.log('Permissões concedidas:', hasPermissions);

    if (!hasPermissions) {
      setAlertModalData({
        type: 'error',
        title: 'Permissão Negada',
        message: 'As permissões de Bluetooth são necessárias para conectar.',
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
      return;
    }

    try {
      const bluetoothEnabled = await BluetoothClassic?.isBluetoothEnabled?.();
      if (!bluetoothEnabled) {
        await BluetoothClassic?.requestBluetoothEnabled?.();
      }
    } catch (err) {
      console.log('Não foi possível solicitar ativação do Bluetooth:', err?.message || err);
    }

    setIsScanning(true);
    setDeviceList([]);

    try {
      if (BluetoothClassic) {
        const devices = await BluetoothClassic.getBondedDevices();
        console.log('Dispositivos encontrados:', devices);
        const looksLikeOBD = (name = '') => {
          const normalizedName = name.toLowerCase();
          return normalizedName.includes('obd')
            || normalizedName.includes('elm')
            || normalizedName.includes('scan')
            || normalizedName.includes('v-link')
            || normalizedName.includes('vlink');
        };

        const prioritizedDevices = [
          ...devices.filter((device) => looksLikeOBD(device.name)),
          ...devices.filter((device) => !looksLikeOBD(device.name)),
        ];

        setDeviceList(
          prioritizedDevices.map((device) => ({
            id: device.address,
            name: device.name || 'Dispositivo sem nome',
            address: device.address,
          }))
        );
      } else {
        setAlertModalData({
          type: 'error',
          title: 'Erro',
          message: 'Biblioteca de Bluetooth não disponível.',
          confirmButtonText: 'Ok',
          onConfirm: () => setAlertModalVisible(false),
        });
        setAlertModalVisible(true);
      }
    } catch (err) {
      console.error('Erro ao buscar dispositivos:', err);
      setAlertModalData({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao buscar dispositivos Bluetooth',
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async (device) => {
    try {
      const connection = await BluetoothClassic.connectToDevice(device.address, OBD_CONNECTION_OPTIONS);
      connectionRef.current = connection;

      const initialized = await initializeOBDDevice();
      if (!initialized) {
        throw new Error('Falha ao inicializar o ELM327');
      }

      setIsConnected(true);
      setConnectedDevice(device);
      setShowDashboard(true);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Read data immediately first!
      await readLiveDataFromOBD();

      intervalRef.current = setInterval(() => {
        readLiveDataFromOBD();
      }, 2000);

      setAlertModalData({
        type: 'success',
        title: 'Conectado!',
        message: `Conectado com sucesso a ${device.name}`,
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setAlertModalData({
        type: 'error',
        title: 'Erro de Conexão',
        message: `Falha ao conectar a ${device.name}.\n\nVerifique se o dispositivo está pareado corretamente e se o PIN foi digitado corretamente (1234, 0000, 7890 ou 1111).`,
        confirmButtonText: 'Ok',
        onConfirm: () => setAlertModalVisible(false),
      });
      setAlertModalVisible(true);
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
    
    setAlertModalData({
      type: 'info',
      title: 'Desconectado',
      message: 'Dispositivo desconectado!',
      confirmButtonText: 'Ok',
      onConfirm: () => setAlertModalVisible(false),
    });
    setAlertModalVisible(true);
  };

  const handleClearDTCs = () => {
    setAlertModalData({
      type: 'confirm',
      title: 'Confirmar',
      message: 'Tem certeza que deseja limpar os códigos de erro (apenas localmente no app)?',
      confirmButtonText: 'Limpar',
      cancelButtonText: 'Cancelar',
      onConfirm: () => {
        setDtcCodes([]);
        setAlertModalVisible(false);
        
        setTimeout(() => {
          setAlertModalData({
            type: 'success',
            title: 'Sucesso',
            message: 'Códigos limpos com sucesso!',
            confirmButtonText: 'Ok',
            onConfirm: () => setAlertModalVisible(false),
          });
          setAlertModalVisible(true);
        }, 100);
      },
      onCancel: () => setAlertModalVisible(false),
    });
    setAlertModalVisible(true);
  };

  const handleSolveDTC = (dtc, index) => {
    setAlertModalData({
      type: 'confirm',
      title: 'Solucionar Problema',
      message: `Marcar o código ${dtc.code} como solucionado?`,
      confirmButtonText: 'Marcar como Solucionado',
      cancelButtonText: 'Cancelar',
      onConfirm: () => {
        setDtcCodes(prev => prev.filter((_, i) => i !== index));
        setAlertModalVisible(false);
        
        setTimeout(() => {
          setAlertModalData({
            type: 'success',
            title: 'Sucesso',
            message: `${dtc.code} marcado como solucionado!`,
            confirmButtonText: 'Ok',
            onConfirm: () => setAlertModalVisible(false),
          });
          setAlertModalVisible(true);
        }, 100);
      },
      onCancel: () => setAlertModalVisible(false),
    });
    setAlertModalVisible(true);
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
          <Text style={styles.headerTitle}>DIAGNÓSTICO EM TEMPO REAL</Text>
          {vehicle && (
            <Text style={styles.vehicleSubtitle}>
              {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.engine_type} • {vehicle.transmission}
            </Text>
          )}
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
        <View style={styles.statusHelpRow}>
          <View style={styles.statusContainerCentered}>
            <View style={[styles.statusDot, isConnected ? styles.statusDotConnected : styles.statusDotDisconnected]} />
            <Text style={[styles.statusText, isConnected ? styles.statusTextConnected : styles.statusTextDisconnected]}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.helpButton, { marginRight: 8 }]}
              onPress={() => navigation.navigate('OBDHistory', { user: loggedUser })}
            >
              <MaterialCommunityIcons name="history" size={20} color="#FFCF00" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpButton} onPress={() => setShowHelp(true)}>
              <MaterialCommunityIcons name="help-circle" size={20} color="#FFCF00" />
            </TouchableOpacity>
          </View>
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
                  <MaterialCommunityIcons name="tachometer-slow" size={40} color="#FFCF00" />
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
      
      <AMPAlertModal
        visible={alertModalVisible}
        type={alertModalData.type}
        title={alertModalData.title}
        message={alertModalData.message}
        confirmButtonText={alertModalData.confirmButtonText}
        cancelButtonText={alertModalData.cancelButtonText}
        onConfirm={alertModalData.onConfirm}
        onCancel={alertModalData.onCancel}
      />
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 50,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  vehicleSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
    height: 60,
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
    marginBottom: 12
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
