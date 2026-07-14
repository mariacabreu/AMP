import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../api';
import BottomNav from '../NavBar/BottomNav';
import SelectableOptionCard from '../Common/SelectableOptionCard';
import PrimaryButton from '../Common/PrimaryButton';
import AMPAlertModal from '../Common/AMPAlertModal';

const FREQUENCIES = [
    { id: 'daily', label: 'Diariamente', icon: 'calendar-today', description: 'Receba um lembrete todos os dias' },
    { id: 'weekly', label: 'Semanalmente', icon: 'calendar-week', description: 'Receba um lembrete uma vez por semana' },
    { id: 'biweekly', label: 'A cada 15 dias', icon: 'calendar-range', description: 'Receba um lembrete a cada 15 dias' },
    { id: 'monthly', label: 'Mensalmente', icon: 'calendar-month', description: 'Receba um lembrete uma vez por mês' },
];

const ReminderFrequencyScreen = ({ navigation, route }) => {
    const loggedUser = route.params?.user;

    const [selectedFrequency, setSelectedFrequency] = useState(
        loggedUser?.reminder_frequency || 'biweekly'
    );
    const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState({
        type: 'info',
        title: '',
        message: '',
        confirmButtonText: 'Ok',
        onConfirm: () => setModalVisible(false),
    });

    // Busca a preferência atual do usuário no backend (caso não tenha vindo em route.params)
    useEffect(() => {
        if (loggedUser?.reminder_frequency || !loggedUser?.id) return;

        const fetchCurrentFrequency = async () => {
            try {
                setIsLoadingCurrent(true);
                const response = await axios.get(`${API_BASE_URL}/user/${loggedUser.id}`);
                if (response.data?.reminder_frequency) {
                    setSelectedFrequency(response.data.reminder_frequency);
                }
            } catch (error) {
                // Se a busca falhar, mantemos o default local silenciosamente
                console.error('Erro ao buscar frequência atual:', error.response?.data || error.message);
            } finally {
                setIsLoadingCurrent(false);
            }
        };

        fetchCurrentFrequency();
    }, [loggedUser?.id]);

    const handleSave = async () => {
        if (!loggedUser?.id) {
            setModalData({
                type: 'error',
                title: 'Erro',
                message: 'Usuário não identificado. Faça login novamente.',
                confirmButtonText: 'Ok',
                onConfirm: () => setModalVisible(false),
            });
            setModalVisible(true);
            return;
        }

        try {
            setIsSaving(true);
            await axios.put(`${API_BASE_URL}/user/${loggedUser.id}`, {
                reminder_frequency: selectedFrequency,
            });

            setModalData({
                type: 'success',
                title: 'Sucesso!',
                message: 'Suas preferências de lembrete foram salvas.',
                confirmButtonText: 'Ok',
                onConfirm: () => setModalVisible(false),
            });
            setModalVisible(true);
        } catch (error) {
            console.error('Erro ao salvar frequência:', error.response?.data || error.message);
            setModalData({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível salvar suas preferências agora. Tente novamente mais tarde.',
                confirmButtonText: 'Ok',
                onConfirm: () => setModalVisible(false),
            });
            setModalVisible(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Fixo */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.logoContainer} pointerEvents="none">
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>FREQUÊNCIA DOS LEMBRETES</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>
                    Escolha com que frequência você deseja receber os lembretes
                </Text>

                {isLoadingCurrent ? (
                    <ActivityIndicator size="large" color="#FFCF00" style={{ marginTop: 20 }} />
                ) : (
                    FREQUENCIES.map((freq) => (
                        <SelectableOptionCard
                            key={freq.id}
                            icon={freq.icon}
                            label={freq.label}
                            description={freq.description}
                            selected={selectedFrequency === freq.id}
                            onPress={() => setSelectedFrequency(freq.id)}
                            disabled={isSaving}
                        />
                    ))
                )}

                <PrimaryButton
                    label="Salvar Preferências"
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={isLoadingCurrent}
                />

                <View style={styles.footerSpace} />
            </ScrollView>

            <BottomNav navigation={navigation} user={loggedUser} activeScreen="Config" />
            <AMPAlertModal
        visible={modalVisible}
        type={modalData.type}
        title={modalData.title}
        message={modalData.message}
        confirmButtonText={modalData.confirmButtonText}
        onConfirm={modalData.onConfirm}
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
      },
    }),
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
    height: 60,
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
    ...Platform.select({
      web: { overflowY: 'scroll' },
    }),
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  footerSpace: {
    height: 50,
  },
});

export default ReminderFrequencyScreen;