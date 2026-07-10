import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const HistoryHeader = ({
  isEditingMode,
  isDeletingMode,
  onToggleEditing,
  onToggleDeleting,
  onAddPress,
}) => {
  return (
    <View style={styles.historyHeader}>
      <Text style={styles.historyTitle}>HISTÓRICO DE CUSTOS</Text>
      <View style={styles.historyActions}>
        <TouchableOpacity onPress={onAddPress}>
          <MaterialIcons name="add-circle" size={32} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionSpacing} onPress={onToggleEditing}>
          <MaterialCommunityIcons
            name={isEditingMode ? 'check-circle' : 'square-edit-outline'}
            size={28}
            color={isEditingMode ? '#FFCF00' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionSpacing} onPress={onToggleDeleting}>
          <MaterialCommunityIcons
            name={isDeletingMode ? 'check-circle' : 'trash-can-outline'}
            size={28}
            color={isDeletingMode ? '#FFCF00' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSpacing: {
    marginLeft: 10,
  },
});

export default HistoryHeader;