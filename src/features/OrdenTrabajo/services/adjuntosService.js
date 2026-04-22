// Re-exporta desde el módulo centralizado de adjuntos
// Mantiene compatibilidad con el código existente
export { uploadArchivos as default } from "../../adjuntos/services/adjuntosService";
export { construirUrlArchivo, getExtension, uploadArchivos, uploadArchivo } from "../../adjuntos/services/adjuntosService";

// Objeto legacy para compatibilidad con imports existentes
import { uploadArchivos } from "../../adjuntos/services/adjuntosService";
export const adjuntosService = {
  uploadArchivos,
};
