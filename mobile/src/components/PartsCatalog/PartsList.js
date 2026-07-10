import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PartCard from './PartCard';
import EmptyState from './EmptyState';

const PartsList = ({ parts, selectedCategory, onPartPress }) => {
  if (parts.length === 0) {
    return <EmptyState />;
  }

  // Visualização em "Todos": lista contínua de cards sem títulos de seção
  if (selectedCategory === 'Todos') {
    return (
      <>
        {parts.map((part) => (
          <PartCard key={part.id} part={part} onPress={onPartPress} />
        ))}
      </>
    );
  }

  // Visualização com filtro selecionado: exibe o título da categoria e as peças dela
  return (
    <View style={styles.subcategorySection}>
      <View style={styles.subcategoryHeader}>
        <Text style={styles.subcategoryTitle}>{selectedCategory.toUpperCase()}</Text>
        <View style={styles.subcategoryLine} />
      </View>
      {parts.map((part) => (
        <PartCard key={part.id} part={part} onPress={onPartPress} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  subcategorySection: {
    marginBottom: 25,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  subcategoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFCF00',
    marginRight: 10,
  },
  subcategoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D9D9',
  },
});

export default PartsList;