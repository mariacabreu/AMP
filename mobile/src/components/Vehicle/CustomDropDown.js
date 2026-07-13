import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './VehicleFormStyles';

const MAX_LIST_HEIGHT = 220;

const CustomDropdown = ({
  label,
  items,
  selectedValue,
  onSelect,
  placeholder,
  enabled = true,
  onOpen,
  isOpen,
  setIsOpen,
}) => {
  const buttonRef = useRef(null);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const displayLabel =
    items.find(item => {
      const itemValue = typeof item === 'object' ? item.value : item;
      return itemValue === selectedValue;
    })?.label || selectedValue || placeholder;

  const handleOpen = () => {
    if (!enabled) return;
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setLayout({ x, y, width, height });
        if (onOpen) onOpen();
        setIsOpen(true);
      });
    }
  };

  const screenHeight = Dimensions.get('window').height;
  const spaceBelow = screenHeight - (layout.y + layout.height);
  const openUpwards = spaceBelow < MAX_LIST_HEIGHT && layout.y > MAX_LIST_HEIGHT;

  const renderItems = () =>
    items.map((item, index) => {
      const itemValue = typeof item === 'object' ? item.value : item;
      const itemLabel = typeof item === 'object' ? item.label : item;
      return { key: index.toString(), itemValue, itemLabel };
    });

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.customPickerContainer, !enabled && styles.disabledPicker]}>
        <TouchableOpacity
          ref={buttonRef}
          style={styles.customPickerButton}
          activeOpacity={0.7}
          onPress={() => (isOpen ? setIsOpen(false) : handleOpen())}
          disabled={!enabled}
        >
          <Text style={[styles.customPickerText, !selectedValue && styles.placeholderText]}>
            {displayLabel}
          </Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' ? (
        isOpen && (
          <div
            style={{
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
              zIndex: 1000000,
            }}
          >
            {renderItems().map(({ key, itemValue, itemLabel }) => (
              <div
                key={key}
                onMouseDown={e => {
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
                  userSelect: 'none',
                }}
              >
                {itemLabel}
              </div>
            ))}
          </div>
        )
      ) : (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)}>
            <View
              style={{
                position: 'absolute',
                top: openUpwards ? layout.y - MAX_LIST_HEIGHT - 4 : layout.y + layout.height + 4,
                left: layout.x,
                width: layout.width,
                maxHeight: MAX_LIST_HEIGHT,
                backgroundColor: '#ffffff',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E0E0E0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
                overflow: 'hidden',
              }}
            >
              <FlatList
                data={renderItems()}
                keyExtractor={item => item.key}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      selectedValue === item.itemValue && styles.selectedDropdownItem,
                      pressed && { backgroundColor: '#F0F0F0' },
                    ]}
                    onPress={() => {
                      onSelect(item.itemValue);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedValue === item.itemValue && styles.selectedDropdownItemText,
                      ]}
                    >
                      {item.itemLabel}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

export default CustomDropdown;