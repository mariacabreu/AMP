
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const BottomNav = ({ navigation, user, activeScreen = 'Home' }) => {
  const navItems = [
    { name: 'Home', icon: 'home', iconType: 'Ionicons', route: 'Home' },
    { name: 'Financeiro', icon: 'cash-multiple', iconType: 'MaterialCommunityIcons', route: 'Report' },
    { name: 'Peças', icon: 'car-part', iconType: 'MaterialCommunityIcons', route: 'PartsCatalog' },
    { name: 'Checklist', icon: 'clipboard-check-outline', iconType: 'MaterialCommunityIcons', route: 'Checklist' },
    { name: 'Config', icon: 'settings-sharp', iconType: 'Ionicons', route: 'Settings' }
  ];

  const renderIcon = (item, isActive) => {
    const color = isActive ? '#FFCF00' : '#D9D9D9';
    const size = item.iconType === 'FontAwesome5' ? 24 : 24;
    
    switch (item.iconType) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={item.icon} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={item.icon} size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.navBar}>
      {navItems.map((item) => {
        const isActive = item.name === activeScreen;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.route, { user })}
          >
            {renderIcon(item, isActive)}
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#2C2C2C',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
    zIndex: 1000
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  navText: {
    color: '#D9D9D9',
    fontSize: 10,
    fontWeight: '800'
  },
  navTextActive: {
    color: '#FFCF00'
  }
});

export default BottomNav;
