import { StyleSheet } from '@react-pdf/renderer';

export const globalPdfStyles = StyleSheet.create({
  page: { padding: 35, fontFamily: 'Helvetica', fontSize: 9, color: '#334155' },
  header: { borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 10, marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  // ... todos los estilos de las cajitas, filas y textos
});