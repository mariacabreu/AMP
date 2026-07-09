import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const navItems = [
  { name: 'Home', icon: 'home', iconType: 'Ionicons', route: 'Home' },
  { name: 'Financeiro', icon: 'currency-usd', iconType: 'MaterialCommunityIcons', route: 'Report' }, // cifrão ($)
  { name: 'Peças', icon: 'wrench', iconType: 'MaterialCommunityIcons', route: 'PartsCatalog' }, // chave inglesa
  { name: 'Checklist', icon: 'clipboard-check-outline', iconType: 'MaterialCommunityIcons', route: 'Checklist' },
  { name: 'Config', icon: 'settings-sharp', iconType: 'Ionicons', route: 'Settings' }
];

const BottomNav = ({ navigation, user, activeScreen = 'Home' }) => {
  const insets = useSafeAreaInsets();

  const renderIcon = (item, isActive) => {
    const color = isActive ? '#FFCF00' : '#D9D9D9';
    const size = 24;

    switch (item.iconType) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={item.icon} size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {navItems.map((item) => {
        const isActive = item.name === activeScreen;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            accessibilityState={{ selected: isActive }}
            onPress={() => navigation.navigate(item.route, { user })}
          >
            {isActive && <View style={styles.activeDot} />}
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
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A'
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    paddingVertical: 4
  },
  activeDot: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFCF00'
  },
  navText: {
    color: '#D9D9D9',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2
  },
  navTextActive: {
    color: '#FFCF00'
  }
});

export default React.memo(BottomNav);