import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';

const ReportScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Mês'); // 'Mês' ou 'Ano'
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isDeletingMode, setIsDeletingMode] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [reportData, setReportData] = useState({
    user_name: '',
    history: [],
    vehicle_id: null
  });

  const fetchReport = async () => {
    try {
      const userId = loggedUser?.id || 1;
      const response = await axios.get(`${API_BASE_URL}/user/report/${userId}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/vehicle/maintenance/${itemId}`);
      fetchReport(); // Atualiza a lista após deletar
    } catch (error) {
      console.error('Erro ao deletar item:', error.response?.data || error.message);
      alert('Não foi possível excluir o item.');
    }
  };

  // Roteia para a tela de edição correta dependendo do tipo do item
  const handleEditItem = (item) => {
    const isGasoline = item.item.includes('Gasolina');
    if (isGasoline) {
      navigation.navigate('ReportForm', {
        user: loggedUser,
        vehicleId: reportData.vehicle_id,
        editItem: item
      });
    } else {
      navigation.navigate('MaintenanceEdit', {
        user: loggedUser,
        editItem: item
      });
    }
  };

  const openDetailModal = (item) => {
    setSelectedDetailItem(item);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedDetailItem(null);
  };

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [])
  );

  // Filtra o histórico para remover itens com custo zero (mocks do cadastro inicial)
  const realHistory = reportData.history
    .filter(item => item.cost > 0)
    .map((item, index) => ({
      id: item.id || index,
      item: item.item,
      last_date: item.last_date,
      cost: item.cost,
      liters: item.liters
    }));

  // Processa dados para o gráfico
  const getChartData = () => {
    const currentYear = new Date().getFullYear();
    let data, labels;

    if (filterType === 'Mês') {
      data = new Array(12).fill(0);
      labels = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

      realHistory.forEach(item => {
        if (item.last_date) {
          let month, year;
          if (item.last_date.includes('/')) {
            const parts = item.last_date.split('/');
            month = parseInt(parts[1]) - 1;
            year = parseInt(parts[2]);
          } else if (item.last_date.includes('-')) {
            const parts = item.last_date.split('-');
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
          }
          if (year === currentYear && month >= 0 && month < 12) {
            data[month] += item.cost || 0;
          }
        }
      });
    } else {
      data = new Array(12).fill(0);
      const yearLabels = [];
      for (let i = 11; i >= 0; i--) yearLabels.push((currentYear - i).toString());
      labels = yearLabels.map(l => l.substring(2));

      realHistory.forEach(item => {
        if (item.last_date) {
          let year;
          if (item.last_date.includes('/')) year = parseInt(item.last_date.split('/')[2]);
          else if (item.last_date.includes('-')) year = parseInt(item.last_date.split('-')[0]);
          const idx = yearLabels.indexOf(String(year));
          if (idx !== -1) data[idx] += item.cost || 0;
        }
      });
    }

    const maxCost = Math.max(...data, 1);
    const maxValue = Math.max(...data);
    const maxIndex = data.indexOf(maxValue);
    const total = data.reduce((sum, v) => sum + v, 0);

    return {
      values: data.map(val => val / maxCost),
      rawValues: data,
      labels,
      maxIndex,
      total
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';

    if (dateStr.includes('/')) {
      return dateStr;
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    return dateStr;
  };

  const chartData = getChartData();
  const periodTotal = chartData.total.toFixed(2).replace('.', ',');
  const currentMonthYear = filterType === 'Mês'
    ? new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
    : `ÚLTIMOS 12 ANOS (${new Date().getFullYear() - 11} - ${new Date().getFullYear()})`;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFCF00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/logo.png')} style={styles.topIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Text style={styles.screenTitle}>CONTROLE DE CUSTOS</Text>

        {/* Chart Section - visual melhorado */}
        <View style={styles.chartContainer}>
          <View style={styles.chartTopRow}>
            <View>
              <Text style={styles.chartTotalLabel}>TOTAL NO PERÍODO</Text>
              <Text style={styles.chartTotalValue}>R$ {periodTotal}</Text>
            </View>
            <View style={styles.chartToggle}>
              <TouchableOpacity
                style={filterType === 'Mês' ? styles.chartTabActive : styles.chartTab}
                onPress={() => setFilterType('Mês')}
                activeOpacity={0.8}
              >
                <Text style={filterType === 'Mês' ? styles.chartTabTextActive : styles.chartTabText}>Mês</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={filterType === 'Ano' ? styles.chartTabActive : styles.chartTab}
                onPress={() => setFilterType('Ano')}
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
                        isHighlighted && styles.chartBarHighlight
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

        {/* History Header */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>HISTÓRICO DE CUSTOS</Text>
          <View style={styles.historyActions}>
            <TouchableOpacity onPress={() => navigation.navigate('ReportForm', { user: loggedUser, vehicleId: reportData.vehicle_id })}>
              <MaterialIcons name="add-circle" size={32} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => {
                setIsEditingMode(!isEditingMode);
                if (isDeletingMode) setIsDeletingMode(false);
              }}
            >
              <MaterialCommunityIcons
                 name={isEditingMode ? "check-circle" : "square-edit-outline"}
                 size={28}
                 color={isEditingMode ? "#FFCF00" : "#000000"}
               />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => {
                setIsDeletingMode(!isDeletingMode);
                if (isEditingMode) setIsEditingMode(false);
              }}
            >
              <MaterialCommunityIcons
                 name={isDeletingMode ? "check-circle" : "trash-can-outline"}
                 size={28}
                 color={isDeletingMode ? "#FFCF00" : "#000000"}
               />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cost Items List */}
        {realHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="database-off" size={50} color="#D9D9D9" />
            <Text style={styles.emptyStateText}>Nenhum registro encontrado.</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('ReportForm', { user: loggedUser, vehicleId: reportData.vehicle_id })}
            >
              <Text style={styles.addFirstButtonText}>Adicionar primeiro custo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          realHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.costCard}
              activeOpacity={0.85}
              onPress={() => {
                if (isEditingMode) {
                  handleEditItem(item);
                } else if (!isDeletingMode) {
                  openDetailModal(item);
                }
              }}
            >
              <View style={styles.costIconContainer}>
                <MaterialCommunityIcons
                  name={item.item.includes('Gasolina') ? "gas-station" : "tools"}
                  size={35}
                  color="#1e1e1e"
                />
              </View>
              <View style={styles.costInfo}>
                <Text style={styles.costType}>{item.item}</Text>
                <Text style={styles.costDetail}>📅 {formatDate(item.last_date)}</Text>
                {item.liters > 0 && (
                  <Text style={styles.costDetail}>🛢️ {item.liters.toFixed(1)} L a R$ {(item.cost / item.liters).toFixed(2)}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.costValue}>R$ {item.cost.toFixed(2)}</Text>
                {isEditingMode && (
                  <TouchableOpacity
                    style={styles.editItemButton}
                    onPress={() => handleEditItem(item)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#FFCF00" />
                    <Text style={styles.editItemText}>EDITAR</Text>
                  </TouchableOpacity>
                )}
                {isDeletingMode && (
                  <TouchableOpacity
                    style={[styles.editItemButton, { backgroundColor: '#FF5252' }]}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <MaterialCommunityIcons name="trash-can" size={20} color="#FFF" />
                    <Text style={[styles.editItemText, { color: '#FFF' }]}>EXCLUIR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={30} color="#FFCF00" />
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />

      {/* Modal de Detalhes do Item (mesmo padrão do PartsCatalogScreen) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={closeDetailModal}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <TouchableOpacity style={styles.closeModalButton} onPress={closeDetailModal}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>

            {selectedDetailItem && (
              <View>
                <View style={styles.detailIconWrapper}>
                  <MaterialCommunityIcons
                    name={selectedDetailItem.item.includes('Gasolina') ? 'gas-station' : 'tools'}
                    size={40}
                    color="#2b2b2b"
                  />
                </View>
                <Text style={styles.modalPartName}>{selectedDetailItem.item}</Text>

                <View style={styles.detailSection}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>DATA</Text>
                    <Text style={styles.detailText}>{formatDate(selectedDetailItem.last_date)}</Text>
                  </View>

                  {selectedDetailItem.liters > 0 && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>LITROS ABASTECIDOS</Text>
                      <Text style={styles.detailText}>
                        {selectedDetailItem.liters.toFixed(1)} L a R$ {(selectedDetailItem.cost / selectedDetailItem.liters).toFixed(2)} /L
                      </Text>
                    </View>
                  )}

                  <View style={[styles.detailItem, { backgroundColor: '#FFF9E6' }]}>
                    <Text style={[styles.detailLabel, { color: '#B8860B' }]}>VALOR TOTAL</Text>
                    <Text style={[styles.detailText, { fontWeight: '800', fontSize: 22 }]}>
                      R$ {selectedDetailItem.cost.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
      default: {
        flex: 1,
      }
    })
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  logo: {
    width: 100,
    height: 50,
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  topIcon: {
    width: 30,
    height: 30,
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
      }
    })
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Espaço para não cobrir pela sidebar
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Gráfico visualmente melhorado: card branco com sombra, total em destaque, grid de referência
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costCard: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  costIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  costInfo: {
    flex: 1,
  },
  costType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  costDetail: {
    fontSize: 11,
    color: '#333',
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  editItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b2b2b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 5,
  },
  editItemText: {
    color: '#FFCF00',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#D9D9D9',
    fontSize: 16,
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#2b2b2b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFCF00',
    fontWeight: '600',
  },
  fab: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#FFCF00',
  },
  emptySpace: {
    height: 100,
  },
  // Modal de detalhes, mesmo padrão visual do PartsCatalogScreen
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 40,
    width: '100%',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  detailIconWrapper: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPartName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailSection: {
    marginTop: 5,
  },
  detailItem: {
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 15,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFCF00',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default ReportScreen;