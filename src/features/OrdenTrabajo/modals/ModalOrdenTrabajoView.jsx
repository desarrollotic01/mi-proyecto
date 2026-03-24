import { useEffect, useMemo, useState } from "react";
import {
  X,
  FileText,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  Users,
  Star,
  ShoppingCart,
  Boxes,
  Loader2,
  Edit,
  RefreshCw,
} from "lucide-react";

import { getSolicitudesTratamientoPorOrdenTrabajo } from "../../mantenimiento/services/ordenTrabajoService";
import { equipoService } from "../../mantenimiento/services/equipoService";
import ModalSolicitudCompra from "../../../components/inputs/ModalSolicitudCompra";
import ModalSolicitudAlmacen from "../../../components/inputs/ModalSolicitudAlmacen";
import { createSolicitudCompra } from "../../OrdenTrabajo/services/SolicitudCompraService";
import { createSolicitudAlmacen } from "../../OrdenTrabajo/services/solicitudAlmacenService";
import { updateOrdenTrabajoCompleta } from "../../mantenimiento/services/ordenTrabajoService";
import ModalOTGrupal from "../Modalotgrupal";

/* ══════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════ */

// Columnas de la tabla de actividades
const ACT_COLS = "32px 0.7fr 0.7fr 0.7fr 1.2fr 0.9fr 0.9fr 60px 70px 60px 90px";

const ESTADO_SOL_COLOR = {
  DRAFT:     "bg-amber-50  border-amber-200  text-amber-700",
  PENDIENTE: "bg-sky-50    border-sky-200    text-sky-700",
  ENVIADO:   "bg-violet-50 border-violet-200 text-violet-700",
  APROBADO:  "bg-emerald-50 border-emerald-200 text-emerald-700",
  RECHAZADO: "bg-red-50    border-red-200    text-red-700",
};

const ACT_ESTADO_COLOR = {
  PENDIENTE:  "bg-amber-50  text-amber-700  border-amber-200",
  EN_PROCESO: "bg-sky-50    text-sky-700    border-sky-200",
  COMPLETADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELADO:  "bg-red-50    text-red-700    border-red-200",
};

/* ══════════════════════════════════════════
   ACTIVIDADES — HEADER
══════════════════════════════════════════ */
function ActividadesHeader() {
  return (
    <div
      className="grid items-center gap-1 mb-1 px-3 py-2 bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 uppercase tracking-wide"
      style={{ gridTemplateColumns: ACT_COLS }}
    >
      <span>#</span>
      <span>Sistema</span>
      <span>Subsistema</span>
      <span>Componente</span>
      <span>Tarea</span>
      <span>Tipo trabajo</span>
      <span>Rol técnico</span>
      <span className="text-center">Tec.</span>
      <span className="text-center">Dur.</span>
      <span className="text-center">Und.</span>
      <span className="text-center">Estado</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   ACTIVIDADES — FILA
══════════════════════════════════════════ */
function ActividadFila({ act, idx }) {
  const esPlan = act.origen === "PLAN";
  const cell = "w-full px-2 py-1.5 border border-slate-100 rounded-lg bg-slate-50 text-xs text-slate-700 truncate";

  return (
    <div
      className={`grid items-center gap-1 px-3 py-1.5 border rounded-xl mb-1 transition-colors ${
        esPlan
          ? "border-slate-100 bg-white hover:bg-slate-50"
          : "border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50"
      }`}
      style={{ gridTemplateColumns: ACT_COLS }}
    >
      <span className="text-xs text-slate-400 font-semibold text-center">{idx + 1}</span>
      <div className={cell} title={act.sistema}>{act.sistema || "—"}</div>
      <div className={cell} title={act.subsistema}>{act.subsistema || "—"}</div>
      <div className={cell} title={act.componente}>{act.componente || "—"}</div>
      <div className={`${cell} font-medium text-slate-900`} title={act.tarea}>{act.tarea || "—"}</div>
      <div className={cell}>{act.tipoTrabajo ? act.tipoTrabajo.replace(/_/g, " ") : "—"}</div>
      <div className={cell}>{act.rolTecnico ? act.rolTecnico.replace(/_/g, " ") : "—"}</div>
      <div className={`${cell} text-center`}>{act.cantidadTecnicos ?? "—"}</div>
      <div className={`${cell} text-center`}>{act.duracionEstimadaValor ?? "—"}</div>
      <div className={`${cell} text-center`}>{act.unidadDuracion || "—"}</div>
      <span
        className={`text-xs px-2 py-1 rounded-lg border font-medium text-center ${
          ACT_ESTADO_COLOR[act.estado] || "bg-slate-50 text-slate-500 border-slate-200"
        }`}
      >
        {act.estado || "—"}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   SOLICITUD CARD
══════════════════════════════════════════ */
function SolicitudCard({ solicitud, tipo, equipoLabel, puedeSync, onSync }) {
  const lineas    = Array.isArray(solicitud?.lineas) ? solicitud.lineas : [];
  const estadoCls = ESTADO_SOL_COLOR[solicitud?.estado?.toUpperCase()] || "bg-slate-50 border-slate-200 text-slate-700";
  // Solicitudes creadas desde la OT tienen ordenTrabajoId
  const esDesdeOT = !!solicitud?.ordenTrabajoId;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${esDesdeOT ? "bg-violet-50/40 border-violet-200" : "bg-white border-slate-200"}`}>

      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${solicitud.esGeneral ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
              {solicitud.esGeneral ? "General" : "Específica"}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold border bg-white text-slate-700 border-slate-200">
              {tipo === "compra" ? "Compra" : "Almacén"}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${estadoCls}`}>
              {solicitud.estado || "—"}
            </span>
            {esDesdeOT && (
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold border bg-violet-100 text-violet-700 border-violet-200">
                Desde OT
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {solicitud.esGeneral ? "Solicitud general de la orden" : `Pertenece a ${equipoLabel}`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {puedeSync && (
            <button
              onClick={() => onSync?.(solicitud)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync → SAP
            </button>
          )}
          <div className="text-xs text-slate-500 text-right space-y-0.5">
            <p><span className="font-medium text-slate-700">Nº:</span> {solicitud.numeroSolicitud || solicitud.docNum || "—"}</p>
            <p><span className="font-medium text-slate-700">Fecha:</span> {solicitud.docDate || solicitud.createdAt?.slice(0, 10) || "—"}</p>
          </div>
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div><p className="text-xs text-slate-500 font-medium">Departamento</p><p>{solicitud.department || "—"}</p></div>
        <div><p className="text-xs text-slate-500 font-medium">Solicitante</p><p>{solicitud.requester || "—"}</p></div>
        <div><p className="text-xs text-slate-500 font-medium">Fecha requerida</p><p>{solicitud.requiredDate || "—"}</p></div>
        <div className="col-span-2 md:col-span-3"><p className="text-xs text-slate-500 font-medium">Comentarios</p><p>{solicitud.comments || "—"}</p></div>
      </div>

      {/* Líneas */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">Líneas ({lineas.length})</p>
        {lineas.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-xs border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-slate-600 font-semibold">
                  <th className="text-left p-2 border-b whitespace-nowrap">Item</th>
                  <th className="text-left p-2 border-b min-w-[200px]">Descripción</th>
                  <th className="text-left p-2 border-b whitespace-nowrap">Cant.</th>
                  <th className="text-left p-2 border-b whitespace-nowrap">Almacén</th>
                  <th className="text-left p-2 border-b whitespace-nowrap">C. Costo</th>
                  <th className="text-left p-2 border-b whitespace-nowrap">Proyecto</th>
                  <th className="text-left p-2 border-b whitespace-nowrap">Rubro</th>
                  <th className="text-left p-2 border-b whitespace-nowrap">Paquete</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => (
                  <tr key={l.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-2 border-b whitespace-nowrap font-medium">{l.itemCode || "—"}</td>
                    <td className="p-2 border-b">{l.description || "—"}</td>
                    <td className="p-2 border-b whitespace-nowrap">{l.quantity ?? "—"}</td>
                    <td className="p-2 border-b whitespace-nowrap">{l.warehouseCode || "—"}</td>
                    <td className="p-2 border-b whitespace-nowrap">{l.costingCode || "—"}</td>
                    <td className="p-2 border-b whitespace-nowrap">{l.projectCode || "—"}</td>
                    <td className="p-2 border-b whitespace-nowrap">{l.rubroSapCode || l.rubro || "—"}</td>
                    <td className="p-2 border-b whitespace-nowrap">{l.paqueteTrabajo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 border border-slate-200 rounded-lg bg-slate-50 p-3">Sin líneas.</p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
export default function ModalOrdenTrabajoView({
  isOpen,
  orden,
  onClose,
  onUpdateEstado,
  onLiberar,
  onAbrirCierreTecnico,
  onOrdenActualizada,
}) {
  const [tab, setTab] = useState("informacion");
  const [detalleSolicitudes, setDetalleSolicitudes] = useState(null);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState("");
  const [openSolicitudCompra, setOpenSolicitudCompra] = useState(false);
  const [openSolicitudAlmacen, setOpenSolicitudAlmacen] = useState(false);
  const [targetSeleccionado, setTargetSeleccionado] = useState(null);
  const [equiposDetalleMap, setEquiposDetalleMap] = useState({});
  const [loadingEquiposDetalle, setLoadingEquiposDetalle] = useState(false);
  const [openEditarOT, setOpenEditarOT] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const estadoActual = orden?.estado || "";
  const esLiberado   = estadoActual === "LIBERADO";

  const recargarSolicitudes = async () => {
    if (!orden?.id) return;
    try {
      setLoadingSolicitudes(true);
      setErrorSolicitudes("");
      const r = await getSolicitudesTratamientoPorOrdenTrabajo(orden.id);
      setDetalleSolicitudes(r?.data || null);
    } catch {
      setErrorSolicitudes("No se pudo cargar la información de solicitudes.");
      setDetalleSolicitudes(null);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  useEffect(() => {
    if ((tab === "solicitudes" || tab === "informacion") && isOpen && orden?.id) {
      recargarSolicitudes();
    }
  }, [isOpen, orden?.id, tab]);

  useEffect(() => {
    const cargar = async () => {
      if (!isOpen || !orden?.equipos?.length) return;
      try {
        setLoadingEquiposDetalle(true);
        const results = await Promise.all(
          orden.equipos.filter((eq) => !!eq.equipoId).map(async (eq) => {
            try {
              const r = await equipoService.getEquipoById(eq.equipoId);
              return { equipoId: eq.equipoId, data: r?.data || r || null };
            } catch { return { equipoId: eq.equipoId, data: null }; }
          })
        );
        const map = {};
        results.forEach((item) => { map[item.equipoId] = item.data; });
        setEquiposDetalleMap(map);
      } catch { setEquiposDetalleMap({}); }
      finally { setLoadingEquiposDetalle(false); }
    };
    cargar();
  }, [isOpen, orden]);

  /* ── Helpers ── */
  const fmt      = (v) => (v === null || v === undefined || v === "" ? "—" : v);
  const fmtFecha = (f) => {
    if (!f) return "—";
    const d = new Date(f);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const tonosEquipo = [
    { card: "bg-sky-50 border-sky-200",       header: "bg-sky-100 border-sky-200 text-sky-900",         badge: "bg-sky-100 text-sky-700 border-sky-200",         section: "bg-white border-sky-100" },
    { card: "bg-emerald-50 border-emerald-200", header: "bg-emerald-100 border-emerald-200 text-emerald-900", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", section: "bg-white border-emerald-100" },
    { card: "bg-violet-50 border-violet-200", header: "bg-violet-100 border-violet-200 text-violet-900",   badge: "bg-violet-100 text-violet-700 border-violet-200",   section: "bg-white border-violet-100" },
    { card: "bg-amber-50 border-amber-200",   header: "bg-amber-100 border-amber-200 text-amber-900",     badge: "bg-amber-100 text-amber-700 border-amber-200",     section: "bg-white border-amber-100" },
  ];
  const getTono = (i) => tonosEquipo[i % tonosEquipo.length];

  const estadoOTColor = {
    CREADO:         "bg-slate-100 text-slate-700 border-slate-300",
    LIBERADO:       "bg-violet-50 text-violet-700 border-violet-200",
    CIERRE_TECNICO: "bg-amber-50 text-amber-700 border-amber-200",
    CERRADO:        "bg-green-50 text-green-700 border-green-200",
    FINALIZADO:     "bg-green-50 text-green-700 border-green-200",
    EN_PROCESO:     "bg-amber-50 text-amber-700 border-amber-200",
    CANCELADO:      "bg-red-50 text-red-700 border-red-200",
  };

  const solicitudesCompra  = detalleSolicitudes?.solicitudesCompra  || { generales: [], especificas: [] };
  const solicitudesAlmacen = detalleSolicitudes?.solicitudesAlmacen || { generales: [], especificas: [], lineasAgrupadasSap: [] };
  const tratamiento        = detalleSolicitudes?.tratamiento || null;

  const contextoOt = useMemo(() => ({
    tratamiento_id: orden?.tratamientoId || null,
    ordenTrabajoId: orden?.id || null,
    targets: (orden?.equipos || []).map((eq) => ({
      id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id),
      type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA",
      nombre: eq.equipo?.nombre || eq.ubicacionTecnica?.nombre || "Objetivo",
      tag: eq.equipo?.codigo || eq.ubicacionTecnica?.codigo || "—",
      equipoId: eq.equipoId || null,
      ubicacionTecnicaId: eq.ubicacionTecnicaId || null,
    })),
  }), [orden]);

  const getEquipoDetalle  = (eq) => (eq?.equipoId ? equiposDetalleMap[eq.equipoId] || null : null);
  const getNombreObj      = (eq) => getEquipoDetalle(eq)?.nombre || eq.equipo?.nombre || eq.ubicacionTecnica?.nombre || "Objetivo";
  const getCodigoObj      = (eq) => getEquipoDetalle(eq)?.codigo || eq.equipo?.codigo || eq.ubicacionTecnica?.codigo || "—";
  const getTipoObj        = (eq) => getEquipoDetalle(eq)?.tipoEquipo || eq.equipo?.tipoEquipo || (eq.ubicacionTecnicaId ? "Ubicación técnica" : "Equipo");
  const getEncargado      = (eq) => (eq.trabajadores || []).find((t) => t.esEncargado)?.trabajador || null;

  const getSolCompraEquipo  = (eq) => (solicitudesCompra.especificas || []).filter((s) => (eq.equipoId && String(s.equipo_id) === String(eq.equipoId)) || (eq.ubicacionTecnicaId && String(s.ubicacion_tecnica_id) === String(eq.ubicacionTecnicaId)));
  const getSolAlmacenEquipo = (eq) => (solicitudesAlmacen.especificas || []).filter((s) => (eq.equipoId && String(s.equipo_id) === String(eq.equipoId)) || (eq.ubicacionTecnicaId && String(s.ubicacion_tecnica_id) === String(eq.ubicacionTecnicaId)));

  const getEquipoLabelBySolicitud = (sol) => {
    if (!sol) return "—";
    if (sol.equipo_id) {
      const d = equiposDetalleMap[sol.equipo_id];
      if (d) return `${d.nombre || "Equipo"} · ${d.codigo || "—"}`;
      const eq = (orden?.equipos || []).find((e) => String(e.equipoId) === String(sol.equipo_id));
      if (eq) return `${eq.equipo?.nombre || "Equipo"} · ${eq.equipo?.codigo || "—"}`;
      return "Equipo específico";
    }
    if (sol.ubicacion_tecnica_id) {
      const ut = (orden?.equipos || []).find((e) => String(e.ubicacionTecnicaId) === String(sol.ubicacion_tecnica_id));
      return ut ? `${ut.ubicacionTecnica?.nombre || "Ubicación técnica"} · ${ut.ubicacionTecnica?.codigo || "—"}` : "Ubicación técnica específica";
    }
    return sol.esGeneral ? "General para la orden" : "—";
  };

  const buildPayloadBase = (ctx, solicitud, extra = {}) => ({
    tratamiento_id: ctx?.tratamiento_id || null,
    ordenTrabajoId: ctx?.ordenTrabajoId || null,
    esGeneral: !!extra.esGeneral,
    equipo_id: extra.equipo_id || null,
    ubicacion_tecnica_id: extra.ubicacion_tecnica_id || null,
    department: solicitud?.department || "",
    requester: solicitud?.requester || solicitud?.email || "",
    email: solicitud?.email || solicitud?.requester || "",
    requiredDate: solicitud?.requiredDate || "",
    comments: solicitud?.comments || "",
    lineas: (solicitud?.lineas || []).map((l) => ({
      itemId: l.itemId || null, itemCode: l.itemCode || "", description: l.description || "",
      quantity: Number(l.quantity) || 1, warehouseCode: l.warehouseCode || "",
      costingCode: l.costingCode || l.costCenter || "", projectCode: l.projectCode || "",
      rubro: l.rubro || "", rubroSapCode: l.rubroSapCode || "", paqueteTrabajo: l.paqueteTrabajo || "",
    })),
  });

  const tieneLineasValidas = (sol) =>
    Array.isArray(sol?.lineas) && sol.lineas.some((l) => (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0);

  const handleLiberarOrden = async () => { try { await onLiberar?.(orden.id); onClose?.(); } catch {} };
  const handleAbrirCierre  = async () => { try { await onAbrirCierreTecnico?.(orden); onClose?.(); } catch {} };
  const handleCambiarEstado = async (s) => { try { await onUpdateEstado?.(orden.id, s); onClose?.(); } catch {} };
  const handleSyncSAP = (sol) => { alert(`Sync → SAP para solicitud ${sol.numeroSolicitud || sol.id}`); };

  const handleEditarOT = async (payload) => {
    try {
      setGuardandoEdicion(true);
      const r = await updateOrdenTrabajoCompleta(orden.id, payload);
      setOpenEditarOT(false);
      if (typeof onOrdenActualizada === "function") await onOrdenActualizada(r?.data || r);
      onClose?.();
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "No se pudo actualizar la OT");
    } finally { setGuardandoEdicion(false); }
  };

  const handleConfirmSolicitudCompra = async (data) => {
    try {
      const { contextoOt: ctx, solicitudGeneral, solicitudesPorEquipo } = data;
      const reqs = [];
      if (tieneLineasValidas(solicitudGeneral)) reqs.push(createSolicitudCompra(buildPayloadBase(ctx, solicitudGeneral, { esGeneral: true })));
      Object.values(solicitudesPorEquipo || {}).forEach((sol) => {
        if (!tieneLineasValidas(sol)) return;
        const tm = sol?.targetMeta || {};
        reqs.push(createSolicitudCompra(buildPayloadBase(ctx, sol, { esGeneral: false, equipo_id: tm.equipo_id || null, ubicacion_tecnica_id: tm.ubicacion_tecnica_id || null })));
      });
      await Promise.all(reqs);
      setOpenSolicitudCompra(false); setTargetSeleccionado(null); await recargarSolicitudes();
    } catch (error) { alert(error?.response?.data?.message || error?.message || "Error creando solicitudes de compra"); }
  };

  const handleConfirmSolicitudAlmacen = async (data) => {
    try {
      const { contextoOt: ctx, solicitudGeneral, solicitudesPorEquipo } = data;
      const reqs = [];
      if (tieneLineasValidas(solicitudGeneral)) reqs.push(createSolicitudAlmacen(buildPayloadBase(ctx, solicitudGeneral, { esGeneral: true })));
      Object.values(solicitudesPorEquipo || {}).forEach((sol) => {
        if (!tieneLineasValidas(sol)) return;
        const tm = sol?.targetMeta || {};
        reqs.push(createSolicitudAlmacen(buildPayloadBase(ctx, sol, { esGeneral: false, equipo_id: tm.equipo_id || null, ubicacion_tecnica_id: tm.ubicacion_tecnica_id || null })));
      });
      await Promise.all(reqs);
      setOpenSolicitudAlmacen(false); setTargetSeleccionado(null); await recargarSolicitudes();
    } catch (error) { alert(error?.response?.data?.message || error?.message || "Error creando solicitudes de almacén"); }
  };

  const abrirCompraParaEquipo  = (eq) => { setTargetSeleccionado({ id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id), type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA", nombre: getNombreObj(eq), tag: getCodigoObj(eq), equipoId: eq.equipoId || null, ubicacionTecnicaId: eq.ubicacionTecnicaId || null }); setOpenSolicitudCompra(true); };
  const abrirAlmacenParaEquipo = (eq) => { setTargetSeleccionado({ id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id), type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA", nombre: getNombreObj(eq), tag: getCodigoObj(eq), equipoId: eq.equipoId || null, ubicacionTecnicaId: eq.ubicacionTecnicaId || null }); setOpenSolicitudAlmacen(true); };

  const renderActionButtons = () => (
    <div className="flex gap-2 flex-wrap justify-end">
      <button onClick={() => setOpenEditarOT(true)} disabled={guardandoEdicion} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
        <Edit className="w-4 h-4" />{guardandoEdicion ? "Guardando..." : "Editar"}
      </button>
      {estadoActual === "CREADO" && (<>
        <button onClick={handleLiberarOrden} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors">Liberar</button>
        <button onClick={() => handleCambiarEstado("CANCELADO")} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors">Cancelar</button>
      </>)}
      {estadoActual === "LIBERADO" && (<>
        <button onClick={handleAbrirCierre} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">Cierre Técnico</button>
        <button onClick={() => handleCambiarEstado("CANCELADO")} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors">Cancelar</button>
      </>)}
      {estadoActual === "CIERRE_TECNICO" && (
        <button onClick={() => handleCambiarEstado("CERRADO")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors">Cerrar OT</button>
      )}
    </div>
  );

  if (!isOpen || !orden) return null;

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-[95vw] rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">

          {/* Header */}
          <div className="border-b border-slate-200 px-5 py-4 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5" />Orden de Trabajo</h2>
                <p className="text-sm text-slate-500 mt-0.5">{fmt(orden.numeroOT)}</p>
              </div>
              <div className="flex flex-col items-end gap-3 ml-auto">
                <span className={`px-3 py-1 rounded-md border text-xs font-semibold ${estadoOTColor[orden.estado] || "bg-slate-100 text-slate-700 border-slate-300"}`}>{fmt(orden.estado)}</span>
                {renderActionButtons()}
              </div>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-700" /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 bg-white px-5 py-3 flex gap-2">
            {[["informacion", "Información OT"], ["solicitudes", "Solicitudes"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`px-3 py-1.5 rounded-md text-sm border transition ${tab === key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">

            {/* ════ TAB: INFORMACIÓN ════ */}
            {tab === "informacion" && (<>

              {/* Info general */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-slate-600" />Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="md:col-span-2"><p className="text-slate-500 font-medium">Descripción</p><p>{fmt(orden.descripcionGeneral)}</p></div>
                  <div><p className="text-slate-500 font-medium">Inicio Programado</p><p>{fmtFecha(orden.fechaProgramadaInicio)}</p></div>
                  <div><p className="text-slate-500 font-medium">Fin Programado</p><p>{fmtFecha(orden.fechaProgramadaFin)}</p></div>
                  <div className="md:col-span-2"><p className="text-slate-500 font-medium">Observaciones</p><p>{fmt(orden.observaciones)}</p></div>
                </div>
              </div>

              {/* Solicitudes generales */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-slate-600" />Solicitudes Generales de la Orden</h3>
                <div className="space-y-4">
                  {/* Compra general */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-slate-800">Solicitud de compra general</h4>
                      <span className="text-xs text-slate-500">{(solicitudesCompra.generales || []).length} registros</span>
                    </div>
                    {(solicitudesCompra.generales || []).length > 0 ? (
                      <div className="space-y-3">{solicitudesCompra.generales.map((sol) => <SolicitudCard key={sol.id} solicitud={sol} tipo="compra" equipoLabel="General para toda la orden" puedeSync={esLiberado} onSync={handleSyncSAP} />)}</div>
                    ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-white p-3">No hay solicitud de compra general.</p>}
                  </div>
                  {/* Almacén general */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-slate-800">Solicitud de almacén general</h4>
                      <span className="text-xs text-slate-500">{(solicitudesAlmacen.generales || []).length} registros</span>
                    </div>
                    {(solicitudesAlmacen.generales || []).length > 0 ? (
                      <div className="space-y-3">{solicitudesAlmacen.generales.map((sol) => <SolicitudCard key={sol.id} solicitud={sol} tipo="almacen" equipoLabel="General para toda la orden" puedeSync={esLiberado} onSync={handleSyncSAP} />)}</div>
                    ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-white p-3">No hay solicitud de almacén general.</p>}
                  </div>
                </div>
              </div>

              {/* Resumen por equipo */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-slate-600" />Resumen por Equipo ({orden.equipos?.length || 0})</h3>
                <div className="space-y-4">
                  {(orden.equipos || []).map((eq, index) => {
                    const tono         = getTono(index);
                    const nombreEquipo = getNombreObj(eq);
                    const codigoEquipo = getCodigoObj(eq);
                    const tipoEquipo   = getTipoObj(eq);
                    const encargado    = getEncargado(eq);
                    const solCompra    = getSolCompraEquipo(eq);
                    const solAlmacen   = getSolAlmacenEquipo(eq);

                    return (
                      <div key={eq.id} className={`border rounded-2xl p-4 ${tono.card}`}>
                        {/* Cabecera equipo */}
                        <div className={`rounded-xl border px-4 py-3 mb-4 flex flex-wrap items-start justify-between gap-3 ${tono.header}`}>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Equipo {index + 1}</p>
                            <p className="font-bold text-lg">{fmt(nombreEquipo)}</p>
                            <p className="text-sm opacity-90">{fmt(codigoEquipo)} · {fmt(tipoEquipo)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${tono.badge}`}>Estado: {fmt(eq.estadoEquipo)}</span>
                            <span className="text-xs px-2.5 py-1 rounded-md border bg-white/80 text-slate-700 border-white/70">Prioridad: {fmt(eq.prioridad)}</span>
                          </div>
                        </div>

                        {/* Detalle equipo */}
                        {eq.equipoId && (
                          <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                            <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-slate-500" />Detalle del equipo</h4>
                            {loadingEquiposDetalle ? (
                              <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div><p className="text-slate-500 font-medium">Nombre</p><p>{fmt(getEquipoDetalle(eq)?.nombre)}</p></div>
                                <div><p className="text-slate-500 font-medium">Código</p><p>{fmt(getEquipoDetalle(eq)?.codigo)}</p></div>
                                <div><p className="text-slate-500 font-medium">Tipo</p><p>{fmt(getEquipoDetalle(eq)?.tipoEquipo)}</p></div>
                                <div><p className="text-slate-500 font-medium">Marca</p><p>{fmt(getEquipoDetalle(eq)?.marca)}</p></div>
                                <div><p className="text-slate-500 font-medium">Modelo</p><p>{fmt(getEquipoDetalle(eq)?.modelo)}</p></div>
                                <div><p className="text-slate-500 font-medium">Serie</p><p>{fmt(getEquipoDetalle(eq)?.serie)}</p></div>
                                <div><p className="text-slate-500 font-medium">Inicio programado</p><p>{fmtFecha(eq.fechaInicioProgramada)}</p></div>
                                <div><p className="text-slate-500 font-medium">Fin programado</p><p>{fmtFecha(eq.fechaFinProgramada)}</p></div>
                                <div><p className="text-slate-500 font-medium">Plan</p><p>{fmt(eq.planMantenimiento?.nombre)}</p></div>
                                <div><p className="text-slate-500 font-medium">Encargado</p><p>{encargado ? `${fmt(encargado.nombre)} ${fmt(encargado.apellido)}` : "—"}</p></div>
                                <div className="md:col-span-3"><p className="text-slate-500 font-medium">Descripción del trabajo</p><p>{fmt(eq.descripcionEquipo)}</p></div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── ACTIVIDADES — MODO LISTA ── */}
                        <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                          <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-slate-500" />
                            Actividades ({eq.actividades?.length || 0})
                          </h4>
                          {eq.actividades?.length > 0 ? (
                            <div style={{ overflowX: "auto" }}>
                              <ActividadesHeader />
                              {[...(eq.actividades || [])]
                                .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                                .map((act, idx) => <ActividadFila key={act.id || idx} act={act} idx={idx} />)}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin actividades.</p>
                          )}
                        </div>

                        {/* Trabajadores */}
                        <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                          <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" />Trabajadores ({eq.trabajadores?.length || 0})</h4>
                          {eq.trabajadores?.length > 0 ? (
                            <div className="space-y-2">
                              {eq.trabajadores.map((t) => {
                                const tr = t.trabajador || {};
                                return (
                                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div>
                                      <p className="font-medium text-slate-900">{fmt(tr.nombre)} {fmt(tr.apellido)}</p>
                                      <p className="text-xs text-slate-500">{fmt(tr.rol ? tr.rol.replaceAll("_", " ") : "—")} · {fmt(tr.empresa)}</p>
                                    </div>
                                    {t.esEncargado && <span className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md"><Star className="w-3 h-3" />Encargado</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin trabajadores.</p>}
                        </div>

                        {/* Solicitud compra del equipo */}
                        <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-slate-500" />Solicitud de compra</h4>
                            {esLiberado && <button onClick={() => abrirCompraParaEquipo(eq)} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50">+ Agregar</button>}
                          </div>
                          {solCompra.length > 0 ? (
                            <div className="space-y-3">{solCompra.map((sol) => <SolicitudCard key={sol.id} solicitud={sol} tipo="compra" equipoLabel={nombreEquipo} puedeSync={esLiberado} onSync={handleSyncSAP} />)}</div>
                          ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin solicitud de compra específica.</p>}
                        </div>

                        {/* Solicitud almacén del equipo */}
                        <div className={`rounded-xl border p-4 ${tono.section}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><Boxes className="w-4 h-4 text-slate-500" />Solicitud de almacén</h4>
                            {esLiberado && <button onClick={() => abrirAlmacenParaEquipo(eq)} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50">+ Agregar</button>}
                          </div>
                          {solAlmacen.length > 0 ? (
                            <div className="space-y-3">{solAlmacen.map((sol) => <SolicitudCard key={sol.id} solicitud={sol} tipo="almacen" equipoLabel={nombreEquipo} puedeSync={esLiberado} onSync={handleSyncSAP} />)}</div>
                          ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin solicitud de almacén específica.</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fechas reales */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-600" />Fechas Reales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div><p className="text-slate-500 font-medium">Inicio Real</p><p>{fmtFecha(orden.fechaInicioReal)}</p></div>
                  <div><p className="text-slate-500 font-medium">Fin Real</p><p>{fmtFecha(orden.fechaFinReal)}</p></div>
                  <div><p className="text-slate-500 font-medium">Cierre</p><p>{fmtFecha(orden.fechaCierre)}</p></div>
                </div>
              </div>
            </>)}

            {/* ════ TAB: SOLICITUDES ════ */}
            {tab === "solicitudes" && (<>

              {/* Tratamiento */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold mb-3">Tratamiento</h3>
                {loadingSolicitudes ? (
                  <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
                ) : errorSolicitudes ? (
                  <div className="text-sm text-red-600">{errorSolicitudes}</div>
                ) : tratamiento ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-500 font-medium">Estado</p><p>{fmt(tratamiento.estado)}</p></div>
                    <div className="md:col-span-2"><p className="text-slate-500 font-medium">Descripción</p><p>{fmt(tratamiento.descripcion)}</p></div>
                  </div>
                ) : <p className="text-sm text-slate-500">No hay tratamiento relacionado.</p>}
              </div>

              {/* Aviso si no está liberado */}
              {!esLiberado && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">OT no liberada</p>
                  <p>Para agregar nuevas solicitudes y sincronizar con SAP, primero libera la orden de trabajo.</p>
                </div>
              )}

              {/* Solicitudes de compra */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-slate-600" />Solicitudes de Compra</h3>
                  {esLiberado && (
                    <button onClick={() => { setTargetSeleccionado(null); setOpenSolicitudCompra(true); }} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50">+ Nueva solicitud</button>
                  )}
                </div>
                {loadingSolicitudes ? (
                  <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
                ) : (
                  <div className="space-y-3">
                    {[...(solicitudesCompra.generales || []), ...(solicitudesCompra.especificas || [])].length === 0 ? (
                      <p className="text-sm text-slate-500 border border-slate-200 rounded-lg bg-slate-50 p-3">No hay solicitudes de compra.</p>
                    ) : [...(solicitudesCompra.generales || []), ...(solicitudesCompra.especificas || [])].map((sol) => (
                      <SolicitudCard key={sol.id} solicitud={sol} tipo="compra" equipoLabel={getEquipoLabelBySolicitud(sol)} puedeSync={esLiberado} onSync={handleSyncSAP} />
                    ))}
                  </div>
                )}
              </div>

              {/* Solicitudes de almacén */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2"><Boxes className="w-4 h-4 text-slate-600" />Solicitudes de Almacén</h3>
                  {esLiberado && (
                    <button onClick={() => { setTargetSeleccionado(null); setOpenSolicitudAlmacen(true); }} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50">+ Nueva solicitud</button>
                  )}
                </div>
                {loadingSolicitudes ? (
                  <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
                ) : (
                  <div className="space-y-3">
                    {[...(solicitudesAlmacen.generales || []), ...(solicitudesAlmacen.especificas || [])].length === 0 ? (
                      <p className="text-sm text-slate-500 border border-slate-200 rounded-lg bg-slate-50 p-3">No hay solicitudes de almacén.</p>
                    ) : [...(solicitudesAlmacen.generales || []), ...(solicitudesAlmacen.especificas || [])].map((sol) => (
                      <SolicitudCard key={sol.id} solicitud={sol} tipo="almacen" equipoLabel={getEquipoLabelBySolicitud(sol)} puedeSync={esLiberado} onSync={handleSyncSAP} />
                    ))}
                  </div>
                )}
              </div>
            </>)}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t bg-white flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition">Cerrar</button>
          </div>
        </div>
      </div>

      <ModalSolicitudCompra
        isOpen={openSolicitudCompra}
        onClose={() => { setOpenSolicitudCompra(false); setTargetSeleccionado(null); }}
        onConfirm={handleConfirmSolicitudCompra}
        targets={targetSeleccionado ? [targetSeleccionado] : contextoOt.targets}
        contextoOt={contextoOt}
        soloContextoOt={true}
      />
      <ModalSolicitudAlmacen
        isOpen={openSolicitudAlmacen}
        onClose={() => { setOpenSolicitudAlmacen(false); setTargetSeleccionado(null); }}
        onConfirm={handleConfirmSolicitudAlmacen}
        targets={targetSeleccionado ? [targetSeleccionado] : contextoOt.targets}
        contextoOt={contextoOt}
        soloContextoOt={true}
      />
      <ModalOTGrupal
        isOpen={openEditarOT}
        onClose={() => setOpenEditarOT(false)}
        aviso={orden?.aviso || { id: orden?.avisoId, tipoMantenimiento: orden?.tipoMantenimiento }}
        mode="edit"
        initialData={orden}
        onGuardar={handleEditarOT}
      />
    </>
  );
}