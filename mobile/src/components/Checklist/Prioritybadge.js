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
      <Text
        style={styles.priorityText}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {priority}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,        // era 2 — aumentado pra dar espaço vertical
    borderRadius: 4,
    alignSelf: 'flex-start',   // impede que o badge estique/encolha errado
    flexShrink: 0,             // impede que o container "espreme" o badge num row
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 13,            // fontSize * ~1.4, dá espaço pros acentos (Ó, Ú etc.)
    fontWeight: '900',
    includeFontPadding: false, // Android: remove padding "fantasma" que às vezes desalinha
    textAlignVertical: 'center',
  },
});

export default PriorityBadge;