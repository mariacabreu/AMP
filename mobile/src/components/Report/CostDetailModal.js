import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CostDetailModal = ({ visible, item, formatDate, onClose }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalContent}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>

          {item && (
            <View>
              <View style={styles.detailIconWrapper}>
                <MaterialCommunityIcons
                  name={item.item.includes('Gasolina') ? 'gas-station' : 'tools'}
                  size={40}
                  color="#2b2b2b"
                />
              </View>
              <Text style={styles.modalPartName}>{item.item}</Text>

              <View style={styles.detailSection}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DATA</Text>
                  <Text style={styles.detailText}>{formatDate(item.last_date)}</Text>
                </View>

                {item.liters > 0 && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>LITROS ABASTECIDOS</Text>
                    <Text style={styles.detailText}>
                      {item.liters.toFixed(1)} L a R$ {(item.cost / item.liters).toFixed(2)} /L
                    </Text>
                  </View>
                )}

                <View style={[styles.detailItem, styles.totalItem]}>
                  <Text style={[styles.detailLabel, styles.totalLabel]}>VALOR TOTAL</Text>
                  <Text style={[styles.detailText, styles.totalText]}>
                    R$ {item.cost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 40,
    width: '100%',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  detailIconWrapper: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPartName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailSection: {
    marginTop: 5,
  },
  detailItem: {
    marginBottom: 15,
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
  totalItem: {
    backgroundColor: '#FFF9E6',
  },
  totalLabel: {
    color: '#B8860B',
  },
  totalText: {
    fontWeight: '800',
    fontSize: 22,
  },
});

export default CostDetailModal;