import React from 'react';
import CardPaymentScreen from './CardPaymentScreen';

const DebitPaymentScreen = ({ navigation, route }) => (
  <CardPaymentScreen
    navigation={navigation}
    route={route}
    title="CARTÃO DE DÉBITO"
  />
);

export default DebitPaymentScreen;