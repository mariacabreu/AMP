import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

const PartCard = ({ part, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.partCard}
      onPress={() => onPress(part)}
      activeOpacity={0.7}
    >
      <View style={styles.partInfo}>
        <Text style={styles.partName}>{part.name}</Text>
        <Text style={styles.partDescription}>{part.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  partCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    minHeight: 120,
  },
  partInfo: {
    flex: 1,
    paddingRight: 10,
  },
  partName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 5,
  },
  partDescription: {
    fontSize: 10,
    color: '#000',
    lineHeight: 14,
    textAlign: 'justify',
  },
});

export default PartCard;