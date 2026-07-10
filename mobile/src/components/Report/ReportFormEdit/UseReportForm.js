import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../../../api';
const GAS_TYPE_OPTIONS = [
  { label: 'Comum', value: 'Comum' },
  { label: 'Aditivada', value: 'Aditivada' },
  { label: 'Premium', value: 'Premium' },
];

// Converte string DD/MM/YYYY para objeto Date
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

export default function useReportForm({ editItem, vehicleId, loggedUser, navigation }) {
  const [gasType, setGasType] = useState(editItem ? editItem.item.split(' ').pop() : 'Comum');
  const [gasTypeDropdownOpen, setGasTypeDropdownOpen] = useState(false);

  const [date, setDate] = useState(editItem ? parseDate(editItem.last_date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Litros: armazenado como dígitos brutos, mascarado com 2 casas decimais + sufixo "L"
  const [rawLiters, setRawLiters] = useState(editItem ? String(Math.round(editItem.liters * 100)) : '');

  // Valor por Litro: armazenado como dígitos brutos, mascarado com 2 casas decimais + prefixo "R$"
  const [rawPricePerLiter, setRawPricePerLiter] = useState(
    editItem ? String(Math.round((editItem.cost / editItem.liters) * 100)) : ''
  );

  const onChangeLiters = (text) => {
    setRawLiters(text.replace(/[^0-9]/g, ''));
  };

  const onChangePrice = (text) => {
    setRawPricePerLiter(text.replace(/[^0-9]/g, ''));
  };

  // Litros formatado para exibição (ex: "30,50")
  const formattedLiters = useMemo(() => {
    const cleaned = rawLiters.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawLiters]);

  // Valor por litro formatado para exibição (ex: "5,49")
  const formattedPricePerLiter = useMemo(() => {
    const cleaned = rawPricePerLiter.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '0,00';
    const num = parseInt(cleaned, 10) / 100;
    return num.toFixed(2).replace('.', ',');
  }, [rawPricePerLiter]);

  // Valores numéricos reais calculados a partir dos dígitos brutos
  const litersNum = useMemo(() => {
    const cleaned = rawLiters.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? parseInt(cleaned, 10) / 100 : 0;
  }, [rawLiters]);

  const priceNum = useMemo(() => {
    const cleaned = rawPricePerLiter.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? parseInt(cleaned, 10) / 100 : 0;
  }, [rawPricePerLiter]);

  // Valor total calculado automaticamente
  const totalValue = useMemo(() => {
    if (litersNum > 0 && priceNum > 0) {
      return (litersNum * priceNum).toFixed(2);
    }
    return '';
  }, [litersNum, priceNum]);

  const handleAddCost = async () => {
    if (litersNum <= 0 || priceNum <= 0) {
      Alert.alert('Erro', 'Por favor, preencha a quantidade de litros e o valor por litro.');
      return;
    }

    const calculatedTotal = litersNum * priceNum;

    try {
      // Priorizando o vehicleId que vem do parâmetro, senão usa 1 como fallback seguro
      const vId = vehicleId || 1;
      console.log('Enviando custo para veículo ID:', vId);

      const response = await axios.post(`${API_BASE_URL}/vehicle/maintenance`, {
        vehicle_id: vId,
        history: [
          {
            item: `Gasolina tipo ${gasType}`,
            last_km: 0,
            last_date: date.toLocaleDateString('pt-BR'),
            cost: calculatedTotal,
            liters: litersNum,
          },
        ],
      });

      console.log('Resposta servidor:', response.data);
      navigation.navigate('Report', { user: loggedUser });
    } catch (error) {
      console.error('Erro detalhado:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível salvar o custo. Verifique se você possui um veículo cadastrado.');
    }
  };

  return {
    gasTypeOptions: GAS_TYPE_OPTIONS,
    gasType,
    setGasType,
    gasTypeDropdownOpen,
    setGasTypeDropdownOpen,
    date,
    setDate,
    showDatePicker,
    setShowDatePicker,
    formattedLiters,
    formattedPricePerLiter,
    onChangeLiters,
    onChangePrice,
    totalValue,
    handleAddCost,
  };
}