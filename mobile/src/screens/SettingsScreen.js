import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

// Toggle customizado - substitui o Switch nativo para evitar o verde/teal do sistema na web
const CustomSwitch = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        toggleStyles.track,
        { backgroundColor: value ? '#FFCF00' : '#D9D9D9' }
      ]}
    >
      <View
        style={[
          toggleStyles.thumb,
          { alignSelf: value ? 'flex-end' : 'flex-start' }
        ]}
      />
    </TouchableOpacity>
  );
};

const SettingsScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);
  const [biometryEnabled, setBiometryEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = () => setDeleteModalVisible(true);

  const cancelDelete = () => {
    if (isDeleting) return; // não deixa fechar no meio da requisição
    setDeleteModalVisible(false);
  };

  const confirmDeleteAccount = async () => {
    if (!loggedUser?.id) {
      Alert.alert('Erro', 'Usuário não identificado. Faça login novamente.');
      return;
    }

    try {
      setIsDeleting(true);
      await axios.delete(`${API_BASE_URL}/user/${loggedUser.id}`);

      setIsDeleting(false);
      setDeleteModalVisible(false);

      Alert.alert('Conta excluída', 'Sua conta e todos os dados foram removidos com sucesso.');

      // Reseta a pilha de navegação e volta para o login/onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // ajuste para o nome real da sua tela inicial/login
      });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      setIsDeleting(false);
      Alert.alert('Erro', 'Não foi possível excluir sua conta agora. Tente novamente mais tarde.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Scrollable */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.screenTitle}>CONFIGURAÇÕES</Text>

        {/* Notificações */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="bell-off-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Desativar Notificações</Text>
            </View>
            <CustomSwitch
              value={notificationsDisabled}
              onValueChange={setNotificationsDisabled}
            />
          </View>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Lembretes Programáveis</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="calendar-sync-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Frequência dos Lembretes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Preferências */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="fingerprint" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Ativar/Desativar Biometria</Text>
            </View>
            <CustomSwitch
              value={biometryEnabled}
              onValueChange={setBiometryEnabled}
            />
          </View>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Autenticação de dois fatores</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={24} color="#FFCF00" />
          </View>
        </View>

        {/* Ajuda e Suporte */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ajuda e Suporte</Text>
            <MaterialIcons name="info" size={20} color="#2D2D2D" />
          </View>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="translate" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Idioma</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="school-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Tutorial/Reapresentar Onboarding</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Privacidade e Segurança */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Privacidade e Segurança</Text>
            <MaterialIcons name="lock" size={20} color="#2D2D2D" />
          </View>
          <View style={styles.separator} />
          
          <View style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Permitir Localização</Text>
            </View>
            <CustomSwitch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
            />
          </View>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#2D2D2D" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Política de Termos e Condições</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem} onPress={openDeleteModal}>
            <View style={styles.menuLabelRow}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF4444" style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: '#FF4444' }]}>Apagar Conta/Apagar Dados</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Config" />

      {/* Modal de Confirmação de Exclusão de Conta */}
      {deleteModalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <MaterialCommunityIcons name="alert-octagon" size={50} color="#FF4444" />
              <Text style={styles.modalTitle}>Excluir Conta</Text>
              <Text style={styles.modalText}>
                Esta ação é <Text style={{ fontWeight: '800', color: '#FF4444' }}>permanente e irreversível</Text>.
                Todos os seus dados, veículos cadastrados e histórico de manutenção serão apagados
                e não poderão ser recuperados. Tem certeza que deseja continuar?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelDelete}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteConfirmButton, isDeleting && { opacity: 0.6 }]}
                  onPress={confirmDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteConfirmButtonText}>Sim, Excluir</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const toggleStyles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});

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
        overflow: 'hidden',
      },
      default: {
        flex: 1,
      }
    })
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
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      }
    })
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100, // Espaço para não cobrir o conteúdo com a barra
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
    marginVertical: 15,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00000036',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#0000001A',
    marginHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingRight: 10,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  footerSpace: {
    height: 20,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    height: 70,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#D9D9D9',
    marginTop: 4,
    fontWeight: '700',
  },
  navTextActive: {
    color: '#FFCF00',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    ...Platform.select({
      web: {
        maxWidth: 400,
      }
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
    color: '#000',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SettingsScreen;