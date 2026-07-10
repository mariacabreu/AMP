import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CostChart = ({ chartData, periodTotal, filterType, onChangeFilterType, currentMonthYear }) => {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartTopRow}>
        <View>
          <Text style={styles.chartTotalLabel}>TOTAL NO PERÍODO</Text>
          <Text style={styles.chartTotalValue}>R$ {periodTotal}</Text>
        </View>
        <View style={styles.chartToggle}>
          <TouchableOpacity
            style={filterType === 'Mês' ? styles.chartTabActive : styles.chartTab}
            onPress={() => onChangeFilterType('Mês')}
            activeOpacity={0.8}
          >
            <Text style={filterType === 'Mês' ? styles.chartTabTextActive : styles.chartTabText}>Mês</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={filterType === 'Ano' ? styles.chartTabActive : styles.chartTab}
            onPress={() => onChangeFilterType('Ano')}
            activeOpacity={0.8}
          >
            <Text style={filterType === 'Ano' ? styles.chartTabTextActive : styles.chartTabText}>Ano</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartGridArea}>
        <View style={[styles.chartGridLine, { bottom: 0 }]} />
        <View style={[styles.chartGridLine, { bottom: '50%' }]} />
        <View style={[styles.chartGridLine, { bottom: '100%' }]} />
        <View style={styles.chartPlaceholder}>
          {chartData.values.map((val, idx) => {
            const isHighlighted = idx === chartData.maxIndex && chartData.rawValues[idx] > 0;
            return (
              <View key={idx} style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    { height: Math.max(val * 90, 3) },
                    isHighlighted && styles.chartBarHighlight,
                  ]}
                />
                <Text style={[styles.chartLabel, isHighlighted && styles.chartLabelHighlight]}>
                  {chartData.labels[idx]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.chartFooter}>
        <MaterialCommunityIcons name="calendar-month-outline" size={12} color="#666" />
        <Text style={styles.chartFooterText}>{currentMonthYear}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  chartTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  chartTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 3,
  },
  chartTabActive: {
    backgroundColor: '#FFCF00',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartTabTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  chartTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  chartGridArea: {
    position: 'relative',
    height: 130,
    justifyContent: 'flex-end',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F2F2F2',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 8,
    backgroundColor: '#E2E2E2',
    borderRadius: 6,
  },
  chartBarHighlight: {
    backgroundColor: '#FFCF00',
  },
  chartLabel: {
    fontSize: 8,
    marginTop: 6,
    color: '#999',
    fontWeight: '600',
  },
  chartLabelHighlight: {
    color: '#000',
    fontWeight: '800',
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  chartFooterText: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default CostChart;