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
  Mail,
  CheckCheck,
  Zap,
  AlertTriangle,
  Send,
} from "lucide-react";

import {
  getSolicitudesTratamientoPorOrdenTrabajo,
  updateOrdenTrabajoCompleta,
  verificarLiberacionOT,
  liberarOrdenTrabajoService,
} from "../../mantenimiento/services/ordenTrabajoService";
import { equipoService } from "../../mantenimiento/services/equipoService";
import ModalSolicitudCompra from "../../../components/inputs/ModalSolicitudCompra";
import ModalSolicitudAlmacen from "../../../components/inputs/ModalSolicitudAlmacen";
import {
  createSolicitudCompra,
  updateSolicitudCompra,
  syncSolicitudCompraById,
} from "../../OrdenTrabajo/services/SolicitudCompraService";
import {
  createSolicitudAlmacen,
  updateSolicitudAlmacen,
} from "../../OrdenTrabajo/services/solicitudAlmacenService";
import ModalOTGrupal from "../Modalotgrupal";
import { abrirPdfOrdenTrabajo } from "../services/ordenTrabajoPdfService";
import ModalLiberarOT from "./ModalLiberarOT";
import ModalDetalleSolicitud from "./ModalDetalleSolicitud";
import ModalEnviarAlmacen from "./ModalEnviarAlmacen";
import ModalEditarSolicitudCompra from "./ModalEditarSolicitudCompra";
import ModalEditarSolicitudAlmacen from "./ModalEditarSolicitudAlmacen";

/* ══════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════ */

const ACT_COLS = "32px 0.7fr 0.7fr 0.7fr 1.2fr 0.9fr 0.9fr 60px 70px 60px 90px";

const ESTADO_SOL_COLOR = {
  DRAFT:     "bg-amber-50  border-amber-300  text-amber-700",
  PENDIENTE: "bg-sky-50    border-sky-200    text-sky-700",
  SENT:      "bg-emerald-50 border-emerald-300 text-emerald-700",
  ENVIADO:   "bg-emerald-50 border-emerald-300 text-emerald-700",
  APROBADO:  "bg-emerald-100 border-emerald-400 text-emerald-800",
  RECHAZADO: "bg-red-50    border-red-200    text-red-700",
};

const ACT_ESTADO_COLOR = {
  PENDIENTE:  "bg-amber-50  text-amber-700  border-amber-200",
  EN_PROCESO: "bg-sky-50    text-sky-700    border-sky-200",
  COMPLETADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELADO:  "bg-red-50    text-red-700    border-red-200",
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const esSolicitudEnviada = (sol) => {
  const estado = sol?.estado?.toUpperCase();
  return estado === "SENT" || estado === "ENVIADO" || estado === "APROBADO";
};

const esSolicitudDraft = (sol) => {
  const estado = sol?.estado?.toUpperCase();
  return estado === "DRAFT" || estado === "PENDIENTE";
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
   SOLICITUD CARD — individual (compacta)
══════════════════════════════════════════ */
function SolicitudCard({ solicitud, tipo, onVerDetalle }) {
  const lineas    = Array.isArray(solicitud?.lineas) ? solicitud.lineas : [];
  const estadoCls = ESTADO_SOL_COLOR[solicitud?.estado?.toUpperCase()] || "bg-slate-50 border-slate-200 text-slate-700";
  const enviada   = esSolicitudEnviada(solicitud);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
      <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
        <span className={`shrink-0 px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 ${estadoCls}`}>
          {enviada && <CheckCheck className="w-3 h-3" />}
          {solicitud.estado || "—"}
        </span>
        <span className="font-semibold text-slate-800 truncate">
          {solicitud.numeroSolicitud || solicitud.docNum || `Sol. #${solicitud.id?.slice(0, 8)}`}
        </span>
        <span className="shrink-0 text-slate-500">
          {lineas.length} ítem{lineas.length !== 1 ? "s" : ""}
        </span>
        {solicitud.sapDocNum && (
          <span className="shrink-0 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded font-semibold">
            SAP: {solicitud.sapDocNum}
          </span>
        )}
      </div>
      <button
        onClick={() => onVerDetalle?.(solicitud)}
        className="shrink-0 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition font-medium"
      >
        Ver
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   BLOQUE DE LIBERACIÓN (consolidadas — read-only)
══════════════════════════════════════════ */
function BloqueLiberar({ solicitudes, tipo, onVerDetalle }) {
  if (!solicitudes.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          Bloque 1 · Liberación automática
        </span>
        <span className="text-xs text-slate-400">({solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""})</span>
      </div>
      <div className="p-3 space-y-2">
        {solicitudes.map((sol) => {
          const est     = sol.estado?.toUpperCase();
          const enviada = est === "SENT" || est === "ENVIADO" || est === "APROBADO";
          const isError = est === "ERROR";

          return (
            <div
              key={sol.id}
              className={`rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2 text-xs ${
                enviada ? "bg-emerald-50 border-emerald-200" :
                isError ? "bg-red-50 border-red-200" :
                "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {enviada && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                {isError && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className={`px-2 py-0.5 rounded-md border font-bold ${
                  enviada ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                  isError ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }`}>
                  {enviada ? "ENVIADA" : isError ? "ERROR" : sol.estado || "—"}
                </span>
                <button
                  onClick={() => onVerDetalle?.(sol)}
                  className="font-semibold text-slate-900 hover:underline hover:text-blue-700 transition"
                >
                  {sol.numeroSolicitud || "Sin número"}
                </button>
                <span className="text-slate-500">
                  Consolidada · {sol.lineas?.length || 0} ítem{sol.lineas?.length !== 1 ? "s" : ""}
                </span>
                {tipo === "compra" && sol.sapDocNum && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded font-semibold">
                    SAP: {sol.sapDocNum}
                  </span>
                )}
                {tipo === "almacen" && sol.destinatario && (
                  <span className="px-1.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded">
                    A: {sol.destinatario.nombre || sol.destinatario.correo}
                  </span>
                )}
              </div>
              {isError && (
                <span className="text-red-600 font-medium text-[11px] w-full mt-1">
                  ⚠ Error al enviar {tipo === "compra" ? "a SAP" : "por correo"}. La OT fue liberada pero este envío falló.
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SOLICITUDES PRE-LIBERACIÓN (copias editables antes de liberar)
══════════════════════════════════════════ */
function SolicitudesPreLiberar({ solicitudes, tipo, onVerDetalle, onEditar }) {
  if (!solicitudes.length) return (
    <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg p-3 text-center">
      No hay solicitudes de {tipo === "compra" ? "compra" : "almacén"} pendientes.
    </p>
  );

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-100/60 border-b border-amber-200 flex items-center gap-2">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
          Se enviarán al liberar la OT
        </span>
        <span className="text-xs text-amber-500">({solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""})</span>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {solicitudes.map((sol) => (
          <div key={sol.id} className="bg-white rounded-lg border border-amber-200 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => onVerDetalle?.(sol)} className="font-semibold text-slate-800 hover:underline hover:text-blue-700 transition truncate text-left">
                {sol.numeroSolicitud || `Sol. #${sol.id?.slice(0, 8)}`}
              </button>
              <span className="shrink-0 px-2 py-0.5 rounded-md border font-medium bg-amber-100 text-amber-700 border-amber-200">
                DRAFT
              </span>
            </div>
            <p className="text-slate-500">
              {sol.esGeneral ? "General" : "Específica"} · {sol.lineas?.length || 0} ítem{sol.lineas?.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => onEditar?.(sol)}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
            >
              <Edit className="w-3 h-3" /> Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SOLICITUDES ADICIONALES POST-LIBERACIÓN
══════════════════════════════════════════ */
function BloqueAdicionalCompra({ solicitud, onVerDetalle, onEditar, onSync, sincandoId }) {
  const est     = solicitud.estado?.toUpperCase();
  const isDraft = est === "DRAFT" || est === "PENDIENTE";
  const isSent  = est === "SENT"  || est === "ENVIADO" || est === "APROBADO";
  const isError = est === "ERROR";
  const canEdit = isDraft || isError;
  const isSyncing = sincandoId === solicitud.id;

  return (
    <div className={`rounded-xl border p-3 text-xs space-y-2 ${
      isSent  ? "bg-emerald-50 border-emerald-200" :
      isError ? "bg-red-50 border-red-200" :
      "bg-white border-slate-200"
    }`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {isSent  && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
          {isError && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          <span className={`px-2 py-0.5 rounded-md border font-bold ${
            isSent  ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            isError ? "bg-red-100 text-red-700 border-red-200" :
            "bg-amber-100 text-amber-700 border-amber-200"
          }`}>
            {isSent ? "ENVIADA" : isError ? "ERROR" : "DRAFT"}
          </span>
          <button onClick={() => onVerDetalle?.(solicitud)} className="font-semibold text-slate-900 hover:underline hover:text-blue-700 transition">
            {solicitud.numeroSolicitud || `Sol. #${solicitud.id?.slice(0, 8)}`}
          </button>
          <span className="text-slate-500">
            {solicitud.esGeneral ? "General" : "Específica"} · {solicitud.lineas?.length || 0} ítem{solicitud.lineas?.length !== 1 ? "s" : ""}
          </span>
          {solicitud.sapDocNum && (
            <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded font-semibold">SAP: {solicitud.sapDocNum}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {canEdit && (
            <button onClick={() => onEditar?.(solicitud)} className="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition">
              <Edit className="w-3 h-3" /> Editar
            </button>
          )}
          {(isDraft || isError) && (
            <button
              onClick={() => onSync?.(solicitud.id)}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Sync SAP
            </button>
          )}
        </div>
      </div>
      {isError && (
        <p className="text-red-600 text-[11px]">⚠ Error al enviar a SAP. Puedes editar y reintentar.</p>
      )}
    </div>
  );
}

function BloqueAdicionalAlmacen({ grupo, onVerDetalle, onEditar, onEnviar }) {
  const primeraHabilitada = grupo.find((s) => {
    const e = s.estado?.toUpperCase();
    return e === "DRAFT" || e === "PENDIENTE" || e === "ERROR";
  });
  const todasSent  = grupo.every((s) => { const e = s.estado?.toUpperCase(); return e === "SENT" || e === "ENVIADO" || e === "APROBADO"; });
  const hayError   = grupo.some((s) => s.estado?.toUpperCase() === "ERROR");
  const hayDraft   = grupo.some((s) => { const e = s.estado?.toUpperCase(); return e === "DRAFT" || e === "PENDIENTE"; });

  return (
    <div className={`rounded-xl border overflow-hidden text-xs ${
      todasSent ? "bg-emerald-50 border-emerald-200" :
      hayError  ? "bg-red-50 border-red-200" :
      "bg-white border-slate-200"
    }`}>
      <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 flex-wrap ${
        todasSent ? "bg-emerald-100/60 border-emerald-200" :
        hayError  ? "bg-red-100/60 border-red-200" :
        "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-2">
          {todasSent && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
          {hayError  && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          <span className="font-bold text-slate-700">
            {todasSent ? "Bloque enviado" : hayError ? "Error al enviar" : "Bloque pendiente"}
          </span>
          <span className="text-slate-400">{grupo.length} solicitud{grupo.length !== 1 ? "es" : ""}</span>
        </div>
        {(hayDraft || hayError) && (
          <button
            onClick={() => onEnviar?.(grupo[0]?.bloque_id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold transition"
          >
            <Send className="w-3 h-3" />
            {hayError ? "Reintentar envío" : "Enviar por correo"}
          </button>
        )}
      </div>
      <div className="p-2 space-y-1.5">
        {grupo.map((sol) => {
          const est     = sol.estado?.toUpperCase();
          const isSent  = est === "SENT" || est === "ENVIADO" || est === "APROBADO";
          const isError = est === "ERROR";
          const canEdit = !isSent;
          return (
            <div key={sol.id} className="flex items-center justify-between gap-2 bg-white/80 rounded-lg border border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`shrink-0 px-1.5 py-0.5 rounded border font-bold ${
                  isSent  ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                  isError ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }`}>
                  {isSent ? "SENT" : isError ? "ERROR" : "DRAFT"}
                </span>
                <button onClick={() => onVerDetalle?.(sol)} className="font-semibold text-slate-800 hover:underline hover:text-blue-700 truncate transition">
                  {sol.numeroSolicitud || `SA-${sol.id?.slice(0, 8)}`}
                </button>
                <span className="text-slate-400 shrink-0">{sol.lineas?.length || 0} ítems</span>
                {sol.destinatario && isSent && (
                  <span className="text-teal-600 shrink-0">A: {sol.destinatario.nombre}</span>
                )}
              </div>
              {canEdit && (
                <button onClick={() => onEditar?.(sol)} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition">
                  <Edit className="w-3 h-3" /> Editar
                </button>
              )}
            </div>
          );
        })}
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
  const [tab, setTab]                                   = useState("informacion");
  const [detalleSolicitudes, setDetalleSolicitudes]     = useState(null);
  const [loadingSolicitudes, setLoadingSolicitudes]     = useState(false);
  const [errorSolicitudes, setErrorSolicitudes]         = useState("");
  const [openSolicitudCompra, setOpenSolicitudCompra]   = useState(false);
  const [openSolicitudAlmacen, setOpenSolicitudAlmacen] = useState(false);
  const [targetSeleccionado, setTargetSeleccionado]     = useState(null);
  const [equiposDetalleMap, setEquiposDetalleMap]       = useState({});
  const [loadingEquiposDetalle, setLoadingEquiposDetalle] = useState(false);
  const [openEditarOT, setOpenEditarOT]                 = useState(false);
  const [guardandoEdicion, setGuardandoEdicion]         = useState(false);

  // ── Estado para detalle de solicitud ──
  const [solicitudDetalle, setSolicitudDetalle]           = useState(null);
  const [tipoDetalle, setTipoDetalle]                     = useState("compra");

  // ── Modal enviar almacén ──
  const [openEnviarAlmacen, setOpenEnviarAlmacen]         = useState(false);
  const [bloqueEnviar, setBloqueEnviar]                   = useState(null); // bloque_id específico a enviar

  // ── Edición de solicitudes individuales ──
  const [editandoCompra, setEditandoCompra]               = useState(null); // solicitud compra
  const [editandoAlmacen, setEditandoAlmacen]             = useState(null); // solicitud almacen
  const [syncandoId, setSyncandoId]                       = useState(null); // id en sync

  // ── Estados para liberación ──
  const [showModalLiberar, setShowModalLiberar]           = useState(false);
  const [verificacion, setVerificacion]                   = useState(null);
  const [liberando, setLiberando]                         = useState(false);
  const [cargandoVerificacion, setCargandoVerificacion]   = useState(false);

  const estadoActual = orden?.estado || "";
  const esLiberado   = estadoActual === "LIBERADO";

  /* ── Cargar solicitudes ── */
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
    if (isOpen && orden?.id) recargarSolicitudes();
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
    { card: "bg-sky-50 border-sky-200",         header: "bg-sky-100 border-sky-200 text-sky-900",             badge: "bg-sky-100 text-sky-700 border-sky-200",             section: "bg-white border-sky-100" },
    { card: "bg-emerald-50 border-emerald-200", header: "bg-emerald-100 border-emerald-200 text-emerald-900", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", section: "bg-white border-emerald-100" },
    { card: "bg-violet-50 border-violet-200",   header: "bg-violet-100 border-violet-200 text-violet-900",   badge: "bg-violet-100 text-violet-700 border-violet-200",   section: "bg-white border-violet-100" },
    { card: "bg-amber-50 border-amber-200",     header: "bg-amber-100 border-amber-200 text-amber-900",     badge: "bg-amber-100 text-amber-700 border-amber-200",     section: "bg-white border-amber-100" },
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

  const aviso              = detalleSolicitudes?.aviso || null;
  const solicitudesCompra  = detalleSolicitudes?.solicitudesCompra  || { generales: [], especificas: [] };
  const solicitudesAlmacen = detalleSolicitudes?.solicitudesAlmacen || { generales: [], especificas: [], lineasAgrupadasSap: [] };

  const todasSolicitudesCompra  = [...(solicitudesCompra.generales || []), ...(solicitudesCompra.especificas || [])];
  const todasSolicitudesAlmacen = [...(solicitudesAlmacen.generales || []), ...(solicitudesAlmacen.especificas || [])];

  // Bloques estructurales
  // Bloque liberación = esConsolidada (enviado automáticamente al liberar)
  const bloqueCompra   = todasSolicitudesCompra.filter((s) => s.esConsolidada);
  const bloqueAlmacen  = todasSolicitudesAlmacen.filter((s) => s.esConsolidada);

  // Pre-liberación = copias DRAFT (se enviarán al liberar, pueden editarse ahora)
  const preCompra  = todasSolicitudesCompra.filter((s) => s.esCopia && !s.esConsolidada && esSolicitudDraft(s));
  const preAlmacen = todasSolicitudesAlmacen.filter((s) => s.esCopia && !s.esConsolidada && esSolicitudDraft(s));

  // Post-liberación = solicitudes nuevas creadas directamente en la OT después de liberar
  const nuevasCompra  = todasSolicitudesCompra.filter((s) => !s.esCopia && !s.esConsolidada);
  const nuevasAlmacen = todasSolicitudesAlmacen.filter((s) => !s.esCopia && !s.esConsolidada);

  // Agrupar almacén por bloque_id
  const gruposAlmacen = nuevasAlmacen.reduce((acc, s) => {
    const key = s.bloque_id || s.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const gruposAlmacenList = Object.values(gruposAlmacen);

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

  const buildPayloadBase = (ctx, solicitud, extra = {}) => ({
    tratamiento_id:       ctx?.tratamiento_id || null,
    ordenTrabajoId:       ctx?.ordenTrabajoId || null,
    esGeneral:            !!extra.esGeneral,
    equipo_id:            extra.equipo_id || null,
    ubicacion_tecnica_id: extra.ubicacion_tecnica_id || null,
    department:           solicitud?.department || "",
    requester:            solicitud?.requester || solicitud?.email || "",
    email:                solicitud?.email || solicitud?.requester || "",
    requiredDate:         solicitud?.requiredDate || "",
    comments:             solicitud?.comments || "",
    lineas: (solicitud?.lineas || []).map((l) => ({
      itemId:           l.itemId || null,
      itemCode:         l.itemCode || "",
      description:      l.description || "",
      quantity:         Number(l.quantity) || 1,
      warehouseCode:    l.warehouseCode || "",
      costingCode:      l.costingCode || l.costCenter || "",
      projectCode:      l.projectCode || "",
      rubroId:          l.rubroId ?? null,
      paqueteTrabajoId: l.paqueteTrabajoId ?? null,
    })),
  });

  const tieneLineasValidas = (sol) =>
    Array.isArray(sol?.lineas) && sol.lineas.some((l) => (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0);

  /* ── Handlers de liberación ── */
  const handleLiberarOrden = async () => {
    try {
      setCargandoVerificacion(true);
      const r = await verificarLiberacionOT(orden.id);
      setVerificacion(r.data);
      setShowModalLiberar(true);
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Error al verificar");
    } finally {
      setCargandoVerificacion(false);
    }
  };

  const confirmarLiberacion = async (destinatarioId, ccEmails = []) => {
    try {
      setLiberando(true);
      const r = await liberarOrdenTrabajoService(orden.id, destinatarioId, ccEmails);
      setShowModalLiberar(false);

      const { compra, almacen } = r.data;
      let msg = "✅ OT liberada correctamente.";
      if (compra?.enviada)                   msg += `\n📦 Compra enviada a SAP (${compra.numeroSolicitud}).`;
      if (compra?.resultadoSAP && !compra.enviada) msg += `\n⚠️ Error enviando a SAP.`;
      if (almacen?.correoEnviado)            msg += `\n📧 Correo de almacén enviado a ${almacen.destinatario}.`;
      if (almacen?.errorCorreo)              msg += `\n⚠️ Error enviando correo: ${almacen.errorCorreo}`;
      alert(msg);

      if (typeof onOrdenActualizada === "function") {
        await onOrdenActualizada(r.data?.ot || orden);
      }
      onClose?.();
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Error al liberar");
    } finally {
      setLiberando(false);
    }
  };

  /* ── Otros handlers ── */
  const handleAbrirCierre   = async () => { try { await onAbrirCierreTecnico?.(orden); onClose?.(); } catch {} };
  const handleCambiarEstado = async (s) => { try { await onUpdateEstado?.(orden.id, s); onClose?.(); } catch {} };

  const handleEnviarCorreoAlmacen = (bloqueId = null) => {
    setBloqueEnviar(bloqueId);
    setOpenEnviarAlmacen(true);
  };

  const handleSyncCompraIndividual = async (solId) => {
    try {
      setSyncandoId(solId);
      await syncSolicitudCompraById(solId);
      await recargarSolicitudes();
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Error al sincronizar con SAP");
    } finally {
      setSyncandoId(null);
    }
  };

  const handleGuardarCompra = async (solId, payload) => {
    await updateSolicitudCompra(solId, payload);
    setEditandoCompra(null);
    await recargarSolicitudes();
  };

  const handleGuardarAlmacen = async (solId, payload) => {
    await updateSolicitudAlmacen(solId, payload);
    setEditandoAlmacen(null);
    await recargarSolicitudes();
  };

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
      const { solicitudGeneral, solicitudesPorEquipo } = data;
      const ctx = contextoOt; // usar contextoOt del componente, no del payload del modal
      const reqs = [];
      if (tieneLineasValidas(solicitudGeneral)) {
        reqs.push(createSolicitudCompra(buildPayloadBase(ctx, solicitudGeneral, { esGeneral: true })));
      }
      Object.values(solicitudesPorEquipo || {}).forEach((sol) => {
        if (!tieneLineasValidas(sol)) return;
        reqs.push(createSolicitudCompra(buildPayloadBase(ctx, sol, {
          esGeneral: false,
          equipo_id: sol.equipo_id || null,
          ubicacion_tecnica_id: sol.ubicacion_tecnica_id || null,
        })));
      });
      await Promise.all(reqs);
      setOpenSolicitudCompra(false);
      setTargetSeleccionado(null);
      await recargarSolicitudes();
    } catch (error) {
      const msg = error?.response?.data?.errors?.join(", ") || error?.response?.data?.message || error?.message || "Error creando solicitudes de compra";
      alert(msg);
    }
  };

  const handleConfirmSolicitudAlmacen = async (data) => {
    try {
      const { solicitudGeneral, solicitudesPorEquipo } = data;
      const ctx = contextoOt;

      // bloque_id compartido → todas las solicitudes del lote se envían juntas
      const bloqueId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const reqs = [];
      if (tieneLineasValidas(solicitudGeneral)) {
        reqs.push(createSolicitudAlmacen({
          ...buildPayloadBase(ctx, solicitudGeneral, { esGeneral: true }),
          bloque_id: bloqueId,
        }));
      }
      Object.values(solicitudesPorEquipo || {}).forEach((sol) => {
        if (!tieneLineasValidas(sol)) return;
        reqs.push(createSolicitudAlmacen({
          ...buildPayloadBase(ctx, sol, {
            esGeneral: false,
            equipo_id: sol.equipo_id || null,
            ubicacion_tecnica_id: sol.ubicacion_tecnica_id || null,
          }),
          bloque_id: bloqueId,
        }));
      });
      await Promise.all(reqs);
      setOpenSolicitudAlmacen(false);
      setTargetSeleccionado(null);
      await recargarSolicitudes();
    } catch (error) {
      const msg = error?.response?.data?.errors?.join(", ") || error?.response?.data?.message || error?.message || "Error creando solicitudes de almacén";
      alert(msg);
    }
  };

  const abrirCompraParaEquipo  = (eq) => { setTargetSeleccionado({ id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id), type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA", nombre: getNombreObj(eq), tag: getCodigoObj(eq), equipoId: eq.equipoId || null, ubicacionTecnicaId: eq.ubicacionTecnicaId || null }); setOpenSolicitudCompra(true); };
  const abrirAlmacenParaEquipo = (eq) => { setTargetSeleccionado({ id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id), type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA", nombre: getNombreObj(eq), tag: getCodigoObj(eq), equipoId: eq.equipoId || null, ubicacionTecnicaId: eq.ubicacionTecnicaId || null }); setOpenSolicitudAlmacen(true); };

  /* ── Botones de acción ── */
  const renderActionButtons = () => (
    <div className="flex gap-2 flex-wrap justify-end">
      <button
        onClick={() => setOpenEditarOT(true)}
        disabled={guardandoEdicion}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
      >
        <Edit className="w-4 h-4" />{guardandoEdicion ? "Guardando..." : "Editar"}
      </button>

      {esLiberado && (
        <button
          onClick={() => abrirPdfOrdenTrabajo(orden.id)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />Ver PDF
        </button>
      )}

      {estadoActual === "CREADO" && (
        <>
          <button
            onClick={handleLiberarOrden}
            disabled={cargandoVerificacion}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {cargandoVerificacion
              ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</>
              : <><Zap className="w-4 h-4" />Liberar</>
            }
          </button>
          <button onClick={() => handleCambiarEstado("CANCELADO")} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors">Cancelar</button>
        </>
      )}
      {estadoActual === "LIBERADO" && (
        <>
          <button onClick={handleAbrirCierre} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">Cierre Técnico</button>
          <button onClick={() => handleCambiarEstado("CANCELADO")} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors">Cancelar</button>
        </>
      )}
      {estadoActual === "CIERRE_TECNICO" && (
        <button onClick={() => handleCambiarEstado("CERRADO")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors">Cerrar OT</button>
      )}
    </div>
  );

  if (!isOpen || !orden) return null;

  const TABS = [
    { key: "informacion",         label: "Información OT" },
    { key: "solicitudes_compra",  label: "Solicitudes Compra" },
    { key: "solicitudes_almacen", label: "Solicitudes Almacén" },
  ];

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
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />Orden de Trabajo
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">{fmt(orden.numeroOT)}</p>
              </div>
              <div className="flex flex-col items-end gap-3 ml-auto">
                <span className={`px-3 py-1 rounded-md border text-xs font-semibold ${estadoOTColor[orden.estado] || "bg-slate-100 text-slate-700 border-slate-300"}`}>
                  {fmt(orden.estado)}
                </span>
                {renderActionButtons()}
              </div>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 transition">
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 bg-white px-5 py-3 flex gap-2 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-md text-sm border transition ${
                  tab === key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
                {key === "solicitudes_compra" && todasSolicitudesCompra.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">
                    {todasSolicitudesCompra.length}
                  </span>
                )}
                {key === "solicitudes_almacen" && todasSolicitudesAlmacen.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700 font-semibold">
                    {todasSolicitudesAlmacen.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">

            {/* ════ TAB: INFORMACIÓN OT ════ */}
            {tab === "informacion" && (
              <>
                {/* Info general */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-600" />Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="md:col-span-2">
                      <p className="text-slate-500 font-medium">Descripción</p>
                      <p>{fmt(orden.descripcionGeneral)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Inicio Programado</p>
                      <p>{fmtFecha(orden.fechaProgramadaInicio)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Fin Programado</p>
                      <p>{fmtFecha(orden.fechaProgramadaFin)}</p>
                    </div>

                    {aviso && (
                      <div className="md:col-span-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                        <p className="text-slate-500 font-semibold mb-2">Información del Cliente</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><p className="text-xs text-slate-500 font-medium">Cliente</p><p>{fmt(aviso.cliente)}</p></div>
                          <div><p className="text-xs text-slate-500 font-medium">Orden de Venta (OV)</p><p>{fmt(aviso.numeroOV)}</p></div>
                          <div className="md:col-span-2"><p className="text-xs text-slate-500 font-medium">Dirección</p><p>{fmt(aviso.direccion)}</p></div>
                          <div><p className="text-xs text-slate-500 font-medium">Contacto</p><p>{fmt(aviso.contacto?.nombre)}</p></div>
                          <div><p className="text-xs text-slate-500 font-medium">Teléfono</p><p>{fmt(aviso.contacto?.telefono)}</p></div>
                          <div className="md:col-span-2"><p className="text-xs text-slate-500 font-medium">Correo</p><p>{fmt(aviso.contacto?.correo)}</p></div>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <p className="text-slate-500 font-medium">Observaciones</p>
                      <p>{fmt(orden.observaciones)}</p>
                    </div>
                  </div>
                </div>

                {/* Solicitudes en tab Información — resumen rápido */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-slate-600" />Solicitudes de la Orden
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <button onClick={() => setTab("solicitudes_compra")} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-3 hover:bg-blue-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">Solicitudes de Compra</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">{todasSolicitudesCompra.length}</span>
                    </button>
                    <button onClick={() => setTab("solicitudes_almacen")} className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50 p-3 hover:bg-teal-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-teal-600" />
                        <span className="font-semibold text-teal-800">Solicitudes de Almacén</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200">{todasSolicitudesAlmacen.length}</span>
                    </button>
                  </div>
                </div>

                {/* Resumen: instalación = bloque único; resto = por equipo */}
                {aviso?.tipoAviso === "instalacion" ? (() => {
                  // Merge all activities from all equipos entries into one block
                  const todasActividades = (orden.equipos || []).flatMap((eq) => eq.actividades || []);
                  const todosLosEncargados = (orden.equipos || []).flatMap((eq) => eq.trabajadores || []);
                  const equiposInfo = (orden.equipos || []).filter((eq) => eq.equipoId || eq.ubicacionTecnicaId);

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-600" />Actividades de Instalación
                        {equiposInfo.length > 0 && (
                          <span className="ml-1 text-xs text-slate-400 font-normal">
                            · {equiposInfo.length} equipo{equiposInfo.length !== 1 ? "s" : ""} asociado{equiposInfo.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </h3>

                      {/* Equipos info-only */}
                      {equiposInfo.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {equiposInfo.map((eq) => (
                            <span key={eq.id} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium">
                              {getNombreObj(eq) || "—"}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actividades */}
                      <div className="mb-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
                        <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-slate-500" />
                          Actividades ({todasActividades.length})
                        </h4>
                        {todasActividades.length > 0 ? (
                          <div style={{ overflowX: "auto" }}>
                            <ActividadesHeader />
                            {[...todasActividades]
                              .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                              .map((act, idx) => <ActividadFila key={act.id || idx} act={act} idx={idx} />)}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Sin actividades registradas.</p>
                        )}
                      </div>

                      {/* Trabajadores */}
                      {todosLosEncargados.length > 0 && (
                        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                          <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />Trabajadores ({todosLosEncargados.length})
                          </h4>
                          <div className="space-y-2">
                            {todosLosEncargados.map((t) => {
                              const tr = t.trabajador || {};
                              return (
                                <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                                  <div>
                                    <p className="font-medium text-slate-900">{fmt(tr.nombre)} {fmt(tr.apellido)}</p>
                                    <p className="text-xs text-slate-500">{fmt(tr.rol ? tr.rol.replaceAll("_", " ") : "—")} · {fmt(tr.empresa)}</p>
                                  </div>
                                  {t.esEncargado && (
                                    <span className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                      <Star className="w-3 h-3" />Encargado
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-600" />Resumen por Equipo ({orden.equipos?.length || 0})
                  </h3>
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
                              <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-500" />Detalle del equipo
                              </h4>
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

                          {/* Actividades */}
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
                            <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-500" />Trabajadores ({eq.trabajadores?.length || 0})
                            </h4>
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
                                      {t.esEncargado && (
                                        <span className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                          <Star className="w-3 h-3" />Encargado
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin trabajadores.</p>}
                          </div>

                          {/* Solicitud compra del equipo */}
                          <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-slate-500" />Solicitud de compra
                              </h4>
                              {esLiberado && (
                                <button onClick={() => abrirCompraParaEquipo(eq)} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50">
                                  + Agregar
                                </button>
                              )}
                            </div>
                            {solCompra.length > 0 ? (
                              <div className="space-y-2">
                                {solCompra.map((sol) => (
                                  <SolicitudCard key={sol.id} solicitud={sol} tipo="compra" onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("compra"); }} />
                                ))}
                              </div>
                            ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin solicitud de compra específica.</p>}
                          </div>

                          {/* Solicitud almacén del equipo */}
                          <div className={`rounded-xl border p-4 ${tono.section}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                <Boxes className="w-4 h-4 text-slate-500" />Solicitud de almacén
                              </h4>
                              {esLiberado && (
                                <button onClick={() => abrirAlmacenParaEquipo(eq)} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50">
                                  + Agregar
                                </button>
                              )}
                            </div>
                            {solAlmacen.length > 0 ? (
                              <div className="space-y-2">
                                {solAlmacen.map((sol) => (
                                  <SolicitudCard key={sol.id} solicitud={sol} tipo="almacen" onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("almacen"); }} />
                                ))}
                              </div>
                            ) : <p className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">Sin solicitud de almacén específica.</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* Fechas reales */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />Fechas Reales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-slate-500 font-medium">Inicio Real</p><p>{fmtFecha(orden.fechaInicioReal)}</p></div>
                    <div><p className="text-slate-500 font-medium">Fin Real</p><p>{fmtFecha(orden.fechaFinReal)}</p></div>
                    <div><p className="text-slate-500 font-medium">Cierre</p><p>{fmtFecha(orden.fechaCierre)}</p></div>
                  </div>
                </div>
              </>
            )}

            {/* ════ TAB: SOLICITUDES DE COMPRA ════ */}
            {tab === "solicitudes_compra" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      Solicitudes de Compra
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">
                        {todasSolicitudesCompra.length}
                      </span>
                    </h3>
                    {esLiberado && (
                      <button
                        onClick={() => { setTargetSeleccionado(null); setOpenSolicitudCompra(true); }}
                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
                      >
                        + Nueva solicitud
                      </button>
                    )}
                  </div>

                  {loadingSolicitudes ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bloque 1: Pre-liberación (DRAFT editables) */}
                      {!esLiberado && (
                        <SolicitudesPreLiberar
                          solicitudes={preCompra}
                          tipo="compra"
                          onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("compra"); }}
                          onEditar={(s) => setEditandoCompra(s)}
                        />
                      )}

                      {/* Bloque 1: Post-liberación (enviado automáticamente) */}
                      {bloqueCompra.length > 0 && (
                        <div>
                          <BloqueLiberar
                            solicitudes={bloqueCompra}
                            tipo="compra"
                            onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("compra"); }}
                          />
                        </div>
                      )}

                      {/* Solicitudes adicionales post-liberación */}
                      {esLiberado && (
                        <div className="space-y-2">
                          {nuevasCompra.length > 0 && (
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                              Solicitudes adicionales ({nuevasCompra.length})
                            </p>
                          )}
                          {nuevasCompra.map((sol) => (
                            <BloqueAdicionalCompra
                              key={sol.id}
                              solicitud={sol}
                              onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("compra"); }}
                              onEditar={(s) => setEditandoCompra(s)}
                              onSync={handleSyncCompraIndividual}
                              sincandoId={syncandoId}
                            />
                          ))}
                        </div>
                      )}

                      {todasSolicitudesCompra.length === 0 && (
                        <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                          No hay solicitudes de compra.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ TAB: SOLICITUDES DE ALMACÉN ════ */}
            {tab === "solicitudes_almacen" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-teal-600" />
                      Solicitudes de Almacén
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700 font-semibold">
                        {todasSolicitudesAlmacen.length}
                      </span>
                    </h3>
                    {esLiberado && (
                      <button
                        onClick={() => { setTargetSeleccionado(null); setOpenSolicitudAlmacen(true); }}
                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
                      >
                        + Nueva solicitud
                      </button>
                    )}
                  </div>

                  {loadingSolicitudes ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bloque 1: Pre-liberación (DRAFT editables) */}
                      {!esLiberado && (
                        <SolicitudesPreLiberar
                          solicitudes={preAlmacen}
                          tipo="almacen"
                          onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("almacen"); }}
                          onEditar={(s) => setEditandoAlmacen(s)}
                        />
                      )}

                      {/* Bloque 1: Post-liberación (enviado automáticamente) */}
                      {bloqueAlmacen.length > 0 && (
                        <BloqueLiberar
                          solicitudes={bloqueAlmacen}
                          tipo="almacen"
                          onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("almacen"); }}
                        />
                      )}

                      {/* Bloques adicionales post-liberación (agrupados por bloque_id) */}
                      {esLiberado && (
                        <div className="space-y-3">
                          {gruposAlmacenList.length > 0 && (
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                              Solicitudes adicionales ({nuevasAlmacen.length})
                            </p>
                          )}
                          {gruposAlmacenList.map((grupo, i) => (
                            <BloqueAdicionalAlmacen
                              key={grupo[0]?.bloque_id || i}
                              grupo={grupo}
                              onVerDetalle={(s) => { setSolicitudDetalle(s); setTipoDetalle("almacen"); }}
                              onEditar={(s) => setEditandoAlmacen(s)}
                              onEnviar={(bid) => handleEnviarCorreoAlmacen(bid)}
                            />
                          ))}
                        </div>
                      )}

                      {todasSolicitudesAlmacen.length === 0 && (
                        <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                          No hay solicitudes de almacén.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t bg-white flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modales secundarios */}
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

      {/* ── Modal de liberación ── */}
      <ModalLiberarOT
        isOpen={showModalLiberar}
        onClose={() => setShowModalLiberar(false)}
        onConfirm={confirmarLiberacion}
        verificacion={verificacion}
        liberando={liberando}
      />

      {/* ── Modal detalle de solicitud ── */}
      <ModalDetalleSolicitud
        isOpen={!!solicitudDetalle}
        onClose={() => setSolicitudDetalle(null)}
        solicitud={solicitudDetalle}
        tipo={tipoDetalle}
      />

      {/* ── Editar solicitud de compra ── */}
      <ModalEditarSolicitudCompra
        isOpen={!!editandoCompra}
        onClose={() => setEditandoCompra(null)}
        solicitudes={editandoCompra ? [editandoCompra] : []}
        defaultSolicitudId={editandoCompra?.id || ""}
        onSave={handleGuardarCompra}
      />

      {/* ── Editar solicitud de almacén ── */}
      <ModalEditarSolicitudAlmacen
        isOpen={!!editandoAlmacen}
        onClose={() => setEditandoAlmacen(null)}
        solicitud={editandoAlmacen}
        onSave={handleGuardarAlmacen}
      />

      {/* ── Modal enviar bloques de almacén por correo ── */}
      <ModalEnviarAlmacen
        isOpen={openEnviarAlmacen}
        onClose={() => { setOpenEnviarAlmacen(false); setBloqueEnviar(null); }}
        solicitudesAlmacen={
          bloqueEnviar
            ? nuevasAlmacen.filter((s) => s.bloque_id === bloqueEnviar)
            : nuevasAlmacen
        }
        ordenTrabajoId={orden?.id}
        onEnviado={async () => { await recargarSolicitudes(); }}
      />
    </>
  );
}