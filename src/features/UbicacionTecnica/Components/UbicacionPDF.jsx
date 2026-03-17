import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles as styles } from '../../../components/pdf/PDFStyles';
import { PDFHeader, PDFFooter } from '../../../components/pdf/PDFLayout';

// Helpers para formatear datos
const val = (x) => (x === null || x === undefined || x === "" ? "-" : String(x));
const fmtDate = (d) => {
  if (!d) return "-";
  try {
    const [year, month, day] = String(d).split('T')[0].split("-");
    return `${day}/${month}/${year}`;
  } catch { return "-"; }
};

export const UbicacionPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* 🆕 CABECERA COMPARTIDA */}
      <PDFHeader titulo="FICHA TÉCNICA DE ACTIVO" />

      {/* 1. IDENTIFICACIÓN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Identificación del Activo</Text>
        <View style={styles.rowGroup}>
          <View style={styles.fieldBlock}><Text style={styles.label}>CÓDIGO:</Text><Text style={styles.value}>{val(data?.codigo)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>ID PLACA:</Text><Text style={styles.value}>{val(data?.idPlaca)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>PROPIEDAD:</Text><Text style={styles.value}>{val(data?.tipoEquipoPropiedad).toUpperCase()}</Text></View>
        </View>
      </View>

      {/* 2. DATOS DEL EQUIPO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Datos del Equipo</Text>
        <View style={styles.rowGroup}>
          <View style={styles.fieldBlockFull}><Text style={styles.label}>NOMBRE:</Text><Text style={styles.value}>{val(data?.nombre).toUpperCase()}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>ESPECIALIDAD:</Text><Text style={styles.value}>{val(data?.especialidad)}</Text></View>
          <View style={styles.fieldBlockFull}><Text style={{...styles.label, width: '17.5%'}}>DESCRIPCIÓN:</Text><Text style={{...styles.value, width: '82.5%', fontWeight: 'normal'}}>{val(data?.descripcion)}</Text></View>
        </View>
      </View>

      {/* 3. CLIENTE Y UBICACIÓN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Cliente y Ubicación</Text>
        <View style={styles.rowGroup}>
          <View style={styles.fieldBlockFull}><Text style={styles.label}>CLIENTE:</Text><Text style={styles.value}>{val(data?.nombreClienteEnriquecido).toUpperCase()}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>ID CLIENTE:</Text><Text style={styles.value}>{val(data?.id_cliente)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>PAÍS:</Text><Text style={styles.value}>{val(data?.nombrePaisEnriquecido)}</Text></View>
          <View style={styles.fieldBlockFull}><Text style={styles.label}>SEDE:</Text><Text style={styles.value}>{val(data?.sede)}</Text></View>
        </View>
      </View>

      {/* 4. LOGÍSTICA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Información Logística</Text>
        <View style={styles.rowGroup}>
          <View style={styles.fieldBlock}><Text style={styles.label}>ALMACÉN:</Text><Text style={styles.value}>{val(data?.almacen)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>OPERADOR LOG.:</Text><Text style={styles.value}>{val(data?.operadorLogistico)}</Text></View>
        </View>
      </View>

      {/* 5. COMERCIAL Y FECHAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Comercial y Garantías</Text>
        <View style={styles.rowGroup}>
          <View style={styles.fieldBlock}><Text style={styles.label}>ORDEN VENTA (OV):</Text><Text style={styles.value}>{val(data?.numeroOV)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>FECHA OV:</Text><Text style={styles.value}>{fmtDate(data?.fechaOV)}</Text></View>
          
          <View style={styles.fieldBlock}><Text style={styles.label}>ORDEN CLIENTE (OC):</Text><Text style={styles.value}>{val(data?.numeroOrdenCliente)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>FECHA OC:</Text><Text style={styles.value}>{fmtDate(data?.fechaOrdenCliente)}</Text></View>
          
          <View style={styles.fieldBlock}><Text style={styles.label}>ENTREGA PREVISTA:</Text><Text style={styles.value}>{fmtDate(data?.fechaEntregaPrevista)}</Text></View>
          <View style={styles.fieldBlock}><Text style={styles.label}>ENTREGA REAL:</Text><Text style={styles.value}>{fmtDate(data?.fechaEntregaReal)}</Text></View>
          
          <View style={styles.fieldBlockFull}><Text style={styles.label}>FIN DE GARANTÍA:</Text><Text style={{...styles.value, color: '#059669'}}>{fmtDate(data?.finGarantia)}</Text></View>
        </View>
      </View>

      {/* 🆕 PIE DE PÁGINA COMPARTIDO */}
      <PDFFooter />
      
    </Page>
  </Document>
);