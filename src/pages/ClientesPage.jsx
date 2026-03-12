import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Copy,
  Ban,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

import { clienteService } from "../features/mantenimiento/services/clienteService.js";
import { portalClienteService } from "../features/mantenimiento/services/portalClienteService.js";

/* ================= MODAL PORTAL CLIENTE ================= */
function PortalModal({ isOpen, onClose, cliente }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && cliente) {
      cargarLinks();
    }
  }, [isOpen, cliente]);

 const cargarLinks = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await portalClienteService.listarLinks(cliente.id);
    setLinks(Array.isArray(data) ? data : data.links || data.data || []);
  } catch (err) {
    setError(err.response?.data?.error || "No se pudieron cargar los enlaces.");
  } finally {
    setLoading(false);
  }
};

const handleGenerarLink = async () => {
  setLoading(true);
  setError(null);
  try {
    await portalClienteService.generarLink(cliente.id);
    await cargarLinks();
  } catch (err) {
    setError(
      err.response?.data?.error ||
        err.response?.statusText ||
        "Error al generar el enlace."
    );
  } finally {
    setLoading(false);
  }
};

const handleActivarDesactivar = async (linkId) => {
  setLoading(true);
  try {
    await portalClienteService.desactivarLink(linkId);
    await cargarLinks();
  } catch (err) {
    alert(err.response?.data?.error || "Error al cambiar el estado del enlace");
  } finally {
    setLoading(false);
  }
};

const copiarAlPortapapeles = async (token) => {
  const urlExterna = `${window.location.origin}/portal/cliente/${token}`;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(urlExterna);
      alert(`¡Enlace copiado!\n\n${urlExterna}`);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = urlExterna;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const ok = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (ok) {
      alert(`¡Enlace copiado!\n\n${urlExterna}`);
    } else {
      alert(`No se pudo copiar automáticamente.\n\nCopia este enlace:\n${urlExterna}`);
    }
  } catch (error) {
    console.error("Error copiando al portapapeles:", error);
    alert(`No se pudo copiar automáticamente.\n\nCopia este enlace:\n${urlExterna}`);
  }
};

  if (!isOpen) return null;

  const tieneLink = links.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="text-blue-600" /> Portal del Cliente
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona el acceso al visor para <b>{cliente?.razonSocial}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-xl text-gray-500">×</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!tieneLink && (
            <button
              onClick={handleGenerarLink}
              disabled={loading}
              className="w-full mb-6 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon size={18} />}
              Generar Enlace Único
            </button>
          )}

          <h4 className="font-semibold text-gray-700 mb-3">Enlace Permanente</h4>

          {!tieneLink && !loading ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              Aún no has generado el enlace para este cliente.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className={`p-5 border-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    link.activo
                      ? "border-blue-300 bg-blue-50/30"
                      : "border-gray-200 bg-gray-100 opacity-75"
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                          link.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {link.activo ? "ACCESO PERMITIDO" : "ACCESO DENEGADO"}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Creado: {new Date(link.createdAt).toLocaleDateString("es-PE")}
                      </span>
                    </div>

                    <p className="text-sm font-mono text-gray-600 truncate bg-white px-3 py-2 rounded-lg border border-gray-200">
  /portal/cliente/{link.token}
</p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {link.activo && (
  <button
    onClick={() => handleActivarDesactivar(link.id)}
    disabled={loading}
    className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors bg-red-50 text-red-600 hover:bg-red-100"
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
    Desactivar
  </button>
)}
                    {link.activo && (
                     <button
  onClick={() => copiarAlPortapapeles(link.token)}
  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
>
  <Copy size={16} /> Copiar
</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [selectedClientePortal, setSelectedClientePortal] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterTipoCliente, setFilterTipoCliente] = useState("Todos");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterTipoCliente, itemsPerPage]);

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteService.getClientes();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar los clientes. Verifica que el backend esté corriendo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("es-PE");
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const texto = searchTerm.toLowerCase();

      const matchesSearch =
        (c.sapCode || "").toLowerCase().includes(texto) ||
        (c.razonSocial || "").toLowerCase().includes(texto) ||
        (c.ruc || "").toLowerCase().includes(texto) ||
        (c.direccion || "").toLowerCase().includes(texto) ||
        (c.telefono || "").toLowerCase().includes(texto) ||
        (c.correo || "").toLowerCase().includes(texto) ||
        (c.tipoCliente || "").toLowerCase().includes(texto);

      const matchesEstado =
        filterEstado === "Todos" || c.estado === filterEstado;

      const matchesTipo =
        filterTipoCliente === "Todos" || c.tipoCliente === filterTipoCliente;

      return matchesSearch && matchesEstado && matchesTipo;
    });
  }, [clientes, searchTerm, filterEstado, filterTipoCliente]);

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      Activo: "bg-green-100 text-green-700 border-green-200",
      Inactivo: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[estado] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getActivoSapBadge = (activoSAP) => {
    return activoSAP
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-red-100 text-red-700 border-red-200";
  };

  const tiposCliente = useMemo(() => {
    const tipos = [...new Set(clientes.map((c) => c.tipoCliente).filter(Boolean))];
    return tipos.sort();
  }, [clientes]);

  if (loading && clientes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Cargando clientes...</p>
          <p className="text-sm text-gray-500 mt-2">Obteniendo información del servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 rounded-2xl">
              <FileSpreadsheet className="w-7 h-7 text-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Listado de Clientes</h1>
              <p className="text-gray-600">
                Vista general tipo Excel con todos los campos principales
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-1">
                Verifica tu backend en{" "}
                <code className="bg-red-100 px-2 py-1 rounded">http://localhost:3000/api</code>
              </p>
            </div>
            <button
              onClick={loadClientes}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reintentar"}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total clientes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{clientes.length}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {clientes.filter((c) => c.estado === "Activo").length}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inactivos</p>
            <p className="text-3xl font-bold text-gray-700 mt-2">
              {clientes.filter((c) => c.estado === "Inactivo").length}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Activos en SAP</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">
              {clientes.filter((c) => c.activoSAP).length}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por SAP Code, razón social, RUC, dirección, teléfono, correo o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>

              <select
                value={filterTipoCliente}
                onChange={(e) => setFilterTipoCliente(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Todos">Todos los tipos</option>
                {tiposCliente.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>

              <button
                onClick={loadClientes}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={loading}
                title="Actualizar lista"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Recargar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla tipo Excel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="min-w-[1700px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">#</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">SAP Code</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Razón Social</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">RUC</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Dirección</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Teléfono</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Correo</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Tipo Cliente</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Estado</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Activo SAP</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Contactos</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Creado</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Actualizado</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-700">Portal</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="text-center py-14 text-gray-500">
                      <p className="font-semibold text-base">No se encontraron clientes</p>
                      <p className="text-sm mt-1">Prueba con otros filtros o términos de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((c, index) => (
                    <tr
                      key={c.id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors border-b border-gray-100"
                    >
                      <td className="px-4 py-3 border-r border-gray-100 text-gray-500">
                        {indexOfFirstItem + index + 1}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 font-mono text-xs text-gray-700 whitespace-nowrap">
                        {c.sapCode || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 font-medium text-gray-900 min-w-[260px]">
                        {c.razonSocial || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        {c.ruc || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 min-w-[320px] text-gray-700">
                        {c.direccion || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        {c.telefono || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 min-w-[220px]">
                        {c.correo || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        {c.tipoCliente || "-"}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoBadge(
                            c.estado
                          )}`}
                        >
                          {c.estado || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActivoSapBadge(
                            c.activoSAP
                          )}`}
                        >
                          {c.activoSAP ? "Sí" : "No"}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 text-center">
                        {Array.isArray(c.contactos) ? c.contactos.length : 0}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-gray-600">
                        {formatDate(c.createdAt)}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-gray-600">
                        {formatDate(c.updatedAt)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedClientePortal(c);
                            setPortalModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="Portal del cliente"
                        >
                          <LinkIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer paginación */}
          {filteredClientes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> a{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(indexOfLastItem, filteredClientes.length)}
                  </span>{" "}
                  de <span className="font-semibold text-gray-900">{filteredClientes.length}</span> resultados
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Mostrar:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-200 rounded-md text-sm p-2 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;

                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white border border-blue-600"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }

                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400 self-center">
                            ...
                          </span>
                        );
                      }

                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PortalModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        cliente={selectedClientePortal}
      />
    </div>
  );
}