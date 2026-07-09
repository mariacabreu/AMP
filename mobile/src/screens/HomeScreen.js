import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TextInput,
  Pressable
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

// Notificações mockadas — troque por uma chamada à API quando o endpoint existir
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Troca de óleo recomendada',
    description: 'Seu veículo está próximo do prazo ideal para troca de óleo.',
    time: 'Há 2 horas',
    read: false
  },
  {
    id: '2',
    title: 'Diagnóstico OBD concluído',
    description: 'Nenhuma falha crítica encontrada no último escaneamento.',
    time: 'Ontem',
    read: true
  },
  {
    id: '3',
    title: 'Bem-vindo ao app!',
    description: 'Cadastre seu veículo para liberar todas as funcionalidades.',
    time: 'Há 3 dias',
    read: true
  }
];

const HomeScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  const [status, setStatus] = useState({
    user_name: loggedUser?.full_name || 'Usuário',
    recommendation: 'Carregando informações...',
    vehicle: null,
    is_premium: loggedUser?.is_premium || false
  });

  // ----- Modais -----
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // ----- Perfil (editável) -----
  const [profileForm, setProfileForm] = useState({
    full_name: loggedUser?.full_name || '',
    email: loggedUser?.email || '',
    phone: loggedUser?.phone || ''
  });
  const [avatarUri, setAvatarUri] = useState(loggedUser?.avatar_url || null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ----- Notificações -----
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetchUserStatus();
  }, [route.params?.user]);

  const fetchUserStatus = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const response = await axios.get(`${API_BASE_URL}/user/status/${userId}`);

      let isPremium = loggedUser?.is_premium || false;
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/user/${userId}`);
        isPremium = userResponse.data.is_premium;
      } catch (err) {
        console.error('Error fetching user details:', err);
      }

      setStatus({
        ...response.data,
        is_premium: isPremium
      });
    } catch (error) {
      console.error('Error fetching status:', error);
      setStatus({
        user_name: loggedUser?.full_name || 'Usuário',
        recommendation: 'Nenhuma recomendação no momento.',
        vehicle: null,
        is_premium: loggedUser?.is_premium || false
      });
    }
  };

  const handlePremiumButton = () => {
    if (!status.is_premium) {
      navigation.navigate('VehicleCompatibility', { user: loggedUser, vehicle: status.vehicle });
    }
  };

  const openProfileModal = () => {
    setProfileForm({
      full_name: loggedUser?.full_name || status.user_name || '',
      email: loggedUser?.email || '',
      phone: loggedUser?.phone || ''
    });
    setProfileModalVisible(true);
  };

  const handleChangePhoto = () => {
    // Requer a lib "expo-image-picker" instalada no projeto.
    // Exemplo de integração:
    // const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    // if (!result.canceled) setAvatarUri(result.assets[0].uri);
    Alert.alert('Alterar foto', 'Conecte o expo-image-picker aqui para trocar a foto do perfil.');
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const userId = loggedUser?.id || 1;
      await axios.put(`${API_BASE_URL}/user/${userId}`, {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone
      });
      setStatus((prev) => ({ ...prev, user_name: profileForm.full_name }));
      setProfileModalVisible(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas informações agora.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          setProfileModalVisible(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setNotificationModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={28} color="#000000" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={openProfileModal}
            activeOpacity={0.7}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="user-alt" size={18} color="#FFCF00" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrowText}>BEM-VINDO(A) DE VOLTA</Text>
          <Text style={styles.screenTitle}>{status.user_name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Vamos cuidar do seu veículo hoje?</Text>
        </View>

        <View style={styles.recommendationCard}>
          <Image source={require('../assets/logo.png')} style={styles.lampIcon} />
          <Text style={styles.recommendationText}>{status.recommendation}</Text>
        </View>

        <View style={styles.buttonGrid}>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => {
                if (!status.is_premium) {
                  navigation.navigate('VehicleCompatibility', { user: loggedUser, vehicle: status.vehicle });
                } else {
                  navigation.navigate('OBD', { user: loggedUser });
                }
              }}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="engine" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>OBD</Text>
              <Text style={styles.gridButtonSub}>Diagnóstico de Bordo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('TravelPlanning', { user: loggedUser })}
            >
              <View style={styles.iconCircle}>
                <FontAwesome5 name="route" size={45} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Planeje sua viagem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('VehicleRegistration', { user: loggedUser })}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="car-info" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Dados do veículo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={status.is_premium ? () => navigation.navigate('MaintenanceTips', { user: loggedUser }) : handlePremiumButton}
            >
              <View style={styles.iconCircle}>
                <FontAwesome5 name="tools" size={45} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Dicas de manutenção</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={status.is_premium ? () => navigation.navigate('PartsCatalog', { user: loggedUser }) : handlePremiumButton}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons name="settings-input-component" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Informações OBD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('TripHistory', { user: loggedUser })}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={50} color="#FFCF00" />
              </View>
              <Text style={styles.gridButtonTitle}>Histórico</Text>
              <Text style={styles.gridButtonSub}>Relatório de Viagens</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptySpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Home" />

      {/* ---------- MODAL: PERFIL ---------- */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <Pressable style={styles.profileModalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Meu perfil</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={26} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarLarge}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarLargeImage} />
                  ) : (
                    <FontAwesome5 name="user-alt" size={36} color="#FFCF00" />
                  )}
                </View>
                <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
                  <Ionicons name="camera-outline" size={16} color="#000000" />
                  <Text style={styles.changePhotoText}>Alterar foto</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={profileForm.full_name}
                onChangeText={(text) => setProfileForm((prev) => ({ ...prev, full_name: text }))}
                placeholder="Seu nome completo"
              />

              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={profileForm.email}
                onChangeText={(text) => setProfileForm((prev) => ({ ...prev, email: text }))}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={profileForm.phone}
                onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone: text }))}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={styles.saveButtonText}>
                  {savingProfile ? 'Salvando...' : 'Salvar alterações'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
                <Text style={styles.logoutButtonText}>Sair da conta</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- MODAL: NOTIFICAÇÕES ---------- */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setNotificationModalVisible(false)}>
          <Pressable style={styles.notificationModalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Notificações</Text>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                <Ionicons name="close" size={26} color="#000000" />
              </TouchableOpacity>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllButtonText}>Marcar todas como lidas</Text>
              </TouchableOpacity>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <Text style={styles.emptyNotificationsText}>Nenhuma notificação por aqui.</Text>
              ) : (
                notifications.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.notificationItem,
                      !item.read && styles.notificationItemUnread
                    ]}
                  >
                    <View style={styles.notificationDot}>
                      {!item.read && <View style={styles.notificationDotActive} />}
                    </View>
                    <View style={styles.notificationTextWrap}>
                      <Text style={styles.notificationItemTitle}>{item.title}</Text>
                      <Text style={styles.notificationItemDescription}>{item.description}</Text>
                      <Text style={styles.notificationItemTime}>{item.time}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll'
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#ffffff'
  },
  logo: {
    width: 170,
    height: 58
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notificationButton: {
    marginRight: 16,
    padding: 4
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#D32F2F',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden'
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center'
  },
  titleBlock: {
    width: '100%',
    marginBottom: 25
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFCF00',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '100%'
  },
  lampIcon: {
    width: 32,
    height: 34,
    marginRight: 15
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 18
  },
  buttonGrid: {
    width: '100%',
    marginTop: 30
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  gridButton: {
    backgroundColor: '#2C2C2C',
    width: '48%',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140
  },
  iconCircle: {
    marginBottom: 10
  },
  gridIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFCF00'
  },
  gridButtonTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  gridButtonSub: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2
  },
  emptySpace: {
    height: 100
  },

  // ---------- Modais (estilos compartilhados) ----------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 12
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000'
  },

  // ---------- Modal de perfil ----------
  profileModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%'
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarLargeImage: {
    width: 90,
    height: 90,
    borderRadius: 45
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
    marginTop: 14
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FAFAFA'
  },
  saveButton: {
    backgroundColor: '#FFCF00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },

  // ---------- Modal de notificações ----------
  notificationModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '80%'
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginBottom: 12
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textDecorationLine: 'underline'
  },
  emptyNotificationsText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 13,
    marginTop: 30
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  notificationItemUnread: {
    backgroundColor: '#FFFCEB'
  },
  notificationDot: {
    width: 18,
    alignItems: 'center',
    paddingTop: 4
  },
  notificationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCF00'
  },
  notificationTextWrap: {
    flex: 1,
    marginLeft: 6
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4
  },
  notificationItemDescription: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
    marginBottom: 4
  },
  notificationItemTime: {
    fontSize: 11,
    color: '#999999'
  }
});

export default HomeScreen;