import { useEffect, useState } from "react";
import {
  X,
  Building2,
  Loader2,
  AlertCircle,
  Plus,
  MapPin,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { sedeService } from "../Services/SedeServices";
import { equipoService } from "../../../features/mantenimiento/services/equipoService";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";
import CrearSedeModal from "./CrearSedeModal";
import SeleccionAdjuntosPortalModal from "./SeleccionAdjuntosPortalModal";

export default function GestionarSedeModal({ isOpen, onClose, cliente }) {
  const [sedes, setSedes] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSedeId, setSavingSedeId] = useState(null);
  const [error, setError] = useState(null);
  const [crearModalOpen, setCrearModalOpen] = useState(false);

  const [selecciones, setSelecciones] = useState({});


  const [modalAdjuntosOpen, setModalAdjuntosOpen] = useState(false);
const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
const [guardandoAdjuntos, setGuardandoAdjuntos] = useState(false);

  useEffect(() => {
    if (isOpen && cliente) {
      cargarTodo();
    }
  }, [isOpen, cliente]);

  const cargarTodo = async () => {
    setLoading(true);
    setError(null);

    try {
      const sedesRes = await sedeService.getSedesByClienteId(cliente.id);
      const equiposRes = await equipoService.getEquiposByClienteId(cliente.id);
      const ubicacionesRes = await UbicacionTecnicaService.getUbicacionesByClienteId(
        cliente.id
      );

      const sedesData = Array.isArray(sedesRes) ? sedesRes : [];
      const equiposData = Array.isArray(equiposRes) ? equiposRes : [];
      const ubicacionesData = Array.isArray(ubicacionesRes) ? ubicacionesRes : [];

      setSedes(sedesData);
      setEquiposDisponibles(equiposData);
      setUbicacionesDisponibles(ubicacionesData);

      const inicial = {};
      for (const sede of sedesData) {
        inicial[sede.id] = {
          equipoIds: [],
          ubicacionIds: [],
        };
      }
      setSelecciones(inicial);
    } catch (err) {
      console.error("ERROR REAL EN cargarTodo:", err);
      console.error("RESPUESTA BACK:", err.response?.data);
      console.error("STATUS:", err.response?.status);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "No se pudo cargar la información de sedes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (sedeId, type, itemId) => {
    setSelecciones((prev) => {
      const actuales = prev[sedeId]?.[type] || [];
      const existe = actuales.includes(itemId);

      return {
        ...prev,
        [sedeId]: {
          ...prev[sedeId],
          [type]: existe
            ? actuales.filter((id) => id !== itemId)
            : [...actuales, itemId],
        },
      };
    });
  };

  const asignarEquipos = async (sedeId) => {
    const equipoIds = selecciones[sedeId]?.equipoIds || [];

    if (equipoIds.length === 0) {
      alert("Selecciona al menos un equipo.");
      return;
    }

    setSavingSedeId(sedeId);
    try {
      await sedeService.asignarEquipos(sedeId, { equipoIds });
      await cargarTodo();
      alert("Equipos asignados correctamente.");
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "No se pudieron asignar los equipos.");
    } finally {
      setSavingSedeId(null);
    }
  };

  const asignarUbicaciones = async (sedeId) => {
    const ubicacionIds = selecciones[sedeId]?.ubicacionIds || [];

    if (ubicacionIds.length === 0) {
      alert("Selecciona al menos una ubicación técnica.");
      return;
    }

    setSavingSedeId(sedeId);
    try {
      await sedeService.asignarUbicacionesTecnicas(sedeId, { ubicacionIds });
      await cargarTodo();
      alert("Ubicaciones técnicas asignadas correctamente.");
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "No se pudieron asignar las ubicaciones."
      );
    } finally {
      setSavingSedeId(null);
    }
  };


  const abrirModalAdjuntos = (equipo) => {
  setEquipoSeleccionado(equipo);
  setModalAdjuntosOpen(true);
};

const cerrarModalAdjuntos = () => {
  setModalAdjuntosOpen(false);
  setEquipoSeleccionado(null);
};

const guardarAdjuntosPortal = async (adjuntosPortal) => {
  if (!equipoSeleccionado?.id) return;

  setGuardandoAdjuntos(true);
  try {
    await equipoService.actualizarAdjuntosPortal(
      equipoSeleccionado.id,
      adjuntosPortal
    );

    await cargarTodo();
    cerrarModalAdjuntos();
    alert("Archivos del portal actualizados correctamente.");
  } catch (err) {
    alert(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudieron guardar los archivos del portal."
    );
  } finally {
    setGuardandoAdjuntos(false);
  }
};

  if (!isOpen || !cliente) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl flex flex-col max-h-[92vh] border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="text-gray-600" size={18} />
                Gestión de Sedes
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Cliente: <b>{cliente.razonSocial}</b>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCrearModalOpen(true)}
                className="px-3 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-black flex items-center gap-2"
                type="button"
              >
                <Plus size={14} />
                Crear sede
              </button>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Cargando sedes, equipos y ubicaciones...
                </p>
              </div>
            ) : sedes.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                Este cliente aún no tiene sedes registradas.
              </div>
            ) : (
              <div className="space-y-4">
                {sedes.map((sede) => {
                  const equipoIdsAsignados = new Set((sede.equipos || []).map((e) => e.id));
                  const ubicacionIdsAsignadas = new Set(
                    (sede.ubicacionesTecnicas || []).map((u) => u.id)
                  );

                  const equiposLibres = equiposDisponibles.filter(
                    (e) => !e.sedeId || e.sedeId === sede.id
                  );

                  const ubicacionesLibres = ubicacionesDisponibles.filter(
                    (u) => !u.sedeId || u.sedeId === sede.id
                  );

                  return (
                    <div
                      key={sede.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white"
                    >
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {sede.nombre}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {sede.direccion || "Sin dirección"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Wrench className="w-4 h-4 text-gray-500" />
                            <h5 className="text-sm font-semibold text-gray-800">
                              Asignar equipos
                            </h5>
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-2">
                            {equiposLibres.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                No hay equipos disponibles.
                              </p>
                            ) : (
                              equiposLibres.map((equipo) => (
                                <label
                                  key={equipo.id}
                                  className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-200 bg-white"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {equipo.nombre}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                      Serie: {equipo.serie || "-"}
                                    </p>
                                  </div>

                                  {equipoIdsAsignados.has(equipo.id) ? (
                                    <span className="text-[11px] px-2 py-1 rounded bg-gray-200 text-gray-700">
                                      Asignado
                                    </span>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={
                                        selecciones[sede.id]?.equipoIds?.includes(equipo.id) || false
                                      }
                                      onChange={() =>
                                        handleCheck(sede.id, "equipoIds", equipo.id)
                                      }
                                    />
                                  )}
                                </label>
                              ))
                            )}
                          </div>

                          <button
                            onClick={() => asignarEquipos(sede.id)}
                            disabled={savingSedeId === sede.id}
                            className="mt-3 px-3 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2"
                            type="button"
                          >
                            {savingSedeId === sede.id && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            Guardar equipos
                          </button>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <h5 className="text-sm font-semibold text-gray-800">
                              Asignar ubicaciones técnicas
                            </h5>
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-2">
                            {ubicacionesLibres.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                No hay ubicaciones técnicas disponibles.
                              </p>
                            ) : (
                              ubicacionesLibres.map((ubicacion) => (
                                <label
                                  key={ubicacion.id}
                                  className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-200 bg-white"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {ubicacion.nombre || ubicacion.codigo || "Sin nombre"}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                      Código: {ubicacion.codigo || "-"}
                                    </p>
                                  </div>

                                  {ubicacionIdsAsignadas.has(ubicacion.id) ? (
                                    <span className="text-[11px] px-2 py-1 rounded bg-gray-200 text-gray-700 flex items-center gap-1">
                                      <CheckCircle2 size={12} />
                                      Asignado
                                    </span>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={
                                        selecciones[sede.id]?.ubicacionIds?.includes(ubicacion.id) || false
                                      }
                                      onChange={() =>
                                        handleCheck(sede.id, "ubicacionIds", ubicacion.id)
                                      }
                                    />
                                  )}
                                </label>
                              ))
                            )}
                          </div>

                          <button
                            onClick={() => asignarUbicaciones(sede.id)}
                            disabled={savingSedeId === sede.id}
                            className="mt-3 px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
                            type="button"
                          >
                            {savingSedeId === sede.id && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            Guardar ubicaciones
                          </button>
                        </div>
                      </div>

                     <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
  <h6 className="text-sm font-semibold text-gray-800 mb-2">
    Equipos asignados
  </h6>

  {(sede.equipos || []).length === 0 ? (
    <p className="text-sm text-gray-500">
      Sin equipos asignados.
    </p>
  ) : (
    <div className="space-y-2">
      {sede.equipos.map((equipo) => {
        const cantidadAdjuntosPortal = Array.isArray(equipo?.adjuntos)
          ? equipo.adjuntos.filter((adj) => adj?.mostrarEnPortal === true).length
          : 0;

        return (
          <div
            key={equipo.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {equipo.nombre}
              </p>
              <p className="text-[11px] text-gray-500">
                {equipo.serie ? `Serie: ${equipo.serie}` : "Sin serie"} ·{" "}
                {cantidadAdjuntosPortal} archivo(s) en portal
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirModalAdjuntos(equipo)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              Archivos portal
            </button>
          </div>
        );
      })}
    </div>
  )}
</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <CrearSedeModal
        isOpen={crearModalOpen}
        onClose={() => setCrearModalOpen(false)}
        cliente={cliente}
        onCreated={async () => {
          setCrearModalOpen(false);
          await cargarTodo();
        }}
      />

      <SeleccionAdjuntosPortalModal
  isOpen={modalAdjuntosOpen}
  onClose={cerrarModalAdjuntos}
  equipo={equipoSeleccionado}
  onGuardar={guardarAdjuntosPortal}
  guardando={guardandoAdjuntos}
/>
    </>
  );
}