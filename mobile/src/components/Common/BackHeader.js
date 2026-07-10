import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * BackHeader
 *
 * Header simples com botão de voltar, título centralizado e um espaço
 * reservado à direita (para manter o título centralizado mesmo sem
 * um ícone equivalente do lado direito).
 *
 * Props:
 * - title: texto do cabeçalho
 * - onBack: função chamada ao tocar na seta (default: navigation.goBack())
 * - rightElement: elemento opcional para exibir à direita (ex: ícone de ação)
 */
const BackHeader = ({ title, onBack, rightElement = null }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSlot}>{rightElement}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightSlot: {
    width: 28,
    alignItems: 'flex-end',
  },
});

export default BackHeader;