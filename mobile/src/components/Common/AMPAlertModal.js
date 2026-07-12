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
 * - type: 'success' | 'error' | 'info' | 'warning'
 * - title: string
 * - message: string
 * - buttonText: string (default 'Ok')
 * - onClose: function
 * - isLoading: boolean (optional, for actions like saving)
 */
const AMPAlertModal = ({
  visible,
  type = 'info',
  title,
  message,
  buttonText = 'Ok',
  onClose,
  isLoading = false,
}) => {
  if (!visible) return null;

  // Determine the color and icon based on type
  const getStyleByType = () => {
    switch (type) {
      case 'success':
        return {
          color: '#22C55E',
          icon: 'check-circle',
        };
      case 'error':
        return {
          color: '#FF4444',
          icon: 'alert-circle',
        };
      case 'warning':
        return {
          color: '#FF9800',
          icon: 'alert',
        };
      default: // info
        return {
          color: '#3B82F6',
          icon: 'information',
        };
    }
  };

  const { color, icon } = getStyleByType();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Logo */}
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Icon */}
          <MaterialCommunityIcons
            name={icon}
            size={60}
            color={color}
            style={styles.icon}
          />

          {/* Title */}
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Message */}
          {message ? (
            <Text style={styles.modalText}>{message}</Text>
          ) : null}

          {/* Button */}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: color }]}
            onPress={onClose}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>{buttonText}</Text>
            )}
          </TouchableOpacity>
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
  icon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  confirmButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AMPAlertModal;
