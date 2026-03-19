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
} from "lucide-react";

import { getSolicitudesTratamientoPorOrdenTrabajo } from "../../mantenimiento/services/ordenTrabajoService";
import { equipoService } from "../../mantenimiento/services/equipoService";

import ModalSolicitudCompra from "../../../components/inputs/ModalSolicitudCompra";
import ModalSolicitudAlmacen from "../../../components/inputs/ModalSolicitudAlmacen";

import { createSolicitudCompra } from "../../OrdenTrabajo/services/SolicitudCompraService";
import { createSolicitudAlmacen } from "../../OrdenTrabajo/services/solicitudAlmacenService";
import { updateOrdenTrabajoCompleta } from "../../mantenimiento/services/ordenTrabajoService";

import ModalOTGrupal from "../../OrdenTrabajo/ModalOTGrupal";

export default function ModalOrdenTrabajoView({
  isOpen,
  orden,
  onClose,
  onUpdateEstado,
  onLiberar,
  onAbrirCierreTecnico,
  onOrdenActualizada, // opcional para refrescar lista en el padre
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

  const recargarSolicitudes = async () => {
    if (!orden?.id) return;

    try {
      setLoadingSolicitudes(true);
      setErrorSolicitudes("");

      const response = await getSolicitudesTratamientoPorOrdenTrabajo(orden.id);
      setDetalleSolicitudes(response?.data || null);
    } catch (error) {
      console.error(error);
      setErrorSolicitudes("No se pudo cargar la información de solicitudes.");
      setDetalleSolicitudes(null);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  useEffect(() => {
    const cargarSolicitudes = async () => {
      if (!isOpen || !orden?.id) return;
      await recargarSolicitudes();
    };

    if (tab === "solicitudes" || tab === "informacion") {
      cargarSolicitudes();
    }
  }, [isOpen, orden?.id, tab]);

  useEffect(() => {
    const cargarDetalleEquipos = async () => {
      if (!isOpen || !orden?.equipos?.length) return;

      try {
        setLoadingEquiposDetalle(true);

        const equiposConId = orden.equipos.filter((eq) => !!eq.equipoId);

        const results = await Promise.all(
          equiposConId.map(async (eq) => {
            try {
              const response = await equipoService.getEquipoById(eq.equipoId);
              return {
                equipoId: eq.equipoId,
                data: response?.data || response || null,
              };
            } catch (error) {
              console.error(`Error cargando detalle del equipo ${eq.equipoId}`, error);
              return {
                equipoId: eq.equipoId,
                data: null,
              };
            }
          })
        );

        const map = {};
        results.forEach((item) => {
          map[item.equipoId] = item.data;
        });

        setEquiposDetalleMap(map);
      } catch (error) {
        console.error("Error cargando detalles de equipos:", error);
        setEquiposDetalleMap({});
      } finally {
        setLoadingEquiposDetalle(false);
      }
    };

    cargarDetalleEquipos();
  }, [isOpen, orden]);

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTexto = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "—";
    return valor;
  };

  const tonosEquipo = [
    {
      card: "bg-sky-50 border-sky-200",
      header: "bg-sky-100 border-sky-200 text-sky-900",
      badge: "bg-sky-100 text-sky-700 border-sky-200",
      section: "bg-white border-sky-100",
    },
    {
      card: "bg-emerald-50 border-emerald-200",
      header: "bg-emerald-100 border-emerald-200 text-emerald-900",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      section: "bg-white border-emerald-100",
    },
    {
      card: "bg-violet-50 border-violet-200",
      header: "bg-violet-100 border-violet-200 text-violet-900",
      badge: "bg-violet-100 text-violet-700 border-violet-200",
      section: "bg-white border-violet-100",
    },
    {
      card: "bg-amber-50 border-amber-200",
      header: "bg-amber-100 border-amber-200 text-amber-900",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      section: "bg-white border-amber-100",
    },
  ];

  const getTonoEquipo = (index) => tonosEquipo[index % tonosEquipo.length];

  const estadoColor = {
    CREADO: "bg-slate-100 text-slate-700 border-slate-300",
    LIBERADO: "bg-violet-50 text-violet-700 border-violet-200",
    CIERRE_TECNICO: "bg-amber-50 text-amber-700 border-amber-200",
    CERRADO: "bg-green-50 text-green-700 border-green-200",
    FINALIZADO: "bg-green-50 text-green-700 border-green-200",
    EN_PROCESO: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELADO: "bg-red-50 text-red-700 border-red-200",
  };

  const solicitudesCompra = detalleSolicitudes?.solicitudesCompra || {
    generales: [],
    especificas: [],
  };

  const solicitudesAlmacen = detalleSolicitudes?.solicitudesAlmacen || {
    generales: [],
    especificas: [],
    lineasAgrupadasSap: [],
  };

  const SectionTitle = ({ icon: Icon, title }) => (
    <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-500" />
      {title}
    </h4>
  );

  const tratamiento = detalleSolicitudes?.tratamiento || null;

  const contextoOt = useMemo(() => {
    const targets = (orden?.equipos || []).map((eq) => ({
      id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id),
      type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA",
      nombre: eq.equipo?.nombre || eq.ubicacionTecnica?.nombre || "Objetivo",
      tag: eq.equipo?.codigo || eq.ubicacionTecnica?.codigo || "—",
      equipoId: eq.equipoId || null,
      ubicacionTecnicaId: eq.ubicacionTecnicaId || null,
    }));

    return {
      tratamiento_id: orden?.tratamientoId || null,
      ordenTrabajoId: orden?.id || null,
      targets,
    };
  }, [orden]);

  const lineasCompra = useMemo(() => {
    const todas = [
      ...(solicitudesCompra.generales || []),
      ...(solicitudesCompra.especificas || []),
    ];

    return todas.flatMap((sol) =>
      (sol.lineas || []).map((linea, index) => ({
        rowId: `${sol.id}-${linea.id || index}-compra`,
        origen: sol.origenVista === "GENERAL" ? "General" : "Específica",
        documento: sol.docNum || sol.numeroDocumento || "Solicitud",
        fecha: sol.docDate || sol.createdAt || null,
        itemCode: linea.itemCode,
        description: linea.description,
        quantity: linea.quantity,
        warehouseCode: linea.warehouseCode,
        costingCode: linea.costingCode,
        projectCode: linea.projectCode,
        rubroSapCode: linea.rubroSapCode || linea.rubro,
        paqueteTrabajo: linea.paqueteTrabajo,
      }))
    );
  }, [solicitudesCompra]);

  const lineasAlmacen = useMemo(() => {
    const todas = [
      ...(solicitudesAlmacen.generales || []),
      ...(solicitudesAlmacen.especificas || []),
    ];

    return todas.flatMap((sol) =>
      (sol.lineas || []).map((linea, index) => ({
        rowId: `${sol.id}-${linea.id || index}-almacen`,
        origen: sol.origenVista === "GENERAL" ? "General" : "Específica",
        documento: sol.docNum || sol.numeroDocumento || "Solicitud",
        fecha: sol.docDate || sol.createdAt || null,
        itemCode: linea.itemCode,
        description: linea.description,
        quantity: linea.quantity,
        warehouseCode: linea.warehouseCode,
        costingCode: linea.costingCode,
        projectCode: linea.projectCode,
        rubroSapCode: linea.rubroSapCode || linea.rubro,
        paqueteTrabajo: linea.paqueteTrabajo,
      }))
    );
  }, [solicitudesAlmacen]);

  const buildPayloadBase = (contextoOtValue, solicitud, extra = {}) => ({
    tratamiento_id: contextoOtValue?.tratamiento_id || null,
    ordenTrabajoId: contextoOtValue?.ordenTrabajoId || null,
    esGeneral: !!extra.esGeneral,
    equipo_id: extra.equipo_id || null,
    ubicacion_tecnica_id: extra.ubicacion_tecnica_id || null,
    department: solicitud?.department || "",
    requester: solicitud?.requester || solicitud?.email || "",
    email: solicitud?.email || solicitud?.requester || "",
    requiredDate: solicitud?.requiredDate || "",
    comments: solicitud?.comments || "",
    lineas: (solicitud?.lineas || []).map((linea) => ({
      itemId: linea.itemId || null,
      itemCode: linea.itemCode || "",
      description: linea.description || "",
      quantity: Number(linea.quantity) || 1,
      warehouseCode: linea.warehouseCode || "",
      costingCode: linea.costingCode || linea.costCenter || "",
      projectCode: linea.projectCode || "",
      rubro: linea.rubro || "",
      rubroSapCode: linea.rubroSapCode || "",
      paqueteTrabajo: linea.paqueteTrabajo || "",
    })),
  });

  const tieneLineasValidas = (solicitud) =>
    Array.isArray(solicitud?.lineas) &&
    solicitud.lineas.some(
      (l) => (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0
    );

  const getEquipoDetalle = (eq) => {
    if (!eq?.equipoId) return null;
    return equiposDetalleMap[eq.equipoId] || null;
  };

  const getNombreObjetivo = (eq) => {
    const detalle = getEquipoDetalle(eq);
    return (
      detalle?.nombre ||
      eq.equipo?.nombre ||
      eq.ubicacionTecnica?.nombre ||
      "Objetivo"
    );
  };

  const getCodigoObjetivo = (eq) => {
    const detalle = getEquipoDetalle(eq);
    return (
      detalle?.codigo ||
      eq.equipo?.codigo ||
      eq.ubicacionTecnica?.codigo ||
      "—"
    );
  };

  const getTipoObjetivo = (eq) => {
    const detalle = getEquipoDetalle(eq);
    return (
      detalle?.tipoEquipo ||
      eq.equipo?.tipoEquipo ||
      (eq.ubicacionTecnicaId ? "Ubicación técnica" : "Equipo")
    );
  };

  const estadoActual = orden?.estado || "";

  const handleLiberarOrden = async () => {
    try {
      await onLiberar?.(orden.id);
      onClose?.();
    } catch (error) {
      console.error("Error al liberar OT:", error);
    }
  };

  const handleAbrirCierre = async () => {
    try {
      await onAbrirCierreTecnico?.(orden);
      onClose?.();
    } catch (error) {
      console.error("Error al abrir cierre técnico:", error);
    }
  };

  const handleCambiarEstadoOrden = async (nuevoEstado) => {
    try {
      await onUpdateEstado?.(orden.id, nuevoEstado);
      onClose?.();
    } catch (error) {
      console.error("Error al cambiar estado de OT:", error);
    }
  };

  const handleEditarOT = async (payload) => {
    try {
      setGuardandoEdicion(true);

      const response = await updateOrdenTrabajoCompleta(orden.id, payload);
      const ordenActualizada = response?.data || response;

      setOpenEditarOT(false);

      if (typeof onOrdenActualizada === "function") {
        await onOrdenActualizada(ordenActualizada);
      }

      onClose?.();
    } catch (error) {
      console.error("Error al editar la OT:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "No se pudo actualizar la orden de trabajo"
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const renderActionButtons = () => {
    if (!orden) return null;

    return (
      <div className="flex gap-2 flex-wrap justify-end">
        <button
          onClick={() => setOpenEditarOT(true)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          disabled={guardandoEdicion}
        >
          <Edit className="w-4 h-4" />
          {guardandoEdicion ? "Guardando..." : "Editar"}
        </button>

        {estadoActual === "CREADO" && (
          <>
            <button
              onClick={handleLiberarOrden}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Liberar
            </button>

            <button
              onClick={() => handleCambiarEstadoOrden("CANCELADO")}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
          </>
        )}

        {estadoActual === "LIBERADO" && (
          <>
            <button
              onClick={handleAbrirCierre}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Cierre Técnico
            </button>

            <button
              onClick={() => handleCambiarEstadoOrden("CANCELADO")}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
          </>
        )}

        {estadoActual === "CIERRE_TECNICO" && (
          <button
            onClick={() => handleCambiarEstadoOrden("CERRADO")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Cerrar OT
          </button>
        )}
      </div>
    );
  };

  const getSolicitudesCompraDeEquipo = (eq) => {
    const equipoId = eq.equipoId ? String(eq.equipoId) : null;
    const ubicacionTecnicaId = eq.ubicacionTecnicaId
      ? String(eq.ubicacionTecnicaId)
      : null;

    return (solicitudesCompra.especificas || []).filter((s) => {
      const solicitudEquipoId = s.equipo_id ? String(s.equipo_id) : null;
      const solicitudUbicacionId = s.ubicacion_tecnica_id
        ? String(s.ubicacion_tecnica_id)
        : null;

      if (equipoId && solicitudEquipoId === equipoId) return true;
      if (ubicacionTecnicaId && solicitudUbicacionId === ubicacionTecnicaId) return true;

      return false;
    });
  };

  const getSolicitudesAlmacenDeEquipo = (eq) => {
    const equipoId = eq.equipoId ? String(eq.equipoId) : null;
    const ubicacionTecnicaId = eq.ubicacionTecnicaId
      ? String(eq.ubicacionTecnicaId)
      : null;

    return (solicitudesAlmacen.especificas || []).filter((s) => {
      const solicitudEquipoId = s.equipo_id ? String(s.equipo_id) : null;
      const solicitudUbicacionId = s.ubicacion_tecnica_id
        ? String(s.ubicacion_tecnica_id)
        : null;

      if (equipoId && solicitudEquipoId === equipoId) return true;
      if (ubicacionTecnicaId && solicitudUbicacionId === ubicacionTecnicaId) return true;

      return false;
    });
  };

  const getEncargado = (eq) =>
    (eq.trabajadores || []).find((t) => t.esEncargado)?.trabajador || null;

  const abrirSolicitudCompraParaEquipo = (eq) => {
    setTargetSeleccionado({
      id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id),
      type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA",
      nombre: getNombreObjetivo(eq),
      tag: getCodigoObjetivo(eq),
      equipoId: eq.equipoId || null,
      ubicacionTecnicaId: eq.ubicacionTecnicaId || null,
    });
    setOpenSolicitudCompra(true);
  };

  const abrirSolicitudAlmacenParaEquipo = (eq) => {
    setTargetSeleccionado({
      id: String(eq.equipoId || eq.ubicacionTecnicaId || eq.id),
      type: eq.equipoId ? "EQUIPO" : "UBICACION_TECNICA",
      nombre: getNombreObjetivo(eq),
      tag: getCodigoObjetivo(eq),
      equipoId: eq.equipoId || null,
      ubicacionTecnicaId: eq.ubicacionTecnicaId || null,
    });
    setOpenSolicitudAlmacen(true);
  };

  if (!isOpen || !orden) return null;

  const renderTable = (rows = [], tipo = "") => {
    if (!rows.length) {
      return (
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-sm text-slate-500">
          No hay ítems de {tipo}.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr className="text-slate-700">
              <th className="text-left p-2 border-b whitespace-nowrap">Tipo</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Documento</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Fecha</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Item</th>
              <th className="text-left p-2 border-b min-w-[220px]">Descripción</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Cantidad</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Almacén</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Centro Costo</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Proyecto</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Rubro</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Paquete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.rowId || index}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
              >
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.origen)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.documento)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatFecha(row.fecha)}</td>
                <td className="p-2 border-b whitespace-nowrap font-medium">{formatTexto(row.itemCode)}</td>
                <td className="p-2 border-b">{formatTexto(row.description)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.quantity)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.warehouseCode)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.costingCode)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.projectCode)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.rubroSapCode)}</td>
                <td className="p-2 border-b whitespace-nowrap">{formatTexto(row.paqueteTrabajo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getEquipoLabelBySolicitud = (solicitud) => {
    if (!solicitud) return "—";

    if (solicitud.equipo_id) {
      const detalle = equiposDetalleMap[solicitud.equipo_id];
      if (detalle) {
        return `${detalle.nombre || "Equipo"} · ${detalle.codigo || "—"}`;
      }

      const eqOrden = (orden?.equipos || []).find(
        (eq) => String(eq.equipoId) === String(solicitud.equipo_id)
      );

      if (eqOrden) {
        return `${eqOrden.equipo?.nombre || eqOrden.ubicacionTecnica?.nombre || "Equipo"} · ${
          eqOrden.equipo?.codigo || eqOrden.ubicacionTecnica?.codigo || "—"
        }`;
      }

      return "Equipo específico";
    }

    if (solicitud.ubicacion_tecnica_id) {
      const utOrden = (orden?.equipos || []).find(
        (eq) =>
          String(eq.ubicacionTecnicaId) === String(solicitud.ubicacion_tecnica_id)
      );

      if (utOrden) {
        return `${utOrden.ubicacionTecnica?.nombre || "Ubicación técnica"} · ${
          utOrden.ubicacionTecnica?.codigo || "—"
        }`;
      }

      return "Ubicación técnica específica";
    }

    if (solicitud.esGeneral) return "General para la orden";

    return "—";
  };

  const renderSolicitudDetalle = (solicitud, tipo = "compra", equipoLabel = "") => {
    const lineas = Array.isArray(solicitud?.lineas) ? solicitud.lineas : [];

    return (
      <div
        key={solicitud.id}
        className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                  solicitud.esGeneral
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
                }`}
              >
                {solicitud.esGeneral ? "Solicitud General" : "Solicitud Específica"}
              </span>

              <span className="px-2.5 py-1 rounded-md text-xs font-semibold border bg-white text-slate-700 border-slate-200">
                {tipo === "compra" ? "Compra" : "Almacén"}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {solicitud.esGeneral
                ? "Solicitud general de toda la orden"
                : `Pertenece a ${equipoLabel || getEquipoLabelBySolicitud(solicitud)}`}
            </p>
          </div>

          <div className="text-xs text-slate-500 text-right space-y-1">
            <p>
              <span className="font-medium text-slate-700">Documento:</span>{" "}
              {formatTexto(solicitud.docNum || solicitud.numeroDocumento)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Fecha:</span>{" "}
              {formatFecha(solicitud.docDate || solicitud.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 font-medium">Departamento</p>
            <p>{formatTexto(solicitud.department)}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Solicitante</p>
            <p>{formatTexto(solicitud.requester)}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Email</p>
            <p>{formatTexto(solicitud.email)}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Fecha requerida</p>
            <p>{formatTexto(solicitud.requiredDate)}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Pertenece a</p>
            <p>{formatTexto(getEquipoLabelBySolicitud(solicitud))}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Tipo de relación</p>
            <p>
              {solicitud.esGeneral
                ? "General"
                : solicitud.equipo_id
                ? "Equipo"
                : solicitud.ubicacion_tecnica_id
                ? "Ubicación técnica"
                : "—"}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-slate-500 font-medium">Comentarios</p>
            <p>{formatTexto(solicitud.comments)}</p>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-slate-800 mb-2">
            Detalle de líneas ({lineas.length})
          </h5>

          {lineas.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2 border-b whitespace-nowrap">Item</th>
                    <th className="text-left p-2 border-b min-w-[220px]">Descripción</th>
                    <th className="text-left p-2 border-b whitespace-nowrap">Cantidad</th>
                    <th className="text-left p-2 border-b whitespace-nowrap">Almacén</th>
                    <th className="text-left p-2 border-b whitespace-nowrap">Centro costo</th>
                    <th className="text-left p-2 border-b whitespace-nowrap">Proyecto</th>
                    <th className="text-left p-2 border-b whitespace-nowrap">Rubro</th>
                    <th className="text-left p-2 border-b whitespace-nowrap">Paquete</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, index) => (
                    <tr
                      key={linea.id || index}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                    >
                      <td className="p-2 border-b whitespace-nowrap font-medium">
                        {formatTexto(linea.itemCode)}
                      </td>
                      <td className="p-2 border-b">{formatTexto(linea.description)}</td>
                      <td className="p-2 border-b whitespace-nowrap">
                        {formatTexto(linea.quantity)}
                      </td>
                      <td className="p-2 border-b whitespace-nowrap">
                        {formatTexto(linea.warehouseCode)}
                      </td>
                      <td className="p-2 border-b whitespace-nowrap">
                        {formatTexto(linea.costingCode)}
                      </td>
                      <td className="p-2 border-b whitespace-nowrap">
                        {formatTexto(linea.projectCode)}
                      </td>
                      <td className="p-2 border-b whitespace-nowrap">
                        {formatTexto(linea.rubroSapCode || linea.rubro)}
                      </td>
                      <td className="p-2 border-b whitespace-nowrap">
                        {formatTexto(linea.paqueteTrabajo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">
              Sin líneas registradas.
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleConfirmSolicitudCompra = async (data) => {
    try {
      const { contextoOt: contextoOtPayload, solicitudGeneral, solicitudesPorEquipo } = data;
      const requests = [];

      if (tieneLineasValidas(solicitudGeneral)) {
        requests.push(
          createSolicitudCompra(
            buildPayloadBase(contextoOtPayload, solicitudGeneral, {
              esGeneral: true,
              equipo_id: null,
              ubicacion_tecnica_id: null,
            })
          )
        );
      }

      Object.values(solicitudesPorEquipo || {}).forEach((sol) => {
        const targetMeta = sol?.targetMeta || {};

        if (!tieneLineasValidas(sol)) return;

        requests.push(
          createSolicitudCompra(
            buildPayloadBase(contextoOtPayload, sol, {
              esGeneral: false,
              equipo_id: targetMeta.equipo_id || null,
              ubicacion_tecnica_id: targetMeta.ubicacion_tecnica_id || null,
            })
          )
        );
      });

      await Promise.all(requests);

      setOpenSolicitudCompra(false);
      setTargetSeleccionado(null);
      await recargarSolicitudes();
    } catch (error) {
      console.error("Error creando solicitudes de compra:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "No se pudieron crear las solicitudes de compra"
      );
    }
  };

  const handleConfirmSolicitudAlmacen = async (data) => {
    try {
      const { contextoOt: contextoOtPayload, solicitudGeneral, solicitudesPorEquipo } = data;
      const requests = [];

      if (tieneLineasValidas(solicitudGeneral)) {
        requests.push(
          createSolicitudAlmacen(
            buildPayloadBase(contextoOtPayload, solicitudGeneral, {
              esGeneral: true,
              equipo_id: null,
              ubicacion_tecnica_id: null,
            })
          )
        );
      }

      Object.values(solicitudesPorEquipo || {}).forEach((sol) => {
        const targetMeta = sol?.targetMeta || {};

        if (!tieneLineasValidas(sol)) return;

        requests.push(
          createSolicitudAlmacen(
            buildPayloadBase(contextoOtPayload, sol, {
              esGeneral: false,
              equipo_id: targetMeta.equipo_id || null,
              ubicacion_tecnica_id: targetMeta.ubicacion_tecnica_id || null,
            })
          )
        );
      });

      await Promise.all(requests);

      setOpenSolicitudAlmacen(false);
      setTargetSeleccionado(null);
      await recargarSolicitudes();
    } catch (error) {
      console.error("Error creando solicitudes de almacén:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "No se pudieron crear las solicitudes de almacén"
      );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-[95vw] rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
          <div className="border-b border-slate-200 px-5 py-4 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Orden de Trabajo
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {formatTexto(orden.numeroOT)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 ml-auto">
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span
                    className={`px-3 py-1 rounded-md border text-xs font-semibold ${
                      estadoColor[orden.estado] ||
                      "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {formatTexto(orden.estado)}
                  </span>
                </div>

                {renderActionButtons()}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("informacion")}
                className={`px-3 py-1.5 rounded-md text-sm border transition ${
                  tab === "informacion"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Información OT
              </button>

              <button
                onClick={() => setTab("solicitudes")}
                className={`px-3 py-1.5 rounded-md text-sm border transition ${
                  tab === "solicitudes"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Solicitudes
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {tab === "informacion" && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-md border text-xs font-semibold ${
                      estadoColor[orden.estado] ||
                      "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {formatTexto(orden.estado)}
                  </span>

                  <span className="text-sm text-slate-600">
                    Tipo: {formatTexto(orden.tipoMantenimiento)}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-600" />
                    Información General
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="md:col-span-2">
                      <p className="text-slate-500 font-medium">Descripción</p>
                      <p className="text-slate-800">{formatTexto(orden.descripcionGeneral)}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 font-medium">Inicio Programado</p>
                      <p>{formatFecha(orden.fechaProgramadaInicio)}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 font-medium">Fin Programado</p>
                      <p>{formatFecha(orden.fechaProgramadaFin)}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-slate-500 font-medium">Observaciones</p>
                      <p>{formatTexto(orden.observaciones)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-slate-600" />
                    Solicitudes Generales de la Orden
                  </h3>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-slate-800">
                          Solicitud de compra general
                        </h4>
                        <span className="text-xs text-slate-500">
                          {(solicitudesCompra.generales || []).length} registros
                        </span>
                      </div>

                      {(solicitudesCompra.generales || []).length > 0 ? (
                        <div className="space-y-3">
                          {solicitudesCompra.generales.map((sol) =>
                            renderSolicitudDetalle(sol, "compra", "General para toda la orden")
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-white p-3">
                          No hay solicitud de compra general.
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-slate-800">
                          Solicitud de almacén general
                        </h4>
                        <span className="text-xs text-slate-500">
                          {(solicitudesAlmacen.generales || []).length} registros
                        </span>
                      </div>

                      {(solicitudesAlmacen.generales || []).length > 0 ? (
                        <div className="space-y-3">
                          {solicitudesAlmacen.generales.map((sol) =>
                            renderSolicitudDetalle(sol, "almacen", "General para toda la orden")
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-white p-3">
                          No hay solicitud de almacén general.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-600" />
                    Resumen por Equipo ({orden.equipos?.length || 0})
                  </h3>

                  <div className="space-y-4">
                    {(orden.equipos || []).map((eq, index) => {
                      const encargado = getEncargado(eq);
                      const solicitudesCompraEquipo = getSolicitudesCompraDeEquipo(eq);
                      const solicitudesAlmacenEquipo = getSolicitudesAlmacenDeEquipo(eq);
                      const tono = getTonoEquipo(index);
                      const nombreEquipo = getNombreObjetivo(eq);
                      const codigoEquipo = getCodigoObjetivo(eq);
                      const tipoEquipo = getTipoObjetivo(eq);

                      return (
                        <div key={eq.id} className={`border rounded-2xl p-4 ${tono.card}`}>
                          <div
                            className={`rounded-xl border px-4 py-3 mb-4 flex flex-wrap items-start justify-between gap-3 ${tono.header}`}
                          >
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                                Equipo {index + 1}
                              </p>
                              <p className="font-bold text-lg">{formatTexto(nombreEquipo)}</p>
                              <p className="text-sm opacity-90">
                                {formatTexto(codigoEquipo)} · {formatTexto(tipoEquipo)}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${tono.badge}`}>
                                Estado: {formatTexto(eq.estadoEquipo)}
                              </span>
                              <span className="text-xs px-2.5 py-1 rounded-md border bg-white/80 text-slate-700 border-white/70">
                                Prioridad: {formatTexto(eq.prioridad)}
                              </span>
                            </div>
                          </div>

                          {eq.equipoId && (
                            <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                              <SectionTitle icon={Package} title="Detalle del equipo" />

                              {loadingEquiposDetalle ? (
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Cargando detalle del equipo...
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-slate-500 font-medium">Nombre</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.nombre)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Código</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.codigo)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Tipo</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.tipoEquipo)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Marca</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.marca)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Modelo</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.modelo)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Serie</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.serie)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Inicio programado</p>
                                    <p>{formatFecha(eq.fechaInicioProgramada)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Fin programado</p>
                                    <p>{formatFecha(eq.fechaFinProgramada)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Plan</p>
                                    <p>{formatTexto(eq.planMantenimiento?.nombre)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Ubicación técnica</p>
                                    <p>{formatTexto(eq.ubicacionTecnica?.nombre)}</p>
                                  </div>

                                  <div>
                                    <p className="text-slate-500 font-medium">Encargado</p>
                                    <p>
                                      {encargado
                                        ? `${formatTexto(encargado.nombre)} ${formatTexto(encargado.apellido)}`
                                        : "—"}
                                    </p>
                                  </div>

                                  <div className="md:col-span-3">
                                    <p className="text-slate-500 font-medium">Descripción del trabajo</p>
                                    <p>{formatTexto(eq.descripcionEquipo)}</p>
                                  </div>

                                  <div className="md:col-span-3">
                                    <p className="text-slate-500 font-medium">Descripción del equipo</p>
                                    <p>{formatTexto(getEquipoDetalle(eq)?.descripcion)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                            <SectionTitle
                              icon={CheckCircle2}
                              title={`Actividades (${eq.actividades?.length || 0})`}
                            />

                            {eq.actividades?.length > 0 ? (
                              <div className="space-y-3">
                                {eq.actividades.map((act, idx) => (
                                  <div
                                    key={act.id || idx}
                                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                  >
                                    <p className="font-semibold text-slate-900 mb-2">
                                      {formatTexto(
                                        act.tarea || act.descripcion || `Actividad ${idx + 1}`
                                      )}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                      <div>
                                        <p className="text-slate-500 font-medium">Tipo trabajo</p>
                                        <p>{formatTexto(act.tipoTrabajo)}</p>
                                      </div>

                                      <div>
                                        <p className="text-slate-500 font-medium">Estado</p>
                                        <p>{formatTexto(act.estado)}</p>
                                      </div>

                                      <div>
                                        <p className="text-slate-500 font-medium">Origen</p>
                                        <p>{formatTexto(act.origen)}</p>
                                      </div>

                                      <div>
                                        <p className="text-slate-500 font-medium">Sistema</p>
                                        <p>{formatTexto(act.sistema)}</p>
                                      </div>

                                      <div>
                                        <p className="text-slate-500 font-medium">Subsistema</p>
                                        <p>{formatTexto(act.subsistema)}</p>
                                      </div>

                                      <div>
                                        <p className="text-slate-500 font-medium">Componente</p>
                                        <p>{formatTexto(act.componente)}</p>
                                      </div>

                                      <div>
                                        <p className="text-slate-500 font-medium">Duración estimada</p>
                                        <p>
                                          {formatTexto(act.duracionEstimadaValor)}{" "}
                                          {formatTexto(act.unidadDuracion)}
                                        </p>
                                      </div>

                                      <div className="md:col-span-2">
                                        <p className="text-slate-500 font-medium">Observaciones</p>
                                        <p>{formatTexto(act.observaciones)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">
                                Sin actividades registradas.
                              </div>
                            )}
                          </div>

                          <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                            <SectionTitle
                              icon={Users}
                              title={`Trabajadores (${eq.trabajadores?.length || 0})`}
                            />

                            {eq.trabajadores?.length > 0 ? (
                              <div className="space-y-2">
                                {eq.trabajadores.map((t) => {
                                  const trabajador = t.trabajador || {};

                                  return (
                                    <div
                                      key={t.id}
                                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                                    >
                                      <div>
                                        <p className="font-medium text-slate-900">
                                          {formatTexto(trabajador.nombre)} {formatTexto(trabajador.apellido)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {formatTexto(
                                            trabajador.rol ? trabajador.rol.replaceAll("_", " ") : "—"
                                          )}{" "}
                                          · {formatTexto(trabajador.empresa)}
                                        </p>
                                      </div>

                                      {t.esEncargado && (
                                        <span className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                          <Star className="w-3 h-3" />
                                          Encargado
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">
                                Sin trabajadores asignados.
                              </div>
                            )}
                          </div>

                          <div className={`mb-4 rounded-xl border p-4 ${tono.section}`}>
                            <div className="flex items-center justify-between mb-3">
                              <SectionTitle icon={ShoppingCart} title="Solicitud de compra de este equipo" />
                              <button
                                onClick={() => abrirSolicitudCompraParaEquipo(eq)}
                                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Agregar
                              </button>
                            </div>

                            {solicitudesCompraEquipo.length > 0 ? (
                              <div className="space-y-3">
                                {solicitudesCompraEquipo.map((sol) =>
                                  renderSolicitudDetalle(sol, "compra", nombreEquipo)
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">
                                Este equipo no tiene solicitud de compra específica.
                              </div>
                            )}
                          </div>

                          <div className={`rounded-xl border p-4 ${tono.section}`}>
                            <div className="flex items-center justify-between mb-3">
                              <SectionTitle icon={Boxes} title="Solicitud de almacén de este equipo" />
                              <button
                                onClick={() => abrirSolicitudAlmacenParaEquipo(eq)}
                                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Agregar
                              </button>
                            </div>

                            {solicitudesAlmacenEquipo.length > 0 ? (
                              <div className="space-y-3">
                                {solicitudesAlmacenEquipo.map((sol) =>
                                  renderSolicitudDetalle(sol, "almacen", nombreEquipo)
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50 p-3">
                                Este equipo no tiene solicitud de almacén específica.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    Fechas Reales
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium">Inicio Real</p>
                      <p>{formatFecha(orden.fechaInicioReal)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Fin Real</p>
                      <p>{formatFecha(orden.fechaFinReal)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Cierre</p>
                      <p>{formatFecha(orden.fechaCierre)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === "solicitudes" && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-base font-semibold mb-3">Tratamiento</h3>

                  {loadingSolicitudes ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando...
                    </div>
                  ) : errorSolicitudes ? (
                    <div className="text-sm text-red-600">{errorSolicitudes}</div>
                  ) : tratamiento ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Nombre</p>
                        <p>{formatTexto(tratamiento.nombre)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Estado</p>
                        <p>{formatTexto(tratamiento.estado)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-slate-500 font-medium">Descripción</p>
                        <p>{formatTexto(tratamiento.descripcion)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No hay tratamiento relacionado.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-slate-600" />
                        Solicitud de Compra
                      </h3>
                      <span className="text-xs text-slate-500">
                        {lineasCompra.length} ítems
                      </span>
                    </div>

                    {loadingSolicitudes ? (
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando...
                      </div>
                    ) : errorSolicitudes ? (
                      <div className="text-sm text-red-600">{errorSolicitudes}</div>
                    ) : (
                      renderTable(lineasCompra, "compra")
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-slate-600" />
                        Solicitud de Almacén
                      </h3>
                      <span className="text-xs text-slate-500">
                        {lineasAlmacen.length} ítems
                      </span>
                    </div>

                    {loadingSolicitudes ? (
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando...
                      </div>
                    ) : errorSolicitudes ? (
                      <div className="text-sm text-red-600">{errorSolicitudes}</div>
                    ) : (
                      renderTable(lineasAlmacen, "almacén")
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="px-5 py-3 border-t bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <ModalSolicitudCompra
        isOpen={openSolicitudCompra}
        onClose={() => {
          setOpenSolicitudCompra(false);
          setTargetSeleccionado(null);
        }}
        onConfirm={handleConfirmSolicitudCompra}
        targets={targetSeleccionado ? [targetSeleccionado] : contextoOt.targets}
        contextoOt={contextoOt}
        soloContextoOt={true}
      />

      <ModalSolicitudAlmacen
        isOpen={openSolicitudAlmacen}
        onClose={() => {
          setOpenSolicitudAlmacen(false);
          setTargetSeleccionado(null);
        }}
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