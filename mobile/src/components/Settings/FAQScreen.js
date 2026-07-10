import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../NavBar/BottomNav';
import Header from '../Header/Header';

const FAQScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqData = [
    {
      question: "Como conecto o scanner OBD2?",
      answer: "1. Conecte o scanner na porta OBD2 do seu veículo (geralmente embaixo do painel do motorista).\n2. Pareie o dispositivo via Bluetooth nas configurações do seu telefone.\n3. Abra o app e clique em \"Conectar OBD\"."
    },
    {
      question: "Meu veículo é compatível com o scanner?",
      answer: "Veículos fabricados a partir de 2008 (globais) ou 2012 (Brasil) são geralmente compatíveis com OBD2. Você pode verificar usando a tela de \"Verificação de Compatibilidade\" do app."
    },
    {
      question: "Como crio lembretes de manutenção?",
      answer: "1. Vá para Configurações > Lembretes Programáveis.\n2. Clique em \"Adicionar Novo Lembrete\".\n3. Insira o nome da manutenção e escolha a data.\n4. Você também pode escolher a frequência dos lembretes nas configurações."
    },
    {
      question: "Os dados do meu veículo são seguros?",
      answer: "Sim! Todos os dados são armazenados localmente no seu dispositivo e no seu perfil seguro. Não compartilhamos suas informações com terceiros sem seu consentimento explícito."
    },
    {
      question: "Como vejo o histórico de manutenções?",
      answer: "Você pode acessar o histórico de manutenções pela tela inicial, no card \"Histórico\" ou na tela de \"Dados do Veículo\"."
    },
    {
      question: "O app funciona offline?",
      answer: "Sim! As funcionalidades principais (como checklist de manutenção e lembretes) funcionam offline. A conexão é necessária apenas para sincronizar dados e usar recursos premium."
    }
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <Header
        showIcons={false}
        navigation={navigation}
        loggedUser={loggedUser}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Respostas para as perguntas mais frequentes
        </Text>

        {faqData.map((item, index) => (
          <View key={index} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(index)}
            >
              <Text style={styles.questionText}>{item.question}</Text>
              <MaterialCommunityIcons
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={24}
                color="#FFCF00"
              />
            </TouchableOpacity>

            {expandedIndex === index && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} user={loggedUser} activeScreen="Config" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000'
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'scroll' }
    })
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20
  },
  faqCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 10
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  answerText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22
  },
  footerSpace: {
    height: 50
  }
});

export default FAQScreen;
