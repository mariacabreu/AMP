import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Modal genérico para capturar o valor (R$) gasto em uma manutenção.
// Mantém seu próprio estado de input, então pode ser reaproveitado em
// qualquer tela que precise pedir um valor monetário antes de confirmar.
const MaintenanceCostModal = ({ visible, itemName, isSubmitting, onCancel, onConfirm }) => {
  const [rawCost, setRawCost] = useState('');

  useEffect(() => {
    if (visible) {
      setRawCost('000');
    }
  }, [visible]);

  const formattedCost = useMemo(() => {
    const cleaned = rawCost.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawCost]);

  const handleConfirm = () => {
    const cleanedCost = rawCost.replace(/[^0-9]/g, '');
    const costValue = cleanedCost.length > 0 ? parseInt(cleanedCost, 10) / 100 : 0;

    if (costValue <= 0) {
      Alert.alert('Aviso!', 'Por favor, insira o valor gasto com a manutenção.');
      return;
    }

    onConfirm(costValue);
  };

  const handleCancel = () => {
    setRawCost('');
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialCommunityIcons name="alert-circle" size={50} color="#FFCF00" />
          <Text style={styles.modalTitle}>Valor da Manutenção</Text>
          <Text style={styles.modalText}>
            Adicione o valor gasto com {itemName ? `"${itemName}"` : 'essa manutenção'}:
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>R$ </Text>
            <TextInput
              style={styles.costInput}
              placeholder="0,00"
              value={formattedCost}
              onChangeText={(text) => {
                const cleanedText = text.replace(/[^0-9]/g, '');
                setRawCost(cleanedText);
              }}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Sim, Concluído</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    ...Platform.select({
      web: {
        maxWidth: 400,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#2E2E2E',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFCF00',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
  },
  currencyPrefix: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  costInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});

export default MaintenanceCostModal;