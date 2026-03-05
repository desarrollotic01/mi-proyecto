import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  AlertCircle,
  Loader2,
} from "lucide-react";

import UbicacionTecnicaModal from "../Components/UbicacionTecnicaModal";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";

const fmtDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("es-PE");
  } catch {
    return String(v);
  }
};

const show = (v) =>
  v === null || v === undefined || String(v).trim() === "" ? "—" : String(v);

export default function UbicacionesTecnicasPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await UbicacionTecnicaService.getUbicacionTecnicas();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar Ubicaciones Técnicas.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;

    return items.filter((u) => {
      const blob = [
        u.codigo,
        u.nombre,
        u.id_cliente,
        u.clienteId,
        u.ClienteId,
        u.tipoEquipoPropiedad,
        u.paisId,
        u.sede,
        u.almacen,
        u.operadorLogistico,
        u.idPlaca,
        u.numeroOV,
        u.fechaOV,
        u.numeroOrdenCliente,
        u.fechaOrdenCliente,
        u.descripcion,
        u.fechaEntregaPrevista,
        u.fechaEntregaReal,
        u.finGarantia,
        u.especialidad,
        u?.cliente?.nombre,
        u?.cliente?.razonSocial,
        u?.pais?.nombre,
      ]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" | ");

      return blob.includes(q);
    });
  }, [items, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload, mode) => {
    if (mode === "edit") {
      await UbicacionTecnicaService.updateUbicacionTecnica(editing.id, payload);
    } else {
      await UbicacionTecnicaService.createUbicacionTecnica(payload);
    }
    await loadItems();
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro de eliminar esta Ubicación Técnica?")) return;
    setBusyId(id);
    try {
      await UbicacionTecnicaService.deleteUbicacion(id);
      await loadItems();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar: " + (err?.message || "Desconocido"));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Cargando ubicaciones…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ubicaciones Técnicas
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando{" "}
                <span className="font-semibold text-gray-900">
                  {filtered.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-gray-900">{items.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadItems}
              className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              disabled={loading}
              title="Actualizar"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Actualizar
            </button>

            <button
              onClick={openCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-1">Revisa tu backend / endpoint.</p>
            </div>
            <button
              onClick={loadItems}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cualquier campo (código, cliente, país, OV, sede, fechas, etc.)…"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1900px] w-full">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                <tr>
                  <Th>Código</Th>
                  <Th>Nombre</Th>

                  <Th>Cliente</Th>
                  <Th>clienteId</Th>
                  <Th>id_cliente</Th>

                  <Th>País</Th>
                  <Th>paisId</Th>

                  <Th>Tipo Propiedad</Th>

                  <Th>Número OV</Th>
                  <Th>Fecha OV</Th>

                  <Th>N° Orden Cliente</Th>
                  <Th>Fecha Orden Cliente</Th>

                  <Th>Sede</Th>
                  <Th>Almacén</Th>
                  <Th>Operador</Th>
                  <Th>ID Placa</Th>

                  <Th>Entrega Prevista</Th>
                  <Th>Entrega Real</Th>
                  <Th>Fin Garantía</Th>

                  <Th>Especialidad</Th>
                  <Th>Descripción</Th>

                  <Th>Creado</Th>
                  <Th>Actualizado</Th>

                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={24} className="text-center py-16 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No se encontraron registros</p>
                      <p className="text-sm mt-1">Prueba otro término de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <Td mono>{show(u.codigo)}</Td>
                      <Td strong>{show(u.nombre)}</Td>

                      <Td>{u?.cliente?.nombre || u?.cliente?.razonSocial || "—"}</Td>
                      <Td mono>{show(u.clienteId || u.ClienteId)}</Td>
                      <Td mono>{show(u.id_cliente)}</Td>

                      <Td>{u?.pais?.nombre || "—"}</Td>
                      <Td mono>{show(u.paisId)}</Td>

                      <Td>{show(u.tipoEquipoPropiedad)}</Td>

                      <Td>{show(u.numeroOV)}</Td>
                      <Td>{fmtDate(u.fechaOV)}</Td>

                      <Td>{show(u.numeroOrdenCliente)}</Td>
                      <Td>{fmtDate(u.fechaOrdenCliente)}</Td>

                      <Td>{show(u.sede)}</Td>
                      <Td>{show(u.almacen)}</Td>
                      <Td>{show(u.operadorLogistico)}</Td>
                      <Td>{show(u.idPlaca)}</Td>

                      <Td>{fmtDate(u.fechaEntregaPrevista)}</Td>
                      <Td>{fmtDate(u.fechaEntregaReal)}</Td>
                      <Td>{fmtDate(u.finGarantia)}</Td>

                      <Td>{show(u.especialidad)}</Td>
                      <Td clamp>{show(u.descripcion)}</Td>

                      <Td>{fmtDate(u.createdAt)}</Td>
                      <Td>{fmtDate(u.updatedAt)}</Td>

                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar"
                            disabled={busyId === u.id}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
              Mostrando{" "}
              <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
              de <span className="font-semibold text-gray-900">{items.length}</span>{" "}
              ubicaciones
            </div>
          )}
        </div>
      </div>

      <UbicacionTecnicaModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialData={editing}
      />
    </div>
  );
}

/* ===== table UI ===== */
function Th({ children, className = "" }) {
  return (
    <th
      className={[
        "text-left py-4 px-4 text-xs font-semibold text-gray-700 whitespace-nowrap",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({ children, mono, strong, clamp }) {
  return (
    <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
      <span
        className={[
          strong ? "font-semibold text-gray-900" : "",
          mono ? "font-mono" : "",
          clamp ? "inline-block max-w-[420px] truncate align-top" : "",
        ].join(" ")}
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </span>
    </td>
  );
}