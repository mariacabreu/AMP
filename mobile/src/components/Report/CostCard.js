import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CostCard = ({
  item,
  isEditingMode,
  isDeletingMode,
  formatDate,
  onPress,
  onEdit,
  onDelete,
}) => {
  const isGasoline = item.item.includes('Gasolina');

  return (
    <TouchableOpacity
      style={styles.costCard}
      activeOpacity={0.85}
      onPress={() => onPress(item)}
    >
      <View style={styles.costIconContainer}>
        <MaterialCommunityIcons
          name={isGasoline ? 'gas-station' : 'tools'}
          size={35}
          color="#1e1e1e"
        />
      </View>
      <View style={styles.costInfo}>
        <Text style={styles.costType}>{item.item}</Text>
        <Text style={styles.costDetail}>📅 {formatDate(item.last_date)}</Text>
        {item.liters > 0 && (
          <Text style={styles.costDetail}>
            🛢️ {item.liters.toFixed(1)} L a R$ {(item.cost / item.liters).toFixed(2)}
          </Text>
        )}
      </View>
      <View style={styles.costRight}>
        <Text style={styles.costValue}>R$ {item.cost.toFixed(2)}</Text>
        {isEditingMode && (
          <TouchableOpacity style={styles.editItemButton} onPress={() => onEdit(item)}>
            <MaterialCommunityIcons name="pencil" size={20} color="#FFCF00" />
            <Text style={styles.editItemText}>EDITAR</Text>
          </TouchableOpacity>
        )}
        {isDeletingMode && (
          <TouchableOpacity
            style={[styles.editItemButton, styles.deleteItemButton]}
            onPress={() => onDelete(item.id)}
          >
            <MaterialCommunityIcons name="trash-can" size={20} color="#FFF" />
            <Text style={[styles.editItemText, styles.deleteItemText]}>EXCLUIR</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  costCard: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  costIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  costInfo: {
    flex: 1,
  },
  costType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  costDetail: {
    fontSize: 11,
    color: '#333',
  },
  costRight: {
    alignItems: 'flex-end',
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  editItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b2b2b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 5,
  },
  deleteItemButton: {
    backgroundColor: '#FF5252',
  },
  editItemText: {
    color: '#FFCF00',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  deleteItemText: {
    color: '#FFF',
  },
});

export default CostCard;