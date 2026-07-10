import React from 'react';
import CardPaymentScreen from './CardPaymentScreen';

const CreditPaymentScreen = ({ navigation, route }) => (
  <CardPaymentScreen
    navigation={navigation}
    route={route}
    title="CARTÃO DE CRÉDITO"
  />
);

export default CreditPaymentScreen;