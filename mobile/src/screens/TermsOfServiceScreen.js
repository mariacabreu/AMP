import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

const TermsOfServiceScreen = ({ navigation, route }) => {
  const loggedUser = route.params?.user;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos e Condições</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Última atualização: Julho de 2026
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.sectionText}>
            Ao acessar e usar o aplicativo, você concorda em cumprir e estar vinculado aos termos e condições deste acordo. Se você não concordar com qualquer parte destes termos, não use o aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Uso do Aplicativo</Text>
          <Text style={styles.sectionText}>
            Este aplicativo é fornecido para auxiliar na manutenção preventiva de veículos e na conexão com dispositivos OBD2. Você concorda em usar o aplicativo apenas para fins legais e de acordo com estes termos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Dados do Usuário</Text>
          <Text style={styles.sectionText}>
            Coletamos e armazenamos dados do usuário conforme nossa Política de Privacidade. Os dados do seu veículo e histórico de manutenção são armazenados de forma segura e não são compartilhados com terceiros sem seu consentimento explícito.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Conexão OBD2</Text>
          <Text style={styles.sectionText}>
            O aplicativo se conecta a dispositivos OBD2 para leitura de dados do veículo. A conexão é feita de forma segura e apenas comandos de leitura são enviados ao ECU do veículo para garantir a segurança e não interferência no funcionamento do carro.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Responsabilidades</Text>
          <Text style={styles.sectionText}>
            O aplicativo é fornecido "como está" sem garantias de qualquer tipo. Não nos responsabilizamos por danos ao veículo, perda de dados ou qualquer outro problema decorrente do uso do aplicativo ou da conexão com dispositivos OBD2.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Conta Premium</Text>
          <Text style={styles.sectionText}>
            Algumas funcionalidades do aplicativo são exclusivas para contas premium. Os pagamentos são processados através das lojas de aplicativos (Apple App Store ou Google Play Store) e estão sujeitos aos termos das mesmas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Alterações nos Termos</Text>
          <Text style={styles.sectionText}>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. Quaisquer alterações serão comunicadas através do aplicativo. O uso continuado do app após as alterações confirma sua aceitação dos novos termos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contato</Text>
          <Text style={styles.sectionText}>
            Se você tiver dúvidas sobre estes Termos e Condições, entre em contato conosco através do e-mail: suporte@ampapp.com
          </Text>
        </View>

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
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 10
  },
  sectionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22
  },
  footerSpace: {
    height: 50
  }
});

export default TermsOfServiceScreen;
