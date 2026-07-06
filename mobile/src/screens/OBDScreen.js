
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, Image, Modal, PermissionsAndroid } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const OBDScreen = ({ navigation, route }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const intervalRef = useRef(null);
  const [liveData, setLiveData] = useState({
    rpm: 750,
    speed: 0,
    coolantTemp: 85,
    fuelLevel: 70,
    batteryVoltage: 12.6,
    engineLoad: 35,
    airIntakeTemp: 25,
    throttlePosition: 15,
    fuelPressure: 8.0,
    intakeManifoldPressure: 95,
    oilTemp: 90,
    oilPressure: 3.5,
    lambda: 1.0,
    maf: 2.5,
    timingAdvance: 15,
    egr: 10,
    evapSystemVaporPressure: 30,
    fuelTrimShort: 5,
    fuelTrimLong: -2,
    catalystTemp: 450,
    ambientTemp: 25,
  });
  const [dtcCodes, setDtcCodes] = useState([]);
  const [isLoadingDTC, setIsLoadingDTC] = useState(false);

  // Auto-update live data when connected
  useEffect(() => {
    if (isConnected) {
      // Update every second
      intervalRef.current = setInterval(() => {
        handleReadLiveData();
      }, 1000);
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

  // Handle scanning for Bluetooth devices
  const handleScanDevices = async () => {
    const hasPermissions = await requestBluetoothPermissions();
    
    if (!hasPermissions) {
      Alert.alert('Permissão Negada', 'As permissões de Bluetooth são necessárias para conectar.');
      return;
    }
    
    setIsScanning(true);
    
    // Mock device scanning for compatibility (real implementation would use expo-bluetooth-classic)
    setTimeout(() => {
      setDeviceList([
        { id: 1, name: 'OBDII ELM327', address: '00:11:22:33:44:55' },
        { id: 2, name: 'OBDLink MX+', address: 'AA:BB:CC:DD:EE:FF' }
      ]);
      setIsScanning(false);
    }, 2000);
  };

  // Connect to a specific device
  const handleConnectDevice = (device) => {
    Alert.alert('Conectando', `Conectando a ${device.name}...`);
    
    setTimeout(() => {
      setIsConnected(true);
      setConnectedDevice(device);
      setShowDashboard(true);
      Alert.alert('Conectado!', `Conectado com sucesso a ${device.name}`);
    }, 1500);
  };

  const handleReadLiveData = (manual = false) => {
    if (!isConnected && manual) {
      Alert.alert('Erro', 'Conecte-se a um dispositivo OBD primeiro!');
      return;
    }
    if (!isConnected) return;
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
  };

  const handleReadDTCs = () => {
    if (!isConnected) {
      Alert.alert('Erro', 'Conecte-se a um dispositivo OBD primeiro!');
      return;
    }
    setIsLoadingDTC(true);
    setTimeout(() => {
      setDtcCodes([
        { code: 'P0300', description: 'Mau funcionamento do sistema de ignição aleatório/múltiplo', severity: 'high' },
        { code: 'P0420', description: 'Eficiência do sistema de catalisador abaixo do limiar', severity: 'medium' }
      ]);
      setIsLoadingDTC(false);
    }, 2000);
  };

  const handleClearDTCs = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja limpar os códigos de erro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: () => {
            setDtcCodes([]);
            Alert.alert('Sucesso', 'Códigos limpos com sucesso!');
          }
        }
      ]
    );
  };

  const handleDisconnect = () => {
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="always"
      >
        {/* Title */}
        <Text style={styles.title}>OBD - DIAGNÓSTICO DE BORDO</Text>

        {/* Connection Status */}
        <View style={styles.statusContainerCentered}>
          <View style={[styles.statusDot, isConnected ? styles.statusDotConnected : styles.statusDotDisconnected]} />
          <Text style={[styles.statusText, isConnected ? styles.statusTextConnected : styles.statusTextDisconnected]}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>

        {/* Connect and Help Buttons */}
        {!showDashboard && (
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.connectButton} onPress={handleScanDevices}>
              <MaterialCommunityIcons name="bluetooth-connect" size={22} color="#FFCF00" />
              <Text style={styles.connectButtonText}>
                CONECTAR
                <Text style={styles.connectButtonSubText}> OBD</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpButton} onPress={() => setShowHelp(true)}>
              <MaterialCommunityIcons name="information" size={22} color="#FFCF00" />
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
                  <Text style={styles.dataCardLabel}>Bateria</Text>
                  <Text style={styles.dataCardValue}>{liveData.batteryVoltage}V</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="gauge" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Pressão Coletor</Text>
                  <Text style={styles.dataCardValue}>{liveData.intakeManifoldPressure} kPa</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="engine" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Carga do Motor</Text>
                  <Text style={styles.dataCardValue}>{liveData.engineLoad}%</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="oil" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Temp. Óleo</Text>
                  <Text style={styles.dataCardValue}>{liveData.oilTemp}°C</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <MaterialCommunityIcons name="water" size={22} color="#FFCF00" />
                  <Text style={styles.dataCardLabel}>Pressão Óleo</Text>
                  <Text style={styles.dataCardValue}>{liveData.oilPressure} bar</Text>
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
                      <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
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
                <MaterialCommunityIcons name="refresh" size={20} color="#FFCF00" />
                <Text style={styles.readDtcText}>Ler Códigos de Erro</Text>
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
              
              <View style={styles.sensorDataRow}>
                <View style={styles.sensorDataItem}>
                  <MaterialCommunityIcons name="lambda" size={20} color="#FFCF00" />
                  <Text style={styles.sensorDataLabel}>Lambda</Text>
                  <Text style={styles.sensorDataValue}>{liveData.lambda}</Text>
                </View>
                <View style={styles.sensorDataItem}>
                  <MaterialCommunityIcons name="fire" size={20} color="#FFCF00" />
                  <Text style={styles.sensorDataLabel}>Temp. Catalisador</Text>
                  <Text style={styles.sensorDataValue}>{liveData.catalystTemp}°C</Text>
                </View>
                <View style={styles.sensorDataItem}>
                  <MaterialCommunityIcons name="weather-windy" size={20} color="#FFCF00" />
                  <Text style={styles.sensorDataLabel}>Fluxo de Ar</Text>
                  <Text style={styles.sensorDataValue}>{liveData.maf} g/s</Text>
                </View>
              </View>
            </View>

            {/* 4. Monitoramento de Condução */}
            <View style={styles.obdPanel}>
              <View style={styles.panelHeader}>
                <MaterialCommunityIcons name="steering" size={28} color="#FFCF00" />
                <Text style={styles.panelTitle}>MONITORAMENTO DE CONDUÇÃO</Text>
              </View>
              
              <View style={styles.drivingStatsGrid}>
                <View style={styles.drivingStatCard}>
                  <MaterialCommunityIcons name="arrow-up-bold-circle" size={28} color="#FF5722" />
                  <Text style={styles.drivingStatValue}>0</Text>
                  <Text style={styles.drivingStatLabel}>Acelerações Bruscas</Text>
                </View>
                
                <View style={styles.drivingStatCard}>
                  <MaterialCommunityIcons name="arrow-down-bold-circle" size={28} color="#FF5722" />
                  <Text style={styles.drivingStatValue}>0</Text>
                  <Text style={styles.drivingStatLabel}>Frenagens Severas</Text>
                </View>
                
                <View style={styles.drivingStatCard}>
                  <MaterialCommunityIcons name="timer-sand" size={28} color="#FFCF00" />
                  <Text style={styles.drivingStatValue}>{Math.floor(Math.random() * 30)}min</Text>
                  <Text style={styles.drivingStatLabel}>Ponto Morto</Text>
                </View>
                
                <View style={styles.drivingStatCard}>
                  <MaterialCommunityIcons name="seatbelt" size={28} color="#4CAF50" />
                  <Text style={styles.drivingStatValue}>✅</Text>
                  <Text style={styles.drivingStatLabel}>Cinto de Segurança</Text>
                </View>
              </View>
              
              <View style={styles.sensorDetailsRow}>
                <View style={styles.sensorDetailItem}>
                  <Text style={styles.sensorDetailLabel}>Posição do Acelerador</Text>
                  <Text style={styles.sensorDetailValue}>{liveData.throttlePosition}%</Text>
                </View>
                <View style={styles.sensorDetailItem}>
                  <Text style={styles.sensorDetailLabel}>Avanço de Ignição</Text>
                  <Text style={styles.sensorDetailValue}>{liveData.timingAdvance}°</Text>
                </View>
              </View>
              
              <View style={styles.sensorDetailsRow}>
                <View style={styles.sensorDetailItem}>
                  <Text style={styles.sensorDetailLabel}>EGR</Text>
                  <Text style={styles.sensorDetailValue}>{liveData.egr}%</Text>
                </View>
                <View style={styles.sensorDetailItem}>
                  <Text style={styles.sensorDetailLabel}>Pressão EVAP</Text>
                  <Text style={styles.sensorDetailValue}>{liveData.evapSystemVaporPressure} Pa</Text>
                </View>
                <View style={styles.sensorDetailItem}>
                  <Text style={styles.sensorDetailLabel}>Temp. Ambiente</Text>
                  <Text style={styles.sensorDetailValue}>{liveData.ambientTemp}°C</Text>
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
            {!isScanning && deviceList.length === 0 && (
              <TouchableOpacity style={styles.scanButton} onPress={handleScanDevices}>
                <MaterialCommunityIcons name="bluetooth-search" size={24} color="#FFCF00" />
                <Text style={styles.scanButtonText}>Procurar Dispositivos</Text>
              </TouchableOpacity>
            )}
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
        </View>
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
                  Localize a porta OBD2 do seu veículo (geralmente fica embaixo do volante ou perto da caixa de fusíveis).
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
                  Vá nas configurações Bluetooth do seu celular, busque por novos dispositivos e conecte ao scanner (ele costuma aparecer como OBDII, OBD2 ou ELM327).
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>
                  Se pedir um código PIN, tente: 1234, 0000, 7890 ou 1111.
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <Text style={styles.stepText}>
                  Abra o aplicativo da sua preferência e configure o scanner dentro do app (selecione a conexão via Bluetooth e o dispositivo pareado).
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home', { user: route.params?.user })}>
          <Ionicons name="home" size={28} color="#FFCF00" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Report', { user: route.params?.user })}>
          <MaterialCommunityIcons name="file-document-outline" size={28} color="#999" />
          <Text style={styles.navText}>Relatório</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PartsCatalog', { user: route.params?.user })}>
          <MaterialCommunityIcons name="folder-outline" size={28} color="#999" />
          <Text style={styles.navText}>Peças</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Checklist', { user: route.params?.user })}>
          <MaterialCommunityIcons name="check-circle-outline" size={28} color="#999" />
          <Text style={styles.navText}>Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings', { user: route.params?.user })}>
          <Ionicons name="settings-sharp" size={28} color="#999" />
          <Text style={styles.navText}>Config</Text>
        </TouchableOpacity>
      </View>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  statusContainerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 12,
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
    marginBottom: 10,
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
    alignItems: 'stretch',
    marginBottom: 20,
  },
  helpButton: {
    backgroundColor: '#2E2E2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    height: 56,
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
  },
  readDtcText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
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
  sensorDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensorDataItem: {
    width: '31%',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  sensorDataLabel: {
    color: '#999',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  sensorDataValue: {
    color: '#FFCF00',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
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
  },
  actionButtonDanger: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFCF00',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter, sans-serif',
  },
  actionButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter, sans-serif',
  },
  connectionSection: {
    width: '100%',
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  scanButtonText: {
    color: '#FFCF00',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'Inter, sans-serif',
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
    marginTop: 3,
    fontFamily: 'Inter, sans-serif',
  },
  bottomSpacer: {
    height: 30,
  },
  navBar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#2C2C2C',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
    fontFamily: 'Coda Caption, sans-serif',
  },
  navTextActive: {
    color: '#FFCF00',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Inter, sans-serif',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    lineHeight: 22,
    fontFamily: 'Inter, sans-serif',
  },
});

export default OBDScreen;
