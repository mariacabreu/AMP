import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * AMPAlertModal
 * 
 * Props:
 * - visible: boolean
 * - type: 'success' | 'error' | 'info' | 'warning' | 'confirm'
 * - title: string
 * - message: string
 * - confirmButtonText: string (default 'Ok')
 * - cancelButtonText: string (default 'Cancelar')
 * - onConfirm: function
 * - onCancel: function
 * - isLoading: boolean (optional, for actions like saving)
 */
const AMPAlertModal = ({
  visible,
  type = 'info',
  title,
  message,
  confirmButtonText = 'Ok',
  cancelButtonText = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!visible) return null;

  const getStyleByType = () => {
    switch (type) {
      case 'success':
        return {
          color: '#22C55E',
          icon: 'check-circle',
          isSuccess: true,
        };
      case 'error':
        return {
          color: '#FF4444',
          icon: 'alert-circle',
          isSuccess: false,
        };
      case 'warning':
        return {
          color: '#FF9800',
          icon: 'alert',
          isSuccess: false,
        };
      case 'confirm':
        return {
          color: '#3B82F6',
          icon: 'alert-circle',
          isSuccess: false,
        };
      default: // info
        return {
          color: '#3B82F6',
          icon: 'information',
          isSuccess: false,
        };
    }
  };

  const { color, icon, isSuccess } = getStyleByType();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Logo (maior para sucesso) */}
          <Image
            source={require('../../assets/logo.png')}
            style={[styles.logo, isSuccess && styles.logoSuccess]}
            resizeMode="contain"
          />

          {isSuccess ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons
                name={icon}
                size={30}
                color={color}
                style={styles.iconSide}
              />
              <Text style={[styles.modalTitle, styles.successTitle]}>{title}</Text>
            </View>
          ) : (
            <>
              <MaterialCommunityIcons
                name={icon}
                size={60}
                color={color}
                style={styles.icon}
              />
              <Text style={styles.modalTitle}>{title}</Text>
            </>
          )}

          {message ? (
            <Text style={styles.modalText}>{message}</Text>
          ) : null}

          {type === 'confirm' ? (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: color }]}
                onPress={onConfirm}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>{confirmButtonText}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: color }]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmButtonText}</Text>
              )}
            </TouchableOpacity>
          )}
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
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    ...Platform.select({
      web: {
        maxWidth: 400,
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: 20,
  },
  logoSuccess: {
    width: 140,
    height: 56,
  },
  icon: {
    marginBottom: 15,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconSide: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  successTitle: {
    marginBottom: 0,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  confirmButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    flex: 1,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AMPAlertModal;
