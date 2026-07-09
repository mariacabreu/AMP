import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

// Recebe callbacks já resolvidos pela tela pai (que sabe se o usuário é premium ou não)
const DashboardGrid = ({
  onPressOBD,
  onPressTravelPlanning,
  onPressVehicleRegistration,
  onPressMaintenanceTips,
  onPressPartsCatalog,
  onPressTripHistory
}) => {
  return (
    <View style={styles.buttonGrid}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.gridButton} onPress={onPressOBD}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="engine" size={50} color="#FFCF00" />
          </View>
          <Text style={styles.gridButtonTitle}>OBD</Text>
          <Text style={styles.gridButtonSub}>Diagnóstico de Bordo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridButton} onPress={onPressTravelPlanning}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="route" size={45} color="#FFCF00" />
          </View>
          <Text style={styles.gridButtonTitle}>Planeje sua viagem</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.gridButton} onPress={onPressVehicleRegistration}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="car-info" size={50} color="#FFCF00" />
          </View>
          <Text style={styles.gridButtonTitle}>Dados do veículo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridButton} onPress={onPressMaintenanceTips}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="tools" size={45} color="#FFCF00" />
          </View>
          <Text style={styles.gridButtonTitle}>Dicas de manutenção</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.gridButton} onPress={onPressPartsCatalog}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="settings-input-component" size={50} color="#FFCF00" />
          </View>
          <Text style={styles.gridButtonTitle}>Informações OBD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridButton} onPress={onPressTripHistory}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={50} color="#FFCF00" />
          </View>
          <Text style={styles.gridButtonTitle}>Histórico</Text>
          <Text style={styles.gridButtonSub}>Relatório de Viagens</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonGrid: {
    width: '100%',
    marginTop: 30
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  gridButton: {
    backgroundColor: '#2C2C2C',
    width: '48%',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140
  },
  iconCircle: {
    marginBottom: 10
  },
  gridButtonTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  gridButtonSub: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2
  }
});

export default React.memo(DashboardGrid);