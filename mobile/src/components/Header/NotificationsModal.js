import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock usado apenas como fallback caso nenhuma notificação real seja passada
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Bem-vindo(a) ao AMP!',
    description: 'Assine o plano premium para obter todas as funcionalidades do AMP.',
    time: 'Agora mesmo',
    read: false
  }
];

const NotificationsModal = ({
  visible,
  onClose,
  notifications,
  unreadCount,
  onMarkAllAsRead
}) => {
  // Usa as notificações reais se existirem; caso contrário, usa os mocks
  const effectiveNotifications =
    notifications?.length > 0
      ? notifications
      : MOCK_NOTIFICATIONS;

  const effectiveUnreadCount =
    unreadCount ??
    effectiveNotifications.filter((n) => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.notificationModalCard}
          onPress={() => {}}
        >
          <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Notificações</Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={26}
                color="#000000"
              />
            </TouchableOpacity>
          </View>

          {effectiveUnreadCount > 0 && (
            <TouchableOpacity
              onPress={onMarkAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllButtonText}>
                Marcar todas como lidas
              </Text>
            </TouchableOpacity>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {effectiveNotifications.length === 0 ? (
              <Text style={styles.emptyNotificationsText}>
                Nenhuma notificação por aqui.
              </Text>
            ) : (
              effectiveNotifications.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.notificationItem,
                    !item.read &&
                      styles.notificationItemUnread
                  ]}
                >
                  <View style={styles.notificationDot}>
                    {!item.read && (
                      <View
                        style={
                          styles.notificationDotActive
                        }
                      />
                    )}
                  </View>

                  <View style={styles.notificationTextWrap}>
                    <Text
                      style={
                        styles.notificationItemTitle
                      }
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={
                        styles.notificationItemDescription
                      }
                    >
                      {item.description}
                    </Text>

                    <Text
                      style={
                        styles.notificationItemTime
                      }
                    >
                      {item.time}
                    </Text>
                  </View>
                </View>
              ))
            )}
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
  notificationModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '80%'
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginBottom: 12
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textDecorationLine: 'underline'
  },
  emptyNotificationsText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 13,
    marginTop: 30
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  notificationItemUnread: {
    backgroundColor: '#FFFCEB'
  },
  notificationDot: {
    width: 18,
    alignItems: 'center',
    paddingTop: 4
  },
  notificationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCF00'
  },
  notificationTextWrap: {
    flex: 1,
    marginLeft: 6
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4
  },
  notificationItemDescription: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
    marginBottom: 4
  },
  notificationItemTime: {
    fontSize: 11,
    color: '#999999'
  }
});

export default React.memo(NotificationsModal);