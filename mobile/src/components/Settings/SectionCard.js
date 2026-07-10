import React, { Children, Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * SectionCard
 *
 * Card branco com título e separadores automáticos entre os filhos (MenuItem).
 *
 * Props:
 * - title: título da seção
 * - headerIcon: nome de um ícone MaterialIcons opcional exibido ao lado do título
 * - children: itens da seção (normalmente <MenuItem />)
 */
const SectionCard = ({ title, headerIcon, children }) => {
  const items = Children.toArray(children);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {headerIcon ? <MaterialIcons name={headerIcon} size={20} color="#2D2D2D" /> : null}
      </View>
      <View style={styles.separator} />

      {items.map((child, index) => (
        <Fragment key={index}>
          {child}
          {index < items.length - 1 && <View style={styles.separator} />}
        </Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00000036',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#0000001A',
    marginHorizontal: 15,
  },
});

export default SectionCard;