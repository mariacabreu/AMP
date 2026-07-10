import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../../api';
import BottomNav from '../NavBar/BottomNav';
import Header from '../Header/Header';
import SelectableOptionCard from '../Common/SelectableOptionCard';
import PrimaryButton from '../Common/PrimaryButton';

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

  // Busca a preferência atual do usuário no backend (caso não tenha vindo em route.params)
  useEffect(() => {
    if (loggedUser?.reminder_frequency || !loggedUser?.id) return;

    const fetchCurrentFrequency = async () => {
      try {
        setIsLoadingCurrent(true);
        const response = await axios.get(`${API_BASE_URL}/user/${loggedUser.id}/reminder-frequency`);
        if (response.data?.frequency) {
          setSelectedFrequency(response.data.frequency);
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
      Alert.alert('Erro', 'Usuário não identificado. Faça login novamente.');
      return;
    }

    try {
      setIsSaving(true);
      await axios.put(`${API_BASE_URL}/user/${loggedUser.id}/reminder-frequency`, {
        frequency: selectedFrequency,
      });

      Alert.alert('Sucesso', 'Suas preferências de lembrete foram salvas.');
    } catch (error) {
      console.error('Erro ao salvar frequência:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível salvar suas preferências agora. Tente novamente mais tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        showIcons={false}
        navigation={navigation}
        loggedUser={loggedUser}
      />

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
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'scroll' },
    }),
  },
  content: {
    paddingHorizontal: 20,
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