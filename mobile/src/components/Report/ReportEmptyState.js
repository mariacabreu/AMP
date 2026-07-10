import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ReportEmptyState = ({ onAddPress }) => {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="database-off" size={50} color="#D9D9D9" />
      <Text style={styles.emptyStateText}>Nenhum registro encontrado.</Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={onAddPress}>
        <Text style={styles.addFirstButtonText}>Adicionar primeiro custo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#D9D9D9',
    fontSize: 16,
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#2b2b2b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFCF00',
    fontWeight: '600',
  },
});

export default ReportEmptyState;