import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../../api';

const MONTH_LABELS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const formatDate = (dateStr) => {
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

const useReport = (loggedUser) => {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Mês'); // 'Mês' ou 'Ano'
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isDeletingMode, setIsDeletingMode] = useState(false);
  const [reportData, setReportData] = useState({
    user_name: '',
    history: [],
    vehicle_id: null,
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

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [])
  );

  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/vehicle/maintenance/${itemId}`);
      fetchReport(); // Atualiza a lista após deletar
    } catch (error) {
      console.error('Erro ao deletar item:', error.response?.data || error.message);
      alert('Não foi possível excluir o item.');
    }
  };

  const toggleEditingMode = () => {
    setIsEditingMode((prev) => !prev);
    if (isDeletingMode) setIsDeletingMode(false);
  };

  const toggleDeletingMode = () => {
    setIsDeletingMode((prev) => !prev);
    if (isEditingMode) setIsEditingMode(false);
  };

  // Filtra o histórico para remover itens com custo zero (mocks do cadastro inicial)
  const realHistory = reportData.history
    .filter((item) => item.cost > 0)
    .map((item, index) => ({
      id: item.id || index,
      item: item.item,
      last_date: item.last_date,
      cost: item.cost,
      liters: item.liters,
    }));

  // Processa dados para o gráfico
  const getChartData = () => {
    const currentYear = new Date().getFullYear();
    let data, labels;

    if (filterType === 'Mês') {
      data = new Array(12).fill(0);
      labels = MONTH_LABELS;

      realHistory.forEach((item) => {
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
      labels = yearLabels.map((l) => l.substring(2));

      realHistory.forEach((item) => {
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
      values: data.map((val) => val / maxCost),
      rawValues: data,
      labels,
      maxIndex,
      total,
    };
  };

  const chartData = getChartData();
  const periodTotal = chartData.total.toFixed(2).replace('.', ',');
  const currentMonthYear =
    filterType === 'Mês'
      ? new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
      : `ÚLTIMOS 12 ANOS (${new Date().getFullYear() - 11} - ${new Date().getFullYear()})`;

  return {
    loading,
    filterType,
    setFilterType,
    isEditingMode,
    isDeletingMode,
    toggleEditingMode,
    toggleDeletingMode,
    reportData,
    realHistory,
    chartData,
    periodTotal,
    currentMonthYear,
    handleDeleteItem,
    refetch: fetchReport,
  };
};

export default useReport;