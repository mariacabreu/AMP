import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

const ReminderFrequencyScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  
  const frequencies = [
    { id: 'daily', label: 'Diariamente', icon: 'calendar-today', description: 'Receba um lembrete todos os dias' },
    { id: 'weekly', label: 'Semanalmente', icon: 'calendar-week', description: 'Receba um lembrete uma vez por semana' },
    { id: 'biweekly', label: 'A cada 15 dias', icon: 'calendar-range', description: 'Receba um lembrete a cada 15 dias' },
    { id: 'monthly', label: 'Mensalmente', icon: 'calendar-month', description: 'Receba um lembrete uma vez por mês' },
  ];

  const [selectedFrequency, setSelectedFrequency] = useState('biweekly');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FREQUÊNCIA DOS LEMBRETES</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Escolha com que frequência você deseja receber os lembretes
        </Text>

        {frequencies.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.frequencyCard,
              selectedFrequency === freq.id && styles.selectedCard
            ]}
            onPress={() => setSelectedFrequency(freq.id)}
          >
            <MaterialCommunityIcons
              name={freq.icon}
              size={40}
              color={selectedFrequency === freq.id ? '#000' : '#FFCF00'}
            />
            <View style={styles.frequencyInfo}>
              <Text style={[
                styles.frequencyLabel,
                selectedFrequency === freq.id && styles.selectedLabel
              ]}>
                {freq.label}
              </Text>
              <Text style={[
                styles.frequencyDescription,
                selectedFrequency === freq.id && styles.selectedDescription
              ]}>
                {freq.description}
              </Text>
            </View>
            {selectedFrequency === freq.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={32}
                color="#2D2D2D"
              />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar Preferências</Text>
        </TouchableOpacity>

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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000'
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'scroll' }
    })
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedCard: {
    backgroundColor: '#FFCF00',
    borderColor: '#2D2D2D'
  },
  frequencyInfo: {
    flex: 1,
    marginLeft: 15
  },
  frequencyLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4
  },
  selectedLabel: {
    color: '#000'
  },
  frequencyDescription: {
    fontSize: 13,
    color: '#666'
  },
  selectedDescription: {
    color: '#000'
  },
  saveButton: {
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: {
    color: '#FFCF00',
    fontSize: 16,
    fontWeight: '700'
  },
  footerSpace: {
    height: 50
  }
});

export default ReminderFrequencyScreen;
