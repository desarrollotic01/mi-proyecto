import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: 'Helvetica', 
    fontSize: 9, 
    color: '#334155',
    backgroundColor: '#ffffff'
  },
  // Cabecera
  header: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#2563eb', 
    paddingBottom: 10, 
    marginBottom: 20 
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e3a8a', 
    textTransform: 'uppercase' 
  },
  subtitle: { 
    fontSize: 8, 
    color: '#64748b', 
    marginTop: 4 
  },
  // Secciones
  section: { 
    marginBottom: 15,
    break: 'avoid' 
  },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    backgroundColor: '#eff6ff', 
    padding: 6, 
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb'
  },
  // Grid / Layout de campos
  rowGroup: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    width: '100%',
    marginBottom: 5
  },
  fieldBlock: { 
    width: '33.3%', 
    marginBottom: 8,
    paddingRight: 10
  },
  fieldBlockFull: { 
    width: '100%', 
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  // Etiquetas y Valores
  label: { 
    fontSize: 7, 
    fontWeight: 'bold', 
    color: '#64748b', 
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  value: { 
    fontSize: 9, 
    color: '#0f172a', 
    fontWeight: 'bold' 
  },
  // Pie de página
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    right: 40, 
    textAlign: 'center', 
    color: '#94a3b8', 
    fontSize: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0', 
    paddingTop: 10 
  }
});