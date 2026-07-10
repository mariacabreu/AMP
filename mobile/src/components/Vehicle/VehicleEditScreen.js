import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../api';
import CustomDropdown from '../Vehicle/CustomDropDown';

// Limites de veículos por plano (apenas planos premium podem adicionar mais de 1)
const PLAN_VEHICLE_LIMITS = {
  trimestral: 3,
  anual: 5
};

const getVehicleLimit = (planType) => {
  if (!planType) return 0;
  return PLAN_VEHICLE_LIMITS[planType.toLowerCase()] || 0;
};

const VehicleEditScreen = ({ navigation, route }) => {
  const user = route.params?.user;

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [isPremium, setIsPremium] = useState(user?.is_premium || false);
  const [planType, setPlanType] = useState(user?.plan_type || null);

  // ----- Estado do formulário de edição (aberto ao tocar em um card) -----
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [engines, setEngines] = useState([]);
  const [years, setYears] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [transmission, setTransmission] = useState('');
  const [engineType, setEngineType] = useState('');
  const [usageType, setUsageType] = useState('Misto');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('Gasolina');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [savingVehicle, setSavingVehicle] = useState(false);

  const transmissionOptions = [
    { label: 'Selecione o Câmbio', value: '' },
    { label: 'Manual', value: 'Manual' },
    { label: 'Automático', value: 'Automático' },
    { label: 'Automatizado', value: 'Automatizado' },
    { label: 'CVT', value: 'CVT' }
  ];

  const usageTypeOptions = [
    { label: 'Urbano (Cidade/Trânsito)', value: 'Urbano' },
    { label: 'Rodoviário (Estrada)', value: 'Rodoviário' },
    { label: 'Misto (Cidade e Estrada)', value: 'Misto' },
    { label: 'Trabalho/Severo (Uber/Entrega)', value: 'Severo' }
  ];

  const fuelTypeOptions = [
    { label: 'Gasolina', value: 'Gasolina' },
    { label: 'Etanol', value: 'Etanol' },
    { label: 'Flex', value: 'Flex' },
    { label: 'Diesel', value: 'Diesel' },
    { label: 'Híbrido', value: 'Híbrido' },
    { label: 'Elétrico', value: 'Elétrico' }
  ];

  const vehicleLimit = getVehicleLimit(planType);
  const canAddVehicle = isPremium && vehicleLimit > 0 && vehicles.length < vehicleLimit;
  const isLockedPlan = !isPremium || (planType || '').toLowerCase() === 'mensal';

  useEffect(() => {
    fetchUserPlan();
    fetchVehicles();
    fetchBrands();
  }, []);

  const fetchUserPlan = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${user.id}`);
      setIsPremium(response.data.is_premium);
      setPlanType(response.data.plan_type || null);
    } catch (error) {
      console.error('Erro ao buscar plano do usuário:', error);
    }
  };

  const fetchVehicles = async () => {
    if (!user?.id) {
      setLoadingVehicles(false);
      return;
    }
    try {
      setLoadingVehicles(true);
      const response = await axios.get(`${API_BASE_URL}/user/vehicles/${user.id}`);
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/brands`);
      const formattedBrands = [{ label: 'Selecione a Marca', value: '' }, ...response.data.map(b => ({ label: b, value: b }))];
      setBrands(formattedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchModels = async (brand) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/models/${brand}`);
      setModels([{ label: 'Selecione o Modelo', value: '' }, ...response.data.map(m => ({ label: m, value: m }))]);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchEngines = async (brand, model) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/engines/${brand}/${model}`);
      setEngines([{ label: 'Selecione a Motorização', value: '' }, ...response.data.map(e => ({ label: e, value: e }))]);
    } catch (error) {
      console.error('Error fetching engines:', error);
    }
  };

  const fetchYears = async (brand, model) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicle/years/${brand}/${model}`);
      setYears([{ label: 'Selecione o Ano', value: '' }, ...response.data.map(y => ({ label: y.toString(), value: y.toString() }))]);
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    setSelectedModel('');
    setEngineType('');
    setSelectedYear('');
    if (brand) {
      fetchModels(brand);
    } else {
      setModels([]);
      setEngines([]);
      setYears([]);
    }
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    setEngineType('');
    setSelectedYear('');
    if (model) {
      fetchEngines(selectedBrand, model);
      fetchYears(selectedBrand, model);
    } else {
      setEngines([]);
      setYears([]);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setEngineType('');
    if (selectedBrand && selectedModel) {
      fetchEngines(selectedBrand, selectedModel);
    }
  };

  const openEditForm = useCallback(async (vehicle) => {
    setEditingVehicle(vehicle);
    setSelectedBrand(vehicle.brand);
    setSelectedModel(vehicle.model);
    setSelectedYear(vehicle.year ? vehicle.year.toString() : '');
    setTransmission(vehicle.transmission || '');
    setEngineType(vehicle.engine_type || '');
    setUsageType(vehicle.usage_type || 'Misto');
    setMileage(vehicle.mileage ? vehicle.mileage.toString() : '');
    setFuelType(vehicle.fuel_type || 'Gasolina');

    if (vehicle.brand) {
      await fetchModels(vehicle.brand);
    }
    if (vehicle.brand && vehicle.model) {
      await fetchEngines(vehicle.brand, vehicle.model);
      await fetchYears(vehicle.brand, vehicle.model);
    }
  }, []);

  const closeEditForm = () => {
    setEditingVehicle(null);
    setOpenDropdown(null);
  };

  const handleSaveVehicle = async () => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      Alert.alert('Erro', 'Por favor, preencha a marca, modelo e ano do veículo.');
      return;
    }

    try {
      setSavingVehicle(true);
      await axios.put(`${API_BASE_URL}/vehicle/${editingVehicle.id}`, {
        brand: selectedBrand,
        model: selectedModel,
        year: parseInt(selectedYear),
        transmission,
        engine_type: engineType,
        usage_type: usageType,
        mileage: mileage ? parseInt(mileage) : 0,
        fuel_type: fuelType,
        user_id: user?.id
      });

      Alert.alert('Sucesso', 'Veículo atualizado com sucesso!');
      closeEditForm();
      fetchVehicles();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error.response?.data || error.message);
      const message = error.response?.data?.error || 'Erro ao salvar veículo';
      Alert.alert('Erro', message);
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleAddVehicle = () => {
    if (!canAddVehicle) {
      Alert.alert(
        'Recurso Premium',
        isPremium
          ? `Seu plano atual (${planType || 'mensal'}) não permite adicionar mais veículos. Faça upgrade para Trimestral (até 3) ou Anual (até 5).`
          : 'Assine um plano Premium Trimestral ou Anual para cadastrar mais de um veículo.'
      );
      return;
    }
    navigation.navigate('VehicleRegistration', { user });
  };

  const planLabel = () => {
    if (!isPremium) return 'FREE';
    if (!planType) return 'PREMIUM';
    return planType.toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>GERENCIAMENTO DE VEÍCULOS</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {!editingVehicle && (
          <>
            <View style={styles.planBadgeRow}>
              <View style={[styles.planBadge, isPremium ? styles.planBadgePremium : styles.planBadgeFree]}>
                <MaterialCommunityIcons
                  name={isPremium ? 'crown' : 'lock-outline'}
                  size={14}
                  color={isPremium ? '#2C2C2C' : '#999'}
                />
                <Text style={[styles.planBadgeText, isPremium ? styles.planBadgeTextPremium : styles.planBadgeTextFree]}>
                  {planLabel()}
                </Text>
              </View>
              {vehicleLimit > 0 && (
                <Text style={styles.vehicleCountText}>
                  {vehicles.length} de {vehicleLimit} veículos
                </Text>
              )}
            </View>

            {loadingVehicles ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2C2C2C" />
                <Text style={styles.loadingText}>Carregando veículos...</Text>
              </View>
            ) : (
              <>
                {vehicles.length === 0 && (
                  <View style={styles.emptyState}>
                    <FontAwesome5 name="car-side" size={40} color="#CCC" />
                    <Text style={styles.emptyStateText}>Nenhum veículo cadastrado ainda.</Text>
                  </View>
                )}

                {vehicles.map((vehicle) => (
                  <View key={vehicle.id} style={styles.vehicleCard}>
                    <View style={styles.vehicleCardIcon}>
                      <FontAwesome5 name="car" size={22} color="#2C2C2C" />
                    </View>
                    <View style={styles.vehicleCardInfo}>
                      <Text style={styles.vehicleCardTitle}>
                        {vehicle.brand} {vehicle.model}
                      </Text>
                      <Text style={styles.vehicleCardSubtitle}>
                        {vehicle.year} • {vehicle.engine_type || 'Motorização não informada'}
                      </Text>
                      <Text style={styles.vehicleCardSubtitle}>
                        {vehicle.transmission || 'Câmbio N/D'} • {vehicle.mileage ? `${vehicle.mileage.toLocaleString('pt-BR')} km` : '0 km'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.vehicleCardEditButton}
                      onPress={() => openEditForm(vehicle)}
                    >
                      <Ionicons name="create-outline" size={20} color="#2C2C2C" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addVehicleCard, !canAddVehicle && styles.addVehicleCardDisabled]}
                  onPress={handleAddVehicle}
                  activeOpacity={canAddVehicle ? 0.7 : 1}
                >
                  <MaterialCommunityIcons
                    name={canAddVehicle ? 'plus-circle-outline' : 'lock-outline'}
                    size={26}
                    color={canAddVehicle ? '#2C2C2C' : '#AAAAAA'}
                  />
                  <View style={styles.addVehicleTextContainer}>
                    <Text style={[styles.addVehicleTitle, !canAddVehicle && styles.addVehicleTitleDisabled]}>
                      Adicionar Veículo
                    </Text>
                    <Text style={styles.addVehicleSubtitle}>
                      {isPremium
                        ? vehicleLimit > 0
                          ? canAddVehicle
                            ? `Você pode adicionar até ${vehicleLimit} veículos no plano ${planType}.`
                            : `Limite de ${vehicleLimit} veículos do plano ${planType} atingido.`
                          : 'Faça upgrade para Trimestral ou Anual para adicionar mais veículos.'
                        : 'Disponível apenas para planos Premium (Trimestral ou Anual).'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {editingVehicle && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <TouchableOpacity onPress={closeEditForm} style={styles.formBackButton}>
                <Ionicons name="arrow-back" size={20} color="#2C2C2C" />
                <Text style={styles.formBackButtonText}>Voltar para a lista</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.infoText}>
              Apenas veículos compatíveis com OBD-II Bluetooth e com documentação de API disponível são listados.
            </Text>

            <CustomDropdown
              label="Marca do Carro"
              items={brands}
              selectedValue={selectedBrand}
              onSelect={handleBrandChange}
              placeholder="Selecione a Marca"
              isOpen={openDropdown === 'brand'}
              setIsOpen={(open) => setOpenDropdown(open ? 'brand' : null)}
              onOpen={() => setOpenDropdown('brand')}
              enabled={true}
            />

            <CustomDropdown
              label="Modelo do Carro"
              items={models}
              selectedValue={selectedModel}
              onSelect={handleModelChange}
              placeholder="Selecione o Modelo"
              enabled={!!selectedBrand}
              isOpen={openDropdown === 'model'}
              setIsOpen={(open) => setOpenDropdown(open ? 'model' : null)}
              onOpen={() => setOpenDropdown('model')}
            />

            <CustomDropdown
              label="Ano do Carro"
              items={years}
              selectedValue={selectedYear}
              onSelect={handleYearChange}
              placeholder="Selecione o Ano"
              enabled={!!selectedModel}
              isOpen={openDropdown === 'year'}
              setIsOpen={(open) => setOpenDropdown(open ? 'year' : null)}
              onOpen={() => setOpenDropdown('year')}
            />

            <CustomDropdown
              label="Câmbio"
              items={transmissionOptions}
              selectedValue={transmission}
              onSelect={setTransmission}
              placeholder="Selecione o Câmbio"
              enabled={true}
              isOpen={openDropdown === 'transmission'}
              setIsOpen={(open) => setOpenDropdown(open ? 'transmission' : null)}
              onOpen={() => setOpenDropdown('transmission')}
            />

            <CustomDropdown
              label="Motorização (Contexto para IA)"
              items={engines}
              selectedValue={engineType}
              onSelect={setEngineType}
              placeholder="Selecione a Motorização"
              enabled={!!selectedBrand && !!selectedModel && !!selectedYear}
              isOpen={openDropdown === 'engine'}
              setIsOpen={(open) => setOpenDropdown(open ? 'engine' : null)}
              onOpen={() => setOpenDropdown('engine')}
            />

            <CustomDropdown
              label="Perfil de Uso (Recomendações IA)"
              items={usageTypeOptions}
              selectedValue={usageType}
              onSelect={setUsageType}
              placeholder="Selecione o Perfil de Uso"
              enabled={true}
              isOpen={openDropdown === 'usage'}
              setIsOpen={(open) => setOpenDropdown(open ? 'usage' : null)}
              onOpen={() => setOpenDropdown('usage')}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Quilometragem</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 50000"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="numeric"
                editable={true}
              />
            </View>

            <CustomDropdown
              label="Combustível"
              items={fuelTypeOptions}
              selectedValue={fuelType}
              onSelect={setFuelType}
              placeholder="Selecione o Combustível"
              enabled={true}
              isOpen={openDropdown === 'fuel'}
              setIsOpen={(open) => setOpenDropdown(open ? 'fuel' : null)}
              onOpen={() => setOpenDropdown('fuel')}
            />

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEditForm}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveVehicle} disabled={savingVehicle}>
                {savingVehicle ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
        overflow: 'hidden'
      },
      default: {
        flex: 1
      }
    })
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: {
    width: 40,
    zIndex: 2,
    alignSelf: 'flex-start'
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    bottom: 16,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerLogo: {
    width: 120,
    height: 40
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginTop: 6,
    letterSpacing: 0.5
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll'
      }
    })
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  planBadgePremium: {
    backgroundColor: '#FFCF00'
  },
  planBadgeFree: {
    backgroundColor: '#F0F0F0'
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5
  },
  planBadgeTextPremium: {
    color: '#2C2C2C'
  },
  planBadgeTextFree: {
    color: '#999'
  },
  vehicleCountText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600'
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 10
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  vehicleCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFCF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  vehicleCardInfo: {
    flex: 1
  },
  vehicleCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A'
  },
  vehicleCardSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2
  },
  vehicleCardEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  addVehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2C2C2C',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 20
  },
  addVehicleCardDisabled: {
    borderColor: '#DDDDDD',
    backgroundColor: '#FAFAFA'
  },
  addVehicleTextContainer: {
    flex: 1,
    marginLeft: 12
  },
  addVehicleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A'
  },
  addVehicleTitleDisabled: {
    color: '#AAAAAA'
  },
  addVehicleSubtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 3,
    lineHeight: 15
  },
  formCard: {
    borderWidth: 1,
    borderColor: '#00000022',
    borderRadius: 15,
    padding: 20
  },
  formHeader: {
    marginBottom: 16
  },
  formBackButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  formBackButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C'
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600'
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  bottomSpacer: {
    height: 60
  }
});

export default VehicleEditScreen;