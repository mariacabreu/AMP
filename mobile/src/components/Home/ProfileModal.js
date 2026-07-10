import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Pressable } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// Limites de veículos por tipo de plano
const PLAN_LIMITS = {
  monthly: { label: 'Plano Mensal', maxVehicles: 1 },
  quarterly: { label: 'Plano Trimestral', maxVehicles: 3 },
  annual: { label: 'Plano Anual', maxVehicles: 5 }
};

const getPlanInfo = (planType) => {
  return PLAN_LIMITS[planType] || { label: 'Plano Premium', maxVehicles: 1 };
};

const ProfileModal = ({
  visible,
  onClose,
  profileForm,
  onChangeField,
  avatarUri,
  onChangePhoto,
  onSave,
  saving,
  onLogout,
  isPremium = false,
  planType,
  vehicleCount = 0,
  onAddVehicle
}) => {
  const planInfo = getPlanInfo(planType);
  const reachedLimit = vehicleCount >= planInfo.maxVehicles;

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

              <View style={[styles.planBadge, isPremium ? styles.planBadgePremium : styles.planBadgeFree]}>
                {isPremium ? (
                  <View style={styles.crownIconWrap}>
                    <MaterialCommunityIcons
                      name="crown"
                      size={19}
                      color="#000000"
                      style={styles.crownIconBorder}
                    />
                    <MaterialCommunityIcons
                      name="crown"
                      size={16}
                      color="#FFCF00"
                      style={styles.crownIconFront}
                    />
                  </View>
                ) : (
                  <Ionicons name="person" size={16} color="#999" style={styles.planBadgeIconFree} />
                )}
                <Text style={[styles.planBadgeText, isPremium ? styles.planBadgeTextPremium : styles.planBadgeTextFree]}>
                  {isPremium ? planInfo.label.toUpperCase() : 'PLANO FREE'}
                </Text>
              </View>
            </View>

            {isPremium && (
              <View style={styles.vehicleLimitCard}>
                <View style={styles.vehicleLimitInfo}>
                  <MaterialCommunityIcons name="car-multiple" size={22} color="#1A1A1A" />
                  <View style={styles.vehicleLimitTextWrap}>
                    <Text style={styles.vehicleLimitTitle}>Veículos cadastrados</Text>
                    <Text style={styles.vehicleLimitCount}>
                      {vehicleCount} de {planInfo.maxVehicles} disponíveis
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.addVehicleButton, reachedLimit && styles.addVehicleButtonDisabled]}
                  onPress={onAddVehicle}
                  disabled={reachedLimit}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={reachedLimit ? '#999' : '#FFCF00'}
                  />
                  <Text style={[styles.addVehicleButtonText, reachedLimit && styles.addVehicleButtonTextDisabled]}>
                    {reachedLimit ? 'Limite atingido' : 'Adicionar veículo'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
    marginBottom: 16
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
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  planBadgePremium: {
    backgroundColor: '#EDEDED'
  },
  planBadgeFree: {
    backgroundColor: '#EDEDED'
  },
  crownIconWrap: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  crownIconBorder: {
    position: 'absolute'
  },
  crownIconFront: {
    position: 'absolute'
  },
  planBadgeIconFree: {
    marginRight: 6
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  planBadgeTextPremium: {
    color: '#1A1A1A'
  },
  planBadgeTextFree: {
    color: '#666'
  },
  vehicleLimitCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 14,
    padding: 14,
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
  addVehicleButtonTextDisabled: {
    color: '#999'
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