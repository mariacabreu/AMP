import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EmptyChecklist = () => {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="check-decagram" size={60} color="#FFCF00" />
      <Text style={styles.emptyText}>
        Tudo em dia! Nenhuma manutenção preventiva necessária agora.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
});

export default EmptyChecklist;