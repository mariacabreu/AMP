import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';
import Header from '../components/Header/Header';
import SectionCard from '../components/Settings/SectionCard';
import MenuItem from '../components/Settings/MenuItem';
import DeleteAccountModal from '../components/Settings/DeleteAccountModal';

const SettingsScreen = ({ navigation, route }) => {
    const loggedUser = route.params?.user;

    const [notificationsDisabled, setNotificationsDisabled] = useState(false);
    const [biometryEnabled, setBiometryEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Estado para Header
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [avatarUri, setAvatarUri] = useState(loggedUser?.avatar_url || null);
    const [profileForm, setProfileForm] = useState({
        full_name: loggedUser?.full_name || loggedUser?.name || '',
        email: loggedUser?.email || '',
        phone: loggedUser?.phone || ''
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [isPremium, setIsPremium] = useState(!!loggedUser?.is_premium);
    const [planType, setPlanType] = useState(loggedUser?.plan_type || null);
    const [vehicle, setVehicle] = useState(null);

    useEffect(() => {
        fetchNotifications();
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const userId = loggedUser?.id || 1;
            const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
            if (statusRes.data?.user) {
                const u = statusRes.data.user;
                setProfileForm({
                    full_name: u.full_name || u.name || '',
                    email: u.email || '',
                    phone: u.phone || ''
                });
                setAvatarUri(u.avatar_url || null);
                setIsPremium(!!u.is_premium);
                setPlanType(u.plan_type || null);
            }
            const vehicleData = Array.isArray(statusRes.data?.vehicles)
                ? statusRes.data.vehicles[0]
                : statusRes.data?.vehicle || null;
            setVehicle(vehicleData);
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const userId = loggedUser?.id || 1;
            const res = await axios.get(`${API_BASE_URL}/user/notifications/${userId}`);
            const data = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
            setNotifications(data);
            setNotificationCount(data.filter((n) => !n.read).length);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!loggedUser?.id) {
                return undefined;
            }

            fetchNotifications();
            fetchUserData();

            return undefined;
        }, [loggedUser?.id])
    );

    const handleMarkAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setNotificationCount(0);
        try {
            const userId = loggedUser?.id || 1;
            await axios.patch(`${API_BASE_URL}/user/notifications/${userId}/read-all`);
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
        }
    };

    const handleChangeField = (field, value) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleChangePhoto = async () => {
        Alert.alert('Em breve', 'Seleção de foto ainda não implementada.');
    };

    const handleSaveProfile = async () => {
        try {
            setSavingProfile(true);
            const userId = loggedUser?.id || 1;
            await axios.patch(`${API_BASE_URL}/user/${userId}`, profileForm);
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAddVehicle = () => {
        navigation.navigate('AddVehicle', { user: loggedUser });
    };

    const handleLogout = () => {
        Alert.alert('Sair', 'Deseja realmente sair da conta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair',
                style: 'destructive',
                onPress: () => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            }
        ]);
    };

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

            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
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
            <Header
                avatarUri={avatarUri}
                notifications={notifications}
                notificationCount={notificationCount}
                onMarkAllAsRead={handleMarkAllAsRead}
                profileForm={profileForm}
                onChangeField={handleChangeField}
                onChangePhoto={handleChangePhoto}
                onSaveProfile={handleSaveProfile}
                savingProfile={savingProfile}
                onLogout={handleLogout}
                isPremium={isPremium}
                planType={planType}
                vehicle={vehicle}
                navigation={navigation}
                loggedUser={loggedUser}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.screenTitle}>CONFIGURAÇÕES</Text>

                <SectionCard title="Notificações">
                    <MenuItem
                        icon={<MaterialCommunityIcons name="bell-off-outline" size={20} color="#2D2D2D" />}
                        label="Desativar Notificações"
                        switchValue={notificationsDisabled}
                        onSwitchChange={setNotificationsDisabled}
                    />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="car-cog" size={20} color="#2D2D2D" />}
                        label="Lembretes Programáveis"
                        disabled={notificationsDisabled}
                        onPress={() => navigation.navigate('Reminders', { user: loggedUser })}
                    />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="cash-multiple" size={20} color="#2D2D2D" />}
                        label="Frequência dos Lembretes"
                        disabled={notificationsDisabled}
                        onPress={() => navigation.navigate('ReminderFrequency', { user: loggedUser })}
                    />
                </SectionCard>

                <SectionCard title="Preferências">
                    <MenuItem
                        icon={<MaterialCommunityIcons name="fingerprint" size={20} color="#2D2D2D" />}
                        label="Ativar/Desativar Biometria"
                        switchValue={biometryEnabled}
                        onSwitchChange={setBiometryEnabled}
                    />
                </SectionCard>

                <SectionCard title="Ajuda e Suporte" headerIcon="info">
                    <MenuItem
                        icon={<MaterialCommunityIcons name="help-circle-outline" size={20} color="#2D2D2D" />}
                        label="FAQ"
                        onPress={() => navigation.navigate('FAQ', { user: loggedUser })}
                    />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="translate" size={20} color="#2D2D2D" />}
                        label="Idioma"
                        onPress={() => navigation.navigate('LanguageSelection', { user: loggedUser })}
                    />
                </SectionCard>

                <SectionCard title="Privacidade e Segurança" headerIcon="lock">
                    <MenuItem
                        icon={<MaterialCommunityIcons name="map-marker-outline" size={20} color="#2D2D2D" />}
                        label="Permitir Localização"
                        switchValue={locationEnabled}
                        onSwitchChange={setLocationEnabled}
                    />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="file-document-outline" size={20} color="#2D2D2D" />}
                        label="Política de Termos e Condições"
                        onPress={() => navigation.navigate('TermsOfService', { user: loggedUser })}
                    />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF4444" />}
                        label="Apagar Conta/Apagar Dados"
                        danger
                        onPress={openDeleteModal}
                    />
                </SectionCard>

                <View style={styles.footerSpace} />
            </ScrollView>

            <BottomNav navigation={navigation} user={loggedUser} activeScreen="Config" />

            <DeleteAccountModal
                visible={deleteModalVisible}
                isDeleting={isDeleting}
                onCancel={cancelDelete}
                onConfirm={confirmDeleteAccount}
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
        overflow: 'hidden',
      },
      default: {
        flex: 1,
      }
    })
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
  footerSpace: {
    height: 20,
  },
});

export default SettingsScreen;
