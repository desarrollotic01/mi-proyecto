/**
 * Helpers para transformar datos entre backend y frontend
 */

/**
 * Transforma un aviso del backend al formato del frontend
 * Backend: equiposRelacion = [{ avisoId, equipoId }]
 * Frontend: equipos = ["equipoId1", "equipoId2"]
 */
export const transformarAvisoBackendToFrontend = (aviso) => {
  if (!aviso) return null;
  
  return {
    ...aviso,
    // Transformar equiposRelacion a equipos (array de IDs)
    equipos: aviso.equiposRelacion?.map(rel => rel.equipoId) || [],
    // Guardar el original por si se necesita
    equiposRelacionOriginal: aviso.equiposRelacion,
    // Transformar solicitante (si viene como objeto)
    solicitante: aviso.solicitante?.nombreApellido || aviso.solicitante || "",
  };
};

/**
 * Transforma múltiples avisos
 */
export const transformarAvisosBackendToFrontend = (avisos) => {
  if (!Array.isArray(avisos)) return [];
  return avisos.map(transformarAvisoBackendToFrontend);
};

/**
 * Transforma un aviso del frontend al formato del backend
 * Frontend: equipos = ["equipoId1", "equipoId2"]
 * Backend: equipos = ["equipoId1", "equipoId2"] (se mantiene igual)
 */
export const transformarAvisoFrontendToBackend = (aviso) => {
  if (!aviso) return null;
  
  const payload = {
    ...aviso,
    // equipos ya está en el formato correcto (array de IDs)
    equipos: aviso.equipos || [],
  };
  
  // Limpiar campos que no se deben enviar
  delete payload.equiposRelacionOriginal;
  delete payload.equiposRelacion;
  delete payload.creador;
  delete payload.estadoAviso; // Backend lo maneja
  delete payload.ubicacionTecnicaId; // Si existe
  
  return payload;
};

/**
 * Obtiene los datos completos de equipos a partir de IDs
 */
export const obtenerEquiposCompletos = (equipoIds, equiposData) => {
  if (!Array.isArray(equipoIds) || !Array.isArray(equiposData)) {
    return [];
  }
  
  return equipoIds
    .map(id => equiposData.find(e => e.id === id))
    .filter(Boolean); // Eliminar nulls/undefined
};