import api from "../../../services/api";

const BASE_URL = import.meta.env.VITE_API_URL || "";

/** Construye la URL completa de un archivo almacenado */
export function construirUrlArchivo(url) {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url}`;
}

/** Obtiene extensión limpia desde nombre de archivo o campo tipo */
export function getExtension(adjunto) {
  if (adjunto?.tipo) return String(adjunto.tipo).toLowerCase().replace(".", "");
  if (adjunto?.nombre) {
    const parts = String(adjunto.nombre).split(".");
    return parts.length > 1 ? parts.at(-1).toLowerCase() : "";
  }
  return "";
}

/** Sube uno o más archivos al servidor y devuelve [{nombre, url, tipo}] */
export async function uploadArchivos(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const response = await api.post("adjuntos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // [{nombre, url, tipo}]
}

/** Sube un único archivo y devuelve {nombre, url, tipo} */
export async function uploadArchivo(file) {
  const lista = await uploadArchivos([file]);
  return lista[0];
}
