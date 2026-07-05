
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const OBDScreen = ({ navigation, route }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
  });
  const [dtcCodes, setDtcCodes] = useState([]);
  const [isLoadingDTC, setIsLoadingDTC] = useState(false);

  const handleScanDevices = () => {
    setIsScanning(true);
    setTimeout(() => {
      setDeviceList([
        { id: 1, name: 'OBDII ELM327', address: '00:11:22:33:44:55' },
        { id: 2, name: 'OBDLink MX+', address: 'AA:BB:CC:DD:EE:FF' }
      ]);
      setIsScanning(false);
    }, 2000);
  };

  const handleConnectDevice = (device) => {
    Alert.alert('Conectando', `Conectando a ${device.name}...`);
    setTimeout(() => {
      setIsConnected(true);
      setShowDashboard(true);
      Alert.alert('Conectado!', `Conectado com sucesso a ${device.name}`);
    }, 1500);
  };

  const handleReadLiveData = () => {
    if (!isConnected) {
      Alert.alert('Erro', 'Conecte-se a um dispositivo OBD primeiro!');
      return;
    }
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
            <TouchableOpacity style={styles.connectButton} onPress={() => setShowDashboard(!showDashboard)}>
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
        <View style={styles.dashboardContainer}>
          {/* First Panel - Gauges */}
          <View style={styles.gaugePanel}>
            <View style={styles.gaugeRow}>
              {/* Fuel Gauge */}
              <View style={styles.gaugeSmall}>
                <View style={styles.fuelGauge}>
                  <MaterialCommunityIcons name="fuel" size={36} color="#FFCF00" />
                  <View style={styles.fuelArc}>
                    <Text style={styles.gaugeLabel}>Gasolina</Text>
                  </View>
                </View>
                <Text style={styles.smallGaugeText}>Gasolina</Text>
              </View>

              {/* Main Speedometer */}
              <View style={styles.speedometer}>
                <View style={styles.speedOuterCircle}>
                  <View style={styles.speedInnerCircle}>
                    <View style={styles.speedNeedle}>
                      <View style={styles.speedNeedleTip} />
                    </View>
                    <View style={styles.speedCenter} />
                  </View>
                </View>
                <Text style={styles.speedValue}>{liveData.speed} <Text style={styles.speedUnit}>km/h</Text></Text>
              </View>

              {/* Temperature Gauge */}
              <View style={styles.gaugeSmall}>
                <View style={styles.tempGauge}>
                  <MaterialCommunityIcons name="thermometer" size={36} color="#FFCF00" />
                </View>
                <Text style={styles.smallGaugeText}>Temperatura do Motor</Text>
              </View>
            </View>

            <View style={styles.airFlowContainer}>
              <MaterialCommunityIcons name="weather-windy" size={32} color="#FFCF00" />
              <Text style={styles.smallGaugeText}>Fluxo de ar</Text>
            </View>
          </View>

          {/* Second Panel - RPM */}
          <View style={styles.rpmPanel}>
            <View style={styles.rpmGauge}>
              {/* RPM Arc Background */}
              <View style={styles.rpmArcContainer}>
                <View style={[styles.rpmArc, styles.rpmArcGreen]} />
                <View style={[styles.rpmArc, styles.rpmArcYellow]} />
                <View style={[styles.rpmArc, styles.rpmArcRed]} />
                {/* RPM Needle */}
                <View style={styles.rpmNeedle} />
                <View style={styles.rpmCenter} />
              </View>
              <Text style={styles.rpmValue}>{liveData.rpm}</Text>
              <Text style={styles.rpmLabel}>RPM</Text>
            </View>

            <View style={styles.rpmLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>NORMAL</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
                <Text style={styles.legendText}>ATENÇÃO</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
                <Text style={styles.legendText}>CRÍTICO</Text>
              </View>
            </View>

            <Text style={styles.statusText}>RPM Status: Verde = Normal , Amarelo = Alerta, Vermelho = Crítico</Text>
          </View>

          {/* Battery Panel */}
          <View style={styles.batteryPanel}>
            <View style={styles.batteryContainer}>
              <View style={styles.batteryBody}>
                <View style={[styles.batteryFill, { width: `${liveData.fuelLevel}%` }]} />
              </View>
              <View style={styles.batteryTip} />
              <Text style={styles.batteryValue}>{liveData.fuelLevel}%</Text>
            </View>
            <Text style={styles.batteryLabel}>Tensão da Bateria</Text>
          </View>

          {/* Fuel Pressure Panel */}
          <View style={styles.pressurePanel}>
            <View style={styles.pressureHeader}>
              <Text style={styles.pressureLabel}>PRESSÃO DO COMBUSTÍVEL</Text>
            </View>
            <View style={styles.pressureGauge}>
                <View style={styles.pressureValueContainer}>
                  <Text style={styles.pressureValue}>{liveData.fuelPressure.toFixed(1)}</Text>
                  <Text style={styles.pressureUnit}>bar</Text>
                </View>
                <View style={styles.pressureScale}>
                  <Text style={styles.pressureScaleMin}>6.0</Text>
                  <View style={styles.pressureBarContainer}>
                    <View 
                      style={[
                        styles.pressureBar, 
                        { width: `${((liveData.fuelPressure - 6) / 4) * 100}%` }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.pressureIndicator, 
                        { left: `${((liveData.fuelPressure - 6) / 4) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.pressureScaleMax}>10.0</Text>
                </View>
              </View>
          </View>

          {/* Action Buttons */}
          {isConnected && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleReadLiveData}>
                <MaterialCommunityIcons name="refresh" size={24} color="#FFCF00" />
                <Text style={styles.actionButtonText}>Atualizar Dados</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={handleDisconnect}>
                <MaterialCommunityIcons name="bluetooth-off" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonTextWhite}>Desconectar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Device Connection (when not connected) */}
          {!isConnected && !showDashboard && (
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
    flex: 1,
    backgroundColor: '#ffffff',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
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
    backgroundColor: '#FFCF00',
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
    color: '#FFCF00',
  },
  statusTextDisconnected: {
    color: '#F44336',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 15,
  },
  gaugePanel: {
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
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gaugeSmall: {
    alignItems: 'center',
  },
  fuelGauge: {
    alignItems: 'center',
  },
  fuelArc: {
    marginTop: 5,
  },
  tempGauge: {
    alignItems: 'center',
  },
  smallGaugeText: {
    color: '#FFFFFF',
    fontSize: 8,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  speedometer: {
    alignItems: 'center',
  },
  speedOuterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  speedNeedle: {
    position: 'absolute',
    width: 4,
    height: 45,
    backgroundColor: '#FFCF00',
    bottom: '50%',
    transformOrigin: 'bottom center',
    transform: [{ rotate: '45deg' }],
  },
  speedNeedleTip: {
    position: 'absolute',
    top: -5,
    left: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFCF00',
  },
  speedCenter: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#FFCF00',
  },
  speedValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    fontFamily: 'Inter, sans-serif',
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  airFlowContainer: {
    alignItems: 'flex-end',
    marginTop: 30,
    paddingRight: 20,
  },
  rpmPanel: {
    backgroundColor: '#2E2E2E',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  rpmGauge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rpmArcContainer: {
    width: 200,
    height: 100,
    position: 'relative',
  },
  rpmArc: {
    position: 'absolute',
    bottom: 0,
    width: 200,
    height: 100,
    borderRadius: 100,
    borderTopWidth: 15,
    borderTopColor: '#333',
  },
  rpmArcGreen: {
    borderTopColor: '#4CAF50',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 0,
    width: 100,
  },
  rpmArcYellow: {
    borderTopColor: '#FFC107',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    width: 100,
    left: 100,
  },
  rpmArcRed: {
    borderTopColor: '#FF5722',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 100,
    width: 100,
    left: 150,
  },
  rpmNeedle: {
    position: 'absolute',
    width: 4,
    height: 80,
    backgroundColor: '#FFCF00',
    bottom: 0,
    left: '50%',
    marginLeft: -2,
    transformOrigin: 'bottom center',
    transform: [{ rotate: '45deg' }],
  },
  rpmCenter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFCF00',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
  },
  rpmValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFCF00',
    fontFamily: 'Inter, sans-serif',
  },
  rpmLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
  },
  rpmLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter, sans-serif',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  batteryPanel: {
    alignItems: 'center',
    marginBottom: 20,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF99',
  },
  batteryBody: {
    width: 200,
    height: 15,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  batteryFill: {
    height: '100%',
    backgroundColor: '#FFCF00',
  },
  batteryTip: {
    width: 5,
    height: 15,
    backgroundColor: '#FFCF00',
  },
  batteryValue: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Inter, sans-serif',
  },
  batteryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 10,
    fontFamily: 'Inter, sans-serif',
  },
  pressurePanel: {
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  pressureHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pressureLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
  },
  pressureGauge: {
    alignItems: 'center',
  },
  pressureValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  pressureValue: {
    color: '#FFCF00',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
  },
  pressureUnit: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'Inter, sans-serif',
  },
  pressureScale: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  pressureScaleMin: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
  },
  pressureBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    marginHorizontal: 10,
    position: 'relative',
  },
  pressureBar: {
    height: '100%',
    backgroundColor: '#FFCF00',
    width: '50%',
    borderRadius: 5,
  },
  pressureIndicator: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#FFCF00',
    borderRadius: 7.5,
    top: -2.5,
    left: '50%',
    marginLeft: -7.5,
  },
  pressureScaleMax: {
    color: '#FFFFFF',
    fontSize: 12,
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
    paddingHorizontal: 20,
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
    paddingBottom: 10,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
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
