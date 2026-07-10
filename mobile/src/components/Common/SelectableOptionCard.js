import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * SelectableOptionCard
 *
 * Card usado para listas de opções únicas (rádio-like), como a
 * frequência de lembretes. Mostra ícone, título, descrição e um
 * check quando selecionado.
 *
 * Props:
 * - icon: nome do ícone (MaterialCommunityIcons)
 * - label / description: textos do card
 * - selected: se este card está selecionado
 * - onPress: callback ao tocar
 * - disabled: desabilita o toque
 */
const SelectableOptionCard = ({ icon, label, description, selected, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={icon}
        size={40}
        color={selected ? '#000' : '#FFCF00'}
      />
      <View style={styles.info}>
        <Text style={[styles.label, selected && styles.selectedText]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, selected && styles.selectedText]}>{description}</Text>
        ) : null}
      </View>
      {selected && (
        <MaterialCommunityIcons name="check-circle" size={32} color="#2D2D2D" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: '#FFCF00',
    borderColor: '#2D2D2D',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
  },
  selectedText: {
    color: '#000',
  },
});

export default SelectableOptionCard;