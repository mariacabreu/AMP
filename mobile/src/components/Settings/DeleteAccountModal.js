import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * DeleteAccountModal
 *
 * Props:
 * - visible: controla a exibição do modal
 * - isDeleting: mostra spinner e desabilita os botões durante a requisição
 * - onCancel: chamado ao cancelar / fechar o modal
 * - onConfirm: chamado ao confirmar a exclusão
 */
const DeleteAccountModal = ({ visible, isDeleting, onCancel, onConfirm }) => {
  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialCommunityIcons name="alert-octagon" size={50} color="#FF4444" />
          <Text style={styles.modalTitle}>Excluir Conta</Text>
          <Text style={styles.modalText}>
            Esta ação é <Text style={{ fontWeight: '800', color: '#FF4444' }}>permanente e irreversível</Text>.
            Todos os seus dados, veículos cadastrados e histórico de manutenção serão apagados
            e não poderão ser recuperados. Tem certeza que deseja continuar?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={isDeleting}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteConfirmButton, isDeleting && { opacity: 0.6 }]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteConfirmButtonText}>Sim, Excluir</Text>
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
      }
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
    color: '#000',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
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
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DeleteAccountModal;