import { View, Text } from '@react-pdf/renderer';
import { pdfStyles as styles } from './PDFStyles';

export const PDFHeader = ({ titulo }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{titulo}</Text>
    <Text style={styles.subtitle}>
      Sistema de Gestión Activos | Generado el: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
    </Text>
  </View>
);

export const PDFFooter = () => (
  <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
    `Reporte Confidencial • Página ${pageNumber} de ${totalPages}`
  )} fixed />
);