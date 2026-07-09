// components/Header/Header.js
import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

/**
 * Header fixo padrão do app.
 *
 * Uso básico:
 *   <Header
 *     onLeftIconPress={() => navigation.navigate('Notifications')}
 *     onRightIconPress={() => navigation.navigate('Profile')}
 *     notificationCount={unreadCount}
 *     avatarUri={loggedUser?.avatar_url}
 *   />
 */
const Header = ({
  logoSource = require('../../assets/logo.png'),
  onLeftIconPress,
  onRightIconPress,
  leftIcon,
  rightIcon,
  notificationCount = 0,
  avatarUri,
  showIcons = true,
  style
}) => {
  return (
    <View style={[styles.header, style]}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />

      {showIcons && (
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLeftIconPress}
            activeOpacity={0.7}
          >
            {leftIcon || (
              <Ionicons name="notifications-outline" size={26} color="#2C2C2C" />
            )}
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            {rightIcon || (
              <View style={styles.avatarPlaceholder}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <FontAwesome5 name="user-alt" size={16} color="#FFCF00" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
    backgroundColor: '#fff'
  },
  logo: {
    width: 100,
    height: 50
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    marginLeft: 18,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#D32F2F',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold'
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17
  }
});

export default React.memo(Header);