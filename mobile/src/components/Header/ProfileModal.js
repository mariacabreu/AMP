import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPlanInfo, canAddVehicle, getVehicleLimitLabel } from '../../utils/planLimits';

const ProfileModal = ({
  visible,
  onClose,
  profileForm = { full_name: '', email: '', phone: '' },
  onChangeField,
  avatarUri,
  onChangePhoto,
  onSave,
  saving,
  onLogout,
  isPremium = false,
  planType,
  vehicle = null, // Single vehicle instead of list
  navigation,
  loggedUser
}) => {
  const planInfo = getPlanInfo(planType);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.profileModalCard} onPress={() => {}}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Meu perfil</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.planBadgeWrap}>
            <TouchableOpacity 
              style={[styles.planBadge, isPremium ? styles.planBadgePremium : styles.planBadgeFree]}
              onPress={() => {
                onClose();
                navigation.navigate('PremiumPlan', { user: loggedUser });
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="crown"
                size={16}
                color="#FFCF00"
                style={styles.planBadgeIcon}
              />
              <Text style={[styles.planBadgeText, isPremium ? styles.planBadgeTextPremium : styles.planBadgeTextFree]}>
                {planInfo.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarLarge}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarLargeImage} />
                ) : (
                  <FontAwesome5 name="user-alt" size={36} color="#FFCF00" />
                )}
              </View>
              <TouchableOpacity style={styles.changePhotoButton} onPress={onChangePhoto}>
                <Ionicons name="camera-outline" size={16} color="#000000" />
                <Text style={styles.changePhotoText}>Alterar foto</Text>
              </TouchableOpacity>
            </View>

            {/*
              Card de veículo: mostra apenas o veículo cadastrado na conta
            */}
            <View style={styles.vehicleLimitCard}>
              {vehicle ? (
                <View style={styles.vehicleCard}>
                  <View style={styles.vehicleIconContainer}>
                    <MaterialCommunityIcons
                      name="car-sports"
                      size={24}
                      color="#FFCF00"
                    />
                  </View>

                  <Text style={styles.vehicleName}>
                    {vehicle.brand
                      ? `${vehicle.brand} ${vehicle.model || ''}`.trim()
                      : vehicle.model || 'Veículo'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noVehicleText}>
                  Nenhum veículo cadastrado
                </Text>
              )}
            </View>

            <Text style={styles.inputLabel}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={profileForm.full_name}
              onChangeText={(text) => onChangeField('full_name', text)}
              placeholder="Seu nome completo"
            />

            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={profileForm.email}
              onChangeText={(text) => onChangeField('email', text)}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={profileForm.phone}
              onChangeText={(text) => onChangeField('phone', text)}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
              <Text style={styles.logoutButtonText}>Sair da conta</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 12
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000'
  },
  profileModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%'
  },
  planBadgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4
      }
    })
  },
  planBadgePremium: {
    backgroundColor: '#1A1A1A'
  },
  planBadgeFree: {
    backgroundColor: '#EDEDED'
  },
  planBadgeIcon: {
    marginRight: 8
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  planBadgeTextPremium: {
    color: '#FFCF00'
  },
  planBadgeTextFree: {
    color: '#666'
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarLargeImage: {
    width: 90,
    height: 90,
    borderRadius: 45
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6
  },
  vehicleLimitCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20
  },
  vehicleLimitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  vehicleLimitTextWrap: {
    marginLeft: 10
  },
  vehicleLimitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000'
  },
  vehicleLimitCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },

  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },

  vehicleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000'
  },
    addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10
  },
  addVehicleButtonDisabled: {
    backgroundColor: '#E0E0E0'
  },
  addVehicleButtonText: {
    color: '#FFCF00',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6
  },
  noVehicleText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
    marginTop: 14
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FAFAFA'
  },
  saveButton: {
    backgroundColor: '#FFCF00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  }
});

export default React.memo(ProfileModal);