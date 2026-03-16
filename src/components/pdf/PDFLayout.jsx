import { View, Text } from '@react-pdf/renderer';
import { pdfStyles as styles } from './PDFStyles';

// Componente reutilizable para la cabecera
export const PDFHeader = ({ titulo }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{titulo}</Text>
    <Text style={styles.subtitle}>Sistema de Gestión SAP Service Layer | {new Date().toLocaleString()}</Text>
  </View>
);

// Componente reutilizable para el pie de página
export const PDFFooter = () => (
  <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
    `Documento generado automáticamente por SAP Service Layer • Página ${pageNumber} de ${totalPages}`
  )} fixed />
);