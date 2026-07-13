import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import NotificationsModal from './NotificationsModal';
import ProfileModal from './ProfileModal';

/**
 * Header fixo padrão do app.
 *
 * Por padrão, tocar no sino abre o NotificationsModal e tocar no avatar
 * abre o ProfileModal — ambos renderizados aqui dentro. Se quiser navegar
 * para uma tela em vez de abrir o modal, passe onLeftIconPress/onRightIconPress.
 */
const Header = ({
  logoSource = require('../../assets/logo.png'),
  onLeftIconPress,
  onRightIconPress,
  leftIcon,
  rightIcon,
  notifications,
  notificationCount = 0,
  onMarkAllAsRead,
  avatarUri,
  profileForm = { full_name: '', email: '', phone: '' },
  onChangeField,
  onChangePhoto,
  onSaveProfile,
  savingProfile,
  onLogout,
  isPremium = false,
  planType,
  vehicle = null, // Single vehicle
  showIcons = true,
  style,
  navigation,
  loggedUser
}) => {
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  const handleLeftIconPress = () => {
    if (onLeftIconPress) {
      onLeftIconPress();
      return;
    }
    setNotificationsVisible(true);
  };

  const handleRightIconPress = () => {
    if (onRightIconPress) {
      onRightIconPress();
      return;
    }
    setProfileVisible(true);
  };

  return (
    <View style={[styles.header, showIcons ? styles.headerWithIcons : styles.headerWithoutIcons, style]}>
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        unreadCount={notificationCount}
        onMarkAllAsRead={onMarkAllAsRead}
      />
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        profileForm={profileForm}
        onChangeField={onChangeField}
        avatarUri={avatarUri}
        onChangePhoto={onChangePhoto}
        onSave={onSaveProfile}
        saving={savingProfile}
        onLogout={onLogout}
        isPremium={isPremium}
        planType={planType}
        vehicle={vehicle}
        navigation={navigation}
        loggedUser={loggedUser}
      />

      <Image source={logoSource} style={styles.logo} resizeMode="contain" />

      {showIcons && (
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLeftIconPress}
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
            onPress={handleRightIconPress}
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
  headerWithIcons: {
    justifyContent: 'space-between'
  },
  headerWithoutIcons: {
    justifyContent: 'center'
  },
  logo: {
  width: 120,
  height: 60,
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