import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import sharedStyles from './SharedStyles';

// Dropdown customizado, no mesmo padrão usado no VehicleRegistrationScreen
const CustomDropdown = ({ label, items, selectedValue, onSelect, isOpen, setIsOpen }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (Platform.OS === 'web' && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      if (Platform.OS === 'web') {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [setIsOpen]);

  const displayLabel = items.find((item) => item.value === selectedValue)?.label || selectedValue;

  return (
    <View style={[sharedStyles.inputGroup, isOpen && sharedStyles.inputGroupOpen]} ref={dropdownRef}>
      <Text style={sharedStyles.label}>{label}</Text>
      <View style={[styles.customPickerContainer, isOpen && styles.customPickerContainerOpen]}>
        <TouchableOpacity
          style={styles.customPickerButton}
          activeOpacity={0.7}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.customPickerText}>{displayLabel}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
        </TouchableOpacity>
        {isOpen &&
          Platform.select({
            web: (
              <div
                style={{
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #E0E0E0',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000000,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {items.map((item, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item.value);
                      setIsOpen(false);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      backgroundColor: selectedValue === item.value ? '#F5F5F5' : '#ffffff',
                      padding: '12px 16px',
                      borderBottom: index < items.length - 1 ? '1px solid #F0F0F0' : 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#333',
                      userSelect: 'none',
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            ),
            default: (
              <View style={[styles.dropdownList, { overflow: 'hidden' }]}>
                <ScrollView
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingVertical: 4 }}
                >
                  {items.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        selectedValue === item.value && styles.selectedDropdownItem,
                        index === items.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => {
                        onSelect(item.value);
                        setIsOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedValue === item.value && styles.selectedDropdownItemText,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ),
          })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  customPickerContainer: {
    position: 'relative',
  },
  customPickerContainerOpen: {
    zIndex: 10000,
  },
  customPickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customPickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 220,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownItemText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
});

export default CustomDropdown;