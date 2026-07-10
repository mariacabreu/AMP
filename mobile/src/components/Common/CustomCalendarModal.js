import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Mini calendário customizado, funciona igual em web e mobile.
 * Extraído originalmente do ReportFormScreen (tela de adicionar custo de combustível).
 *
 * Props:
 * - visible: boolean, controla se o modal está aberto
 * - selectedDate: Date | null, a data atualmente selecionada
 * - onSelect: (date: Date) => void, chamado quando o usuário toca em um dia
 * - onClose: () => void, chamado ao fechar o modal (botão Cancelar ou toque fora)
 */
const CustomCalendarModal = ({ visible, selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (visible) {
      setViewDate(selectedDate || new Date());
    }
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const goToPreviousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const daysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }
    return grid;
  }, [year, month]);

  const isSelectedDay = (day) => {
    if (!selectedDate || !day) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    onSelect(new Date(year, month, day));
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.calendarModalContent}>
          {/* Cabeçalho com navegação de mês */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthLabel}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-forward" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Cabeçalho dos dias da semana */}
          <View style={styles.calendarWeekRow}>
            {WEEKDAY_LABELS.map((label, idx) => (
              <View key={idx} style={styles.calendarWeekdayCell}>
                <Text style={styles.calendarWeekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Grade de dias */}
          <View style={styles.calendarDaysGrid}>
            {daysGrid.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.calendarDayCell}
                onPress={() => handleSelectDay(day)}
                disabled={!day}
                activeOpacity={0.7}
              >
                {day && (
                  <View style={[
                    styles.calendarDayCircle,
                    isSelectedDay(day) && styles.calendarDaySelected,
                    !isSelectedDay(day) && isToday(day) && styles.calendarDayToday
                  ]}>
                    <Text style={[
                      styles.calendarDayText,
                      isSelectedDay(day) && styles.calendarDayTextSelected
                    ]}>
                      {day}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.calendarCloseButton} onPress={onClose}>
            <Text style={styles.calendarCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 340,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textTransform: 'capitalize',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#FFCF00',
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#FFCF00',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  calendarCloseButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  calendarCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

export default CustomCalendarModal;