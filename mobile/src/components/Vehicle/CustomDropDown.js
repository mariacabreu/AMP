import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './VehicleFormStyles';

const CustomDropdown = ({ label, items, selectedValue, onSelect, placeholder, enabled = true, onOpen, isOpen, setIsOpen }) => {
  const dropdownRef = useRef(null);

  const displayLabel = items.find(item => {
    const itemValue = typeof item === 'object' ? item.value : item;
    return itemValue === selectedValue;
  })?.label || selectedValue || placeholder;

  return (
    <View style={[styles.inputContainer, isOpen && styles.inputContainerOpen]} ref={dropdownRef}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.customPickerContainer, !enabled && styles.disabledPicker, isOpen && styles.customPickerContainerOpen]}>
        <TouchableOpacity
          style={styles.customPickerButton}
          activeOpacity={0.7}
          onPress={() => {
            if (enabled) {
              if (onOpen) onOpen();
              setIsOpen(!isOpen);
            }
          }}
          disabled={!enabled}
        >
          <Text style={[styles.customPickerText, !selectedValue && styles.placeholderText]}>
            {displayLabel}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        {isOpen && Platform.select({
          web: (
            <div style={{
              position: 'absolute',
              top: 52,
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              maxHeight: 200,
              overflowY: 'auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              zIndex: 1000000
            }}>
              {items.map((item, index) => {
                const itemValue = typeof item === 'object' ? item.value : item;
                const itemLabel = typeof item === 'object' ? item.label : item;
                return (
                  <div
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect(itemValue);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      backgroundColor: selectedValue === itemValue ? '#F5F5F5' : '#ffffff',
                      padding: '12px 16px',
                      borderBottom: '1px solid #F0F0F0',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#333',
                      userSelect: 'none'
                    }}
                  >
                    {itemLabel}
                  </div>
                );
              })}
            </div>
          ),
          default: (
            <View style={styles.dropdownList}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {items.map((item, index) => {
                  const itemValue = typeof item === 'object' ? item.value : item;
                  const itemLabel = typeof item === 'object' ? item.label : item;
                  return (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        selectedValue === itemValue && styles.selectedDropdownItem,
                        pressed && { backgroundColor: '#F0F0F0' }
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onSelect(itemValue);
                        setIsOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedValue === itemValue && styles.selectedDropdownItemText
                      ]}>
                        {itemLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )
        })}
      </View>
    </View>
  );
};

export default CustomDropdown;