import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomSwitch from './CustomSwitch';

/**
 * MenuItem
 *
 * Linha de menu genérica usada dentro de um SectionCard.
 *
 * Props:
 * - icon: elemento de ícone já renderizado (ex: <MaterialCommunityIcons name="..." size={20} color="..." />)
 * - label: texto exibido
 * - onPress: função chamada ao tocar (ignorada se houver `switchValue`)
 * - danger: deixa o texto/ícone em vermelho (ex: excluir conta)
 * - disabled: desabilita o toque e aplica opacidade reduzida
 * - switchValue / onSwitchChange: se informados, renderiza um CustomSwitch no lugar do chevron
 * - showChevron: controla se a seta ">" aparece (default: true quando não há switch)
 */
const MenuItem = ({
  icon,
  label,
  onPress,
  danger = false,
  disabled = false,
  switchValue,
  onSwitchChange,
  showChevron,
}) => {
  const hasSwitch = typeof switchValue === 'boolean' && !!onSwitchChange;
  const shouldShowChevron = showChevron ?? !hasSwitch;
  const color = danger ? '#FF4444' : '#2D2D2D';
  const labelColor = danger ? '#FF4444' : '#333';

  const content = (
    <View style={[styles.menuItem, disabled && { opacity: 0.5 }]}>
      <View style={styles.menuLabelRow}>
        {icon ? <View style={styles.menuIcon}>{icon}</View> : null}
        <Text style={[styles.menuLabel, { color: labelColor }]}>{label}</Text>
      </View>

      {hasSwitch ? (
        <CustomSwitch value={switchValue} onValueChange={onSwitchChange} />
      ) : shouldShowChevron ? (
        <Ionicons name="chevron-forward" size={20} color={danger ? '#FF4444' : '#666'} />
      ) : null}
    </View>
  );

  // Itens com switch não precisam de TouchableOpacity (o próprio switch já é tocável)
  if (hasSwitch) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingRight: 10,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    flexShrink: 1,
  },
});

export default MenuItem;