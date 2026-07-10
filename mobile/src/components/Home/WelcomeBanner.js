import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WelcomeBanner = ({ userName, recommendation }) => {
  const firstName = (userName || '').split(' ')[0];

  return (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.greetingText}>
          Olá, <Text style={styles.userNameText}>{firstName}</Text>
        </Text>
        <Text style={styles.subtitle}>Vamos cuidar do seu veículo hoje?</Text>
      </View>

      <View style={styles.recommendationCard}>
        <View style={styles.alertIconBadge}>
          <MaterialCommunityIcons name="lightbulb-on" size={22} color="#FFCF00" />
        </View>
        <Text style={styles.recommendationText}>{recommendation}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  titleBlock: {
    width: '100%',
    marginBottom: 25
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6
  },
  userNameText: {
    fontWeight: '800',
    color: '#000000'
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center'
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '100%'
  },
  alertIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 18
  }
});

export default React.memo(WelcomeBanner);