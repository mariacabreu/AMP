import { StyleSheet } from 'react-native';

// Estilos compartilhados entre o dropdown, os inputs do form e outros campos
export default StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  inputGroupOpen: {
    zIndex: 1000,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
}); 
