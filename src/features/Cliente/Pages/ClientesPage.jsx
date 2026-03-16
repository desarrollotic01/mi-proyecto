import { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Building2,
} from "lucide-react";

import { clienteService } from "../../mantenimiento/services/clienteService.js";

import ContactosModal from "../Components/ContactosModal.jsx";
import PortalModal from "../Components/PortalModal.jsx";
import GestionarSedeModal from "../Components/GestionarSedeModal.jsx";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [selectedClientePortal, setSelectedClientePortal] = useState(null);

  const [contactosModalOpen, setContactosModalOpen] = useState(false);
  const [selectedClienteContactos, setSelectedClienteContactos] = useState(null);

  const [sedesModalOpen, setSedesModalOpen] = useState(false);
  const [selectedClienteSedes, setSelectedClienteSedes] = useState(null);

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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={loadClientes}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              type="button"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reintentar"}
            </button>
          </div>
        )}

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
                type="button"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Recargar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="min-w-[1800px] w-full text-sm">
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
                  <th className="text-center px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Contactos</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-700 border-r border-gray-200">Sedes</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-700">Portal</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="16" className="text-center py-14 text-gray-500">
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
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">{c.ruc || "-"}</td>
                      <td className="px-4 py-3 border-r border-gray-100 min-w-[320px] text-gray-700">{c.direccion || "-"}</td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">{c.telefono || "-"}</td>
                      <td className="px-4 py-3 border-r border-gray-100 min-w-[220px]">{c.correo || "-"}</td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">{c.tipoCliente || "-"}</td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoBadge(c.estado)}`}>
                          {c.estado || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActivoSapBadge(c.activoSAP)}`}>
                          {c.activoSAP ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 text-center">
                        {Array.isArray(c.contactos) ? c.contactos.length : 0}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-gray-600">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-gray-600">{formatDate(c.updatedAt)}</td>

                      <td className="px-4 py-3 border-r border-gray-100 text-center">
                        <button
                          onClick={() => {
                            setSelectedClienteContactos(c);
                            setContactosModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-semibold gap-2"
                          type="button"
                        >
                          <Users size={16} />
                          Ver
                        </button>
                      </td>

                      <td className="px-4 py-3 border-r border-gray-100 text-center">
                        <button
                          onClick={() => {
                            setSelectedClienteSedes(c);
                            setSedesModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-semibold gap-2"
                          type="button"
                        >
                          <Building2 size={16} />
                          Sedes
                        </button>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedClientePortal(c);
                            setPortalModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          type="button"
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
                    type="button"
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
                            type="button"
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
                    type="button"
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

      <ContactosModal
        isOpen={contactosModalOpen}
        onClose={() => setContactosModalOpen(false)}
        cliente={selectedClienteContactos}
      />

      <GestionarSedeModal
        isOpen={sedesModalOpen}
        onClose={() => setSedesModalOpen(false)}
        cliente={selectedClienteSedes}
      />
    </div>
  );
}