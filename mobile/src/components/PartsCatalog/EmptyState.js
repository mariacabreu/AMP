import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EmptyState = ({ message = 'Nenhuma peça encontrada.' }) => {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="package-variant-closed" size={50} color="#D9D9D9" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EmptyState;