import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/BottomNav';

const ReportScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Mês'); // 'Mês' ou 'Ano'
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isDeletingMode, setIsDeletingMode] = useState(false);
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
    
    if (filterType === 'Mês') {
      const data = new Array(12).fill(0);
      realHistory.forEach(item => {
        if (item.last_date) {
          let day, month, year;
          
          if (item.last_date.includes('/')) {
            const parts = item.last_date.split('/');
            day = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
            year = parseInt(parts[2]);
          } else if (item.last_date.includes('-')) {
            const parts = item.last_date.split('-');
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
            day = parseInt(parts[2]);
          }
          
          if (year === currentYear && month >= 0 && month < 12) {
            data[month] += item.cost || 0;
          }
        }
      });
      const maxCost = Math.max(...data, 1);
      return {
        values: data.map(val => val / maxCost),
        labels: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
      };
    } else {
      // Filtro por Ano: últimos 12 anos
      const data = new Array(12).fill(0);
      const labels = [];
      for (let i = 11; i >= 0; i--) {
        labels.push((currentYear - i).toString());
      }
      
      realHistory.forEach(item => {
        if (item.last_date) {
          let year;
          
          if (item.last_date.includes('/')) {
            const parts = item.last_date.split('/');
            year = parseInt(parts[2]);
          } else if (item.last_date.includes('-')) {
            const parts = item.last_date.split('-');
            year = parseInt(parts[0]);
          }
          
          const labelIdx = labels.indexOf(year.toString());
          if (labelIdx !== -1) {
            data[labelIdx] += item.cost || 0;
          }
        }
      });
      const maxCost = Math.max(...data, 1);
      return {
        values: data.map(val => val / maxCost),
        labels: labels.map(l => l.substring(2)) // Mostra apenas os últimos 2 dígitos (ex: '24')
      };
    }
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
  const currentMonthYear = filterType === 'Mês' 
    ? new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
    : `ÚLTIMOS 12 ANOS (${new Date().getFullYear() - 11} - ${new Date().getFullYear()})`;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFCF00" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/mow376om-iempala.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/mow376om-wu018h0.png')} style={styles.topIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../assets/mow376om-4s6plsc.png')} style={styles.topIcon} />
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

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <TouchableOpacity 
              style={filterType === 'Mês' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setFilterType('Mês')}
            >
              <Text style={filterType === 'Mês' ? styles.chartTabTextActive : styles.chartTabText}>Mês</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={filterType === 'Ano' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setFilterType('Ano')}
            >
              <Text style={filterType === 'Ano' ? styles.chartTabTextActive : styles.chartTabText}>Ano</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            {chartData.values.map((val, idx) => (
              <View key={idx} style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { height: Math.max(val * 100, 2) }]} />
                <Text style={styles.chartLabel}>{chartData.labels[idx]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartFooter}>
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
            <View key={item.id} style={styles.costCard}>
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
                {item.liters && item.liters > 0 && (
                  <Text style={styles.costDetail}>🛢️ {item.liters.toFixed(1)} L a R$ {(item.cost / item.liters).toFixed(2)}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.costValue}>R$ {item.cost.toFixed(2)}</Text>
                {isEditingMode && (
                  <TouchableOpacity 
                    style={styles.editItemButton}
                    onPress={() => navigation.navigate('ReportForm', { 
                      user: loggedUser, 
                      vehicleId: reportData.vehicle_id,
                      editItem: item 
                    })}
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
            </View>
          ))
        )}

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={30} color="#FFCF00" />
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Financeiro" />
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
  logo: {
    width: 100,
    height: 50,
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
  chartContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  chartHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  chartTabActive: {
    backgroundColor: '#BDBDBD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 10,
  },
  chartTabTextActive: {
    fontSize: 10,
    color: '#000',
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chartTabText: {
    fontSize: 10,
    color: '#666',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 20,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 8,
    backgroundColor: '#2b2b2b',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 8,
    marginTop: 5,
    color: '#000',
  },
  chartFooter: {
    backgroundColor: '#BDBDBD',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  chartFooterText: {
    fontSize: 8,
    color: '#000',
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
    position: 'absolute',
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
});

export default ReportScreen;
