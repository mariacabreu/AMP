import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PartDetailModal = ({ visible, part, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>

          {part && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalPartName}>{part.name.toUpperCase()}</Text>
              <Text style={styles.modalCategory}>{part.category}</Text>

              <View style={styles.detailSection}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>PARA QUE SERVE?</Text>
                  <Text style={styles.detailText}>
                    {part.details?.purpose || 'Informação não disponível.'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ONDE FICA?</Text>
                  <Text style={styles.detailText}>
                    {part.details?.location || 'Informação não disponível.'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>PROBLEMAS COMUNS:</Text>
                  <Text style={styles.detailText}>
                    {part.details?.common_problems || 'Informação não disponível.'}
                  </Text>
                </View>

                {part.details?.maintenance_interval && (
                  <View style={[styles.detailItem, styles.maintenanceItem]}>
                    <Text style={[styles.detailLabel, styles.maintenanceLabel]}>
                      INTERVALO RECOMENDADO:
                    </Text>
                    <Text style={[styles.detailText, styles.maintenanceText]}>
                      {part.details.maintenance_interval}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.modalActionBtn} onPress={onClose}>
                <Text style={styles.modalActionBtnText}>ENTENDI</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalPartName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
  modalCategory: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailSection: {
    marginTop: 10,
  },
  detailItem: {
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 15,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFCF00',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  maintenanceItem: {
    backgroundColor: '#FFF9E6',
    padding: 10,
    borderRadius: 8,
  },
  maintenanceLabel: {
    color: '#B8860B',
  },
  maintenanceText: {
    fontWeight: '700',
  },
  modalActionBtn: {
    backgroundColor: '#2c2c2c',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  modalActionBtnText: {
    color: '#FFCF00',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default PartDetailModal;