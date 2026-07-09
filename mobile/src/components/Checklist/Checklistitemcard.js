import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PriorityBadge from './Prioritybadge';

const ChecklistItemCard = ({ item, isMarkingDone, onReminderPress, onMarkDonePress }) => {
  return (
    <View style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <PriorityBadge priority={item.priority} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.textContainer}>
          <Text style={styles.descriptionText}>
            {item.description || 'Descrição não disponível'}
          </Text>
          <Text style={styles.reasonTitle}>POR QUE TROCAR?</Text>
          <Text style={styles.reasonText}>{item.reason || 'Motivo não disponível'}</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.reminderButton, isMarkingDone && { opacity: 0.5 }]}
          onPress={onReminderPress}
          disabled={isMarkingDone}
        >
          <MaterialCommunityIcons name="clock-alert" size={18} color="#333" />
          <Text style={styles.reminderButtonText}>Lembrete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.markDoneButton, isMarkingDone && { opacity: 0.5 }]}
          onPress={onMarkDonePress}
          disabled={isMarkingDone}
        >
          <MaterialCommunityIcons name="check-circle" size={18} color="#FFCF00" />
          <Text style={styles.markDoneText}>
            {isMarkingDone ? 'Processando...' : 'Marcar Feito'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#D9D9D9',
    padding: 15,
    marginBottom: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  descriptionText: {
    fontSize: 11,
    color: '#000',
    lineHeight: 14,
    textAlign: 'justify',
    marginBottom: 8,
  },
  reasonTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 10,
    color: '#444',
    lineHeight: 12,
    textAlign: 'justify',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c4c4c4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flex: 1,
  },
  reminderButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flex: 1,
  },
  markDoneText: {
    color: '#FFCF00',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ChecklistItemCard;