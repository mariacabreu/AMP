import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../api';
import BottomNav from '../components/NavBar/BottomNav';

const PartsCatalogScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [data, setData] = useState({ vehicle: '', parts: [] });
  const [selectedPart, setSelectedPart] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Categorias dinâmicas baseadas nas peças recebidas
  const [categories, setCategories] = useState(['Todos']);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
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
          ...new Set(response.data.parts.map(part => part.category || 'Geral'))
        ];
        setCategories(uniqueCategories);
        
        // Resetar filtro se a categoria selecionada não existir mais nos novos dados
        if (selectedCategory !== 'Todos' && !uniqueCategories.includes(selectedCategory)) {
          setSelectedCategory('Todos');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar catálogo de peças:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartPress = (part) => {
    setSelectedPart(part);
    setModalVisible(true);
  };

  const filteredParts = data.parts.filter(part => {
    const matchesCategory = selectedCategory === 'Todos' || (part.category || 'Geral') === selectedCategory;
    const matchesSearch = (part.name || '').toLowerCase().includes(search.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Agrupa as peças por categoria para visualização (Título da Seção)
  const groupedParts = filteredParts.reduce((acc, part) => {
    const cat = part.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(part);
    return acc;
  }, {});

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
        <Text style={styles.screenTitle}>CATÁLOGO DE PEÇAS</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar peça..."
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} />
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.vehicleInfo}>Peças para: {data.vehicle}</Text>

        {/* Parts List */}
        {filteredParts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed" size={50} color="#D9D9D9" />
            <Text style={styles.emptyStateText}>Nenhuma peça encontrada.</Text>
          </View>
        ) : (
          selectedCategory === 'Todos' ? (
            // Visualização em "Todos": Lista contínua de cards sem títulos de seção
            filteredParts.map((part) => (
              <TouchableOpacity 
                key={part.id} 
                style={styles.partCard}
                onPress={() => handlePartPress(part)}
                activeOpacity={0.7}
              >
                <View style={styles.partInfo}>
                  <Text style={styles.partName}>{part.name}</Text>
                  <Text style={styles.partDescription}>{part.description}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            // Visualização com Filtro Selecionado: Exibe o título da categoria e as peças dela
            <View style={styles.subcategorySection}>
              <View style={styles.subcategoryHeader}>
                <Text style={styles.subcategoryTitle}>{selectedCategory.toUpperCase()}</Text>
                <View style={styles.subcategoryLine} />
              </View>
              {filteredParts.map((part) => (
                <TouchableOpacity 
                  key={part.id} 
                  style={styles.partCard}
                  onPress={() => handlePartPress(part)}
                  activeOpacity={0.7}
                >
                  <View style={styles.partInfo}>
                    <Text style={styles.partName}>{part.name}</Text>
                    <Text style={styles.partDescription}>{part.description}</Text>
                  </View>

                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        <View style={styles.emptySpace} />
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>

            {selectedPart && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalPartName}>{selectedPart.name.toUpperCase()}</Text>
                <Text style={styles.modalCategory}>{selectedPart.category}</Text>

                <View style={styles.detailSection}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PARA QUE SERVE?</Text>
                    <Text style={styles.detailText}>{selectedPart.details?.purpose || 'Informação não disponível.'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ONDE FICA?</Text>
                    <Text style={styles.detailText}>{selectedPart.details?.location || 'Informação não disponível.'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PROBLEMAS COMUNS:</Text>
                    <Text style={styles.detailText}>{selectedPart.details?.common_problems || 'Informação não disponível.'}</Text>
                  </View>

                  {selectedPart.details?.maintenance_interval && (
                    <View style={[styles.detailItem, { backgroundColor: '#FFF9E6', padding: 10, borderRadius: 8 }]}>
                      <Text style={[styles.detailLabel, { color: '#B8860B' }]}>INTERVALO RECOMENDADO:</Text>
                      <Text style={[styles.detailText, { fontWeight: '700' }]}>{selectedPart.details.maintenance_interval}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={styles.modalActionBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalActionBtnText}>ENTENDI</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={30} color="#FFCF00" />
      </TouchableOpacity>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Peças" />
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
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginVertical: 15,
  },
  searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#000',
  borderRadius: 8,
  paddingHorizontal: 15,
  height: 45,
  marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  searchIcon: {
    marginLeft: 10,
  },
  categoriesContainer: {
    marginBottom: 20,
    ...Platform.select({
      web: {
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
      }
    })
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    height: 40,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        display: 'inline-flex',
      }
    })
  },
  categoryButtonActive: {
    backgroundColor: '#2c2c2c',
  },
  categoryText: {
    fontSize: 12,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  subcategorySection: {
    marginBottom: 25,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  subcategoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFCF00',
    marginRight: 10,
  },
  subcategoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D9D9',
  },
  partCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    minHeight: 120,
  },
  partInfo: {
    flex: 1,
    paddingRight: 10,
  },
  partName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 5,
  },
  partDescription: {
    fontSize: 10,
    color: '#000',
    lineHeight: 14,
    textAlign: 'justify',
  },
  partImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  emptySpace: {
    height: 100,
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
  navBar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#2b2b2b',
    height: 70,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#D9D9D9',
    marginTop: 4,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#FFCF00',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  modalPartName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
  modalCategory: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailSection: {
    marginTop: 10,
  },
  detailItem: {
    marginBottom: 20,
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
  modalActionBtn: {
    backgroundColor: '#2c2c2c',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  modalActionBtnText: {
    color: '#FFCF00',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default PartsCatalogScreen;
