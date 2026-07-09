import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PRIORITY_COLORS = {
  'URGENTE': '#FF4444',
  'PRÓXIMOS 30 DIAS': '#FF8C00',
  'PRÓXIMOS 60 DIAS': '#1E90FF',
  'PRÓXIMOS 90 DIAS': '#32CD32',
};

const getPriorityColor = (priority) => {
  const safePriority = String(priority || '').toUpperCase();
  return PRIORITY_COLORS[safePriority] || '#666';
};

const PriorityBadge = ({ priority }) => {
  return (
    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) }]}>
      <Text style={styles.priorityText}>{priority}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
});

export default PriorityBadge;