import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../api';

const usePartsCatalog = (loggedUser) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ vehicle: '', parts: [] });
  const [categories, setCategories] = useState(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const fetchParts = useCallback(async () => {
    try {
      const userId = loggedUser?.id || 1;
      const statusRes = await axios.get(`${API_BASE_URL}/user/status/${userId}`);
      const vehicleId = statusRes.data.vehicle?.id || 1;

      // Usando o endpoint de IA para catálogo técnico personalizado
      const response = await axios.get(`${API_BASE_URL}/vehicle/parts/ai/${vehicleId}`);
      setData(response.data);

      // Extrair categorias únicas das peças
      if (response.data.parts && response.data.parts.length > 0) {
        const uniqueCategories = [
          'Todos',
          ...new Set(response.data.parts.map((part) => part.category || 'Geral')),
        ];
        setCategories(uniqueCategories);

        // Resetar filtro se a categoria selecionada não existir mais nos novos dados
        setSelectedCategory((prev) =>
          prev !== 'Todos' && !uniqueCategories.includes(prev) ? 'Todos' : prev
        );
      }
    } catch (error) {
      console.error('Erro ao buscar catálogo de peças:', error);
    } finally {
      setLoading(false);
    }
  }, [loggedUser]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  return {
    loading,
    data,
    categories,
    selectedCategory,
    setSelectedCategory,
    refetch: fetchParts,
  };
};

export default usePartsCatalog;