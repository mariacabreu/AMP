import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import InitialScreen from './src/screens/InitialScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VehicleRegistrationScreen from './src/screens/VehicleRegistrationScreen';
import VehicleHistoryScreen from './src/screens/VehicleHistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import ReportFormScreen from './src/screens/ReportFormScreen';
import PartsCatalogScreen from './src/screens/PartsCatalogScreen';
import FuelScreen from './src/screens/FuelScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PremiumPlanScreen from './src/screens/PremiumPlanScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import CreditPaymentScreen from './src/screens/CreditPaymentScreen';
import DebitPaymentScreen from './src/screens/DebitPaymentScreen';
import QRCodeScreen from './src/screens/QRCodeScreen';
import MaintenanceTipsScreen from './src/screens/MaintenanceTipsScreen';
import OBDScreen from './src/screens/OBDScreen';
import TravelPlanningScreen from './src/screens/TravelPlanningScreen';
import MaintenanceEditScreen from './src/screens/MaintenanceEditScreen';
import TripHistoryScreen from './src/screens/TripHistoryScreen';
import VehicleCompatibilityScreen from './src/screens/VehicleCompatibilityScreen';
import RemindersScreen from './src/components/Settings/RemindersScreen';
import ReminderFrequencyScreen from './src/components/Settings/ReminderFrequencyScreen';
import FAQScreen from './src/screens/FAQScreen';
import LanguageSelectionScreen from './src/components/Settings/LanguageSelectionScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import { LanguageProvider } from './src/contexts/LanguageContext';


const Stack = createStackNavigator();

export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Initial" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Initial" component={InitialScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VehicleRegistration" component={VehicleRegistrationScreen} />
          <Stack.Screen name="VehicleHistory" component={VehicleHistoryScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="ReportForm" component={ReportFormScreen} />
          <Stack.Screen name="MaintenanceEdit" component={MaintenanceEditScreen} />
          <Stack.Screen name="PartsCatalog" component={PartsCatalogScreen} />
          <Stack.Screen name="Fuel" component={FuelScreen} />
          <Stack.Screen name="Checklist" component={ChecklistScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="PremiumPlan" component={PremiumPlanScreen} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
          <Stack.Screen name="CreditPayment" component={CreditPaymentScreen} />
          <Stack.Screen name="DebitPayment" component={DebitPaymentScreen} />
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="MaintenanceTips" component={MaintenanceTipsScreen} />
          <Stack.Screen name="OBD" component={OBDScreen} />
          <Stack.Screen name="TravelPlanning" component={TravelPlanningScreen} />
          <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
          <Stack.Screen name="VehicleCompatibility" component={VehicleCompatibilityScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="ReminderFrequency" component={ReminderFrequencyScreen} />
          <Stack.Screen name="FAQ" component={FAQScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}