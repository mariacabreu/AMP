import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * PrimaryButton
 *
 * Botão de ação principal (fundo escuro, texto amarelo), com suporte
 * a estado de carregamento e desabilitado.
 */
const PrimaryButton = ({ label, onPress, loading = false, disabled = false, style }) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && { opacity: 0.6 }, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFCF00" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFCF00',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PrimaryButton;