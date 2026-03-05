import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

import { crearNotificacionService, getNotificacionesByOT, abrirPdfNotificacion } from "../services/notificacionService";
import { getTrabajadores } from "../../mantenimiento/services/trabajadoresService";
import { getOrdenTrabajoById } from "../../mantenimiento/services/ordenTrabajoService";

/** =========================
 * Modal: Elegir equipo (con estado + PDF + bloqueo)
 * ========================= */
function ModalElegirEquipo({
  open,
  equipos = [],
  notiByEquipoOTId,
  onSelect,
  onClose,
}) {
  if (!open) return null;

  const handleCardKeyDown = (e, eq, creado) => {
    if (creado) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(eq);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Seleccionar equipo para Notificación</h3>
            <p className="text-white/80 text-xs mt-0.5">
              Equipos con notificación creada están bloqueados y con botón PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg hover:bg-white/15"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {equipos.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No hay equipos en la OT.</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {equipos.map((eq) => {
                const label =
                  eq?.numeroEquipo ||
                  eq?.equipo?.codigo ||
                  eq?.equipo?.nombre ||
                  eq?.descripcionEquipo ||
                  `Equipo ${eq.id}`;

                const sub =
                  eq?.equipo?.nombre
                    ? `${eq.equipo.nombre}${eq.equipo.codigo ? ` • ${eq.equipo.codigo}` : ""}`
                    : eq?.descripcionEquipo || "";

                const acts = Array.isArray(eq.actividades) ? eq.actividades.length : 0;

                const noti = notiByEquipoOTId?.get(eq.id);
                const creado = !!noti;

                return (
                  <div
                    key={eq.id}
                    role="button"
                    tabIndex={creado ? -1 : 0}
                    aria-disabled={creado}
                    onClick={() => !creado && onSelect(eq)}
                    onKeyDown={(e) => handleCardKeyDown(e, eq, creado)}
                    className={[
                      "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between gap-3 select-none",
                      creado
                        ? "border-emerald-300 bg-emerald-50 opacity-90 cursor-not-allowed"
                        : "border-slate-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer",
                      !creado ? "focus:outline-none focus:ring-2 focus:ring-amber-500" : "",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{label}</div>
                      {sub ? (
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{sub}</div>
                      ) : null}

                      {creado ? (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          Notificación creada{" "}
                          <span className="text-emerald-800/70 font-semibold">#{noti?.id}</span>
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                          <AlertCircle className="w-4 h-4" />
                          Pendiente
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                        {acts} actividad(es)
                      </span>

                      {creado ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ no dispara selección del card
                            abrirPdfNotificacion(noti.id);
                          }}
                          className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                          title="Abrir PDF"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-600">
                          <Lock className="w-4 h-4" />
                          Crear
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border-2 border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/** =========================
 * Modal: Crear Notificación (1 por equipo OT)
 * - muestra notificaciones ya creadas
 * - selector de equipo primero
 * - bloquea equipos con notificación
 * - botón PDF
 * - al guardar refresca lista y vuelve a selector
 * ========================= */
const CrearNotificacionModal = ({ isOpen, onClose, ordenTrabajoId }) => {
  const [ordenTrabajo, setOrdenTrabajo] = useState(null);
  const [loadingOrden, setLoadingOrden] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);

  const [activeTab, setActiveTab] = useState("general");

  // ✅ Equipo OT seleccionado
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  // ✅ Selector de equipo
  const [openSelectEquipo, setOpenSelectEquipo] = useState(false);

  // ✅ Notificaciones ya creadas para esta OT
  const [notificacionesOT, setNotificacionesOT] = useState([]);
  const [loadingNotis, setLoadingNotis] = useState(false);

  const [form, setForm] = useState({
    fechaInicio: "",
    fechaFin: "",
    fechaUltimoMantenimientoPreventivo: "",
    horometro: "",
    numeroMisiones: "",
    numeroEquipo: "",
    codigoRepuesto: "",
    descripcionMantenimiento: "",
    descripcionGeneral: "",
    observaciones: "",
    recomendaciones: "",
    estadoGeneralEquipo: "OPERATIVO",
    tecnicos: [],
    planes: [], // { ordenTrabajoActividadId, planMantenimientoId|null, estado, comentario }
  });

  const [listaTrabajadores, setListaTrabajadores] = useState([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [busquedaNombre, setBusquedaNombre] = useState("");

  const [correctivos, setCorrectivos] = useState([]);
  const [fotosAntes, setFotosAntes] = useState([]);
  const [fotosDespues, setFotosDespues] = useState([]);

  // docs opcionales
  const [acta, setActa] = useState(null);
  const [informe, setInforme] = useState(null);
  const [checklistAdjunto, setChecklistAdjunto] = useState(null);
  const [archivoExtra, setArchivoExtra] = useState(null);

  /** =========================
   * Helpers carga
   * ========================= */
  const cargarOrdenTrabajo = async () => {
    try {
      setLoadingOrden(true);
      const data = await getOrdenTrabajoById(ordenTrabajoId);
      setOrdenTrabajo(data);

      // OJO: no auto-seleccionamos si hay múltiples (queremos selector primero)
      const equipos = Array.isArray(data?.equipos) ? data.equipos : [];
      if (equipos.length === 1) {
        setEquipoSeleccionado(equipos[0]);
      } else {
        setEquipoSeleccionado(null);
      }
    } catch (error) {
      console.error("Error al cargar orden de trabajo:", error);
      setOrdenTrabajo(null);
      setEquipoSeleccionado(null);
    } finally {
      setLoadingOrden(false);
    }
  };

  const cargarNotificacionesOT = async () => {
    try {
      setLoadingNotis(true);
      const data = await getNotificacionesByOT(ordenTrabajoId);
      setNotificacionesOT(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al listar notificaciones OT:", error);
      setNotificacionesOT([]);
    } finally {
      setLoadingNotis(false);
    }
  };

  const cargarTrabajadores = async () => {
    try {
      setLoadingTrabajadores(true);
      const data = await getTrabajadores();
      setListaTrabajadores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
      setListaTrabajadores([]);
    } finally {
      setLoadingTrabajadores(false);
    }
  };

  const resetForm = () => {
    setForm({
      fechaInicio: "",
      fechaFin: "",
      fechaUltimoMantenimientoPreventivo: "",
      horometro: "",
      numeroMisiones: "",
      numeroEquipo: "",
      codigoRepuesto: "",
      descripcionMantenimiento: "",
      descripcionGeneral: "",
      observaciones: "",
      recomendaciones: "",
      estadoGeneralEquipo: "OPERATIVO",
      tecnicos: [],
      planes: [],
    });

    setCorrectivos([]);
    setTecnicosSeleccionados([]);
    setFiltroRol("");
    setBusquedaNombre("");
    setFotosAntes([]);
    setFotosDespues([]);
    setActa(null);
    setInforme(null);
    setChecklistAdjunto(null);
    setArchivoExtra(null);
    setActiveTab("general");
  };

  /** =========================
   * Effects (NO hooks condicionales)
   * ========================= */
  useEffect(() => {
    if (!isOpen || !ordenTrabajoId) return;

    (async () => {
      resetForm();
      await Promise.all([cargarOrdenTrabajo(), cargarTrabajadores(), cargarNotificacionesOT()]);
    })();
  }, [isOpen, ordenTrabajoId]);

  // abrir selector cuando abre el modal
  useEffect(() => {
    if (!isOpen) return;
    setOpenSelectEquipo(true);
  }, [isOpen]);

  /** =========================
   * Computed
   * ========================= */
  const equiposOT = useMemo(() => {
    if (!ordenTrabajo?.equipos) return [];
    return ordenTrabajo.equipos.map((eq) => ({
      ...eq,
      actividades: Array.isArray(eq.actividades) ? eq.actividades : [],
    }));
  }, [ordenTrabajo]);

  const notiByEquipoOTId = useMemo(() => {
    const map = new Map();
    (notificacionesOT || []).forEach((n) => {
      if (n?.ordenTrabajoEquipoId) map.set(n.ordenTrabajoEquipoId, n);
    });
    return map;
  }, [notificacionesOT]);

  const actividadesEquipoSeleccionado = useMemo(() => {
    if (!equipoSeleccionado) return [];
    const eq = equiposOT.find((x) => x.id === equipoSeleccionado.id);
    return Array.isArray(eq?.actividades) ? eq.actividades : [];
  }, [equipoSeleccionado, equiposOT]);

  const totalActividades = actividadesEquipoSeleccionado.length;

  const checklistCompletado = useMemo(
    () =>
      form.planes.filter(
        (p) =>
          actividadesEquipoSeleccionado.some((a) => a.id === p.ordenTrabajoActividadId) &&
          !!p.estado
      ).length,
    [form.planes, actividadesEquipoSeleccionado]
  );

  const labelEquipoSeleccionado = useMemo(() => {
    if (!equipoSeleccionado) return "No seleccionado";
    return (
      equipoSeleccionado?.numeroEquipo ||
      equipoSeleccionado?.equipo?.codigo ||
      equipoSeleccionado?.equipo?.nombre ||
      equipoSeleccionado?.descripcionEquipo ||
      `Equipo ${equipoSeleccionado.id}`
    );
  }, [equipoSeleccionado]);

  const notiActual = useMemo(() => {
    if (!equipoSeleccionado?.id) return null;
    return notiByEquipoOTId.get(equipoSeleccionado.id) || null;
  }, [equipoSeleccionado, notiByEquipoOTId]);

  const yaExisteNotiEquipo = !!notiActual;

  const progresoEquipos = useMemo(() => {
    const total = equiposOT.length;
    const hechas = notificacionesOT.length;
    return { total, hechas, faltan: Math.max(0, total - hechas) };
  }, [equiposOT.length, notificacionesOT.length]);

  /** =========================
   * Cuando selecciona equipo:
   * - set numeroEquipo
   * - limpiar planes del equipo anterior
   * - si ya existe noti, bloquear submit (UI)
   * ========================= */
  useEffect(() => {
  if (!equipoSeleccionado) return;

  const label =
    equipoSeleccionado?.numeroEquipo ||
    equipoSeleccionado?.equipo?.codigo ||
    equipoSeleccionado?.descripcionEquipo ||
    "";

  // ✅ buscar el equipo “completo” dentro de equiposOT (ahí vienen actividades + trabajadores)
  const eqFull = equiposOT.find((x) => x.id === equipoSeleccionado.id);

  // ✅ trabajadores asignados en OT para este equipo
  const trabajadoresOT = Array.isArray(eqFull?.trabajadores) ? eqFull.trabajadores : [];

  // ⚠️ según tu include, cada item puede venir como:
  // { trabajadorId, esEncargado, trabajador: { id, nombre, apellido, rol, empresa } }
  const tecnicosAuto = trabajadoresOT
    .map((tw) => {
      const w = tw?.trabajador;
      const id = tw?.trabajadorId || w?.id;
      if (!id) return null;

      const nombre = `${w?.nombre || ""} ${w?.apellido || ""}`.trim() || `Trabajador ${id}`;
      const rol = (w?.rol || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        id,
        nombre,
        rol: rol || "—",
        empresa: w?.empresa || "—",
        esEncargado: !!tw?.esEncargado,
      };
    })
    .filter(Boolean);

  // ✅ set
  setTecnicosSeleccionados(tecnicosAuto);

  // ✅ limpia planes del equipo anterior (pero deja técnicos precargados)
  setForm((prev) => ({ ...prev, numeroEquipo: label, planes: [] }));
  setActiveTab("general");
}, [equipoSeleccionado, equiposOT]);

  /** =========================
   * Handlers básicos
   * ========================= */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Técnicos
  const agregarTecnico = (trabajadorId) => {
    const trabajador = listaTrabajadores.find((t) => t.id === trabajadorId);
    if (!trabajador) return;

    if (tecnicosSeleccionados.some((t) => t.id === trabajadorId)) {
      alert("Este técnico ya fue agregado");
      return;
    }

    const rolFormateado = (trabajador.rol || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    setTecnicosSeleccionados((prev) => [
      ...prev,
      {
        id: trabajador.id,
        nombre: `${trabajador.nombre} ${trabajador.apellido || ""}`.trim(),
        rol: rolFormateado,
        empresa: trabajador.empresa,
      },
    ]);
  };

  const eliminarTecnico = (id) => {
    setTecnicosSeleccionados((prev) => prev.filter((t) => t.id !== id));
  };

  // Checklist
  const getActividad = (actividadId) =>
    form.planes.find((p) => p.ordenTrabajoActividadId === actividadId);

  const handleActividadEstado = (actividad, estado) => {
    const resto = form.planes.filter((p) => p.ordenTrabajoActividadId !== actividad.id);

    const prev = getActividad(actividad.id);

resto.push({
  ordenTrabajoActividadId: actividad.id,
  planMantenimientoId: null,
  estado,
  comentario: prev?.comentario || "",
  trabajadorId: prev?.trabajadorId ?? null, 
});

    setForm((prev) => ({ ...prev, planes: resto }));
  };

  const handleActividadComentario = (actividad, comentario) => {
    const existente = getActividad(actividad.id);

    if (!existente) {
      setForm((prev) => ({
        ...prev,
        planes: [
          ...prev.planes,
          {
            ordenTrabajoActividadId: actividad.id,
            planMantenimientoId: null,
            estado: null,
            comentario,
            trabajadorId 
          },
        ],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        planes: prev.planes.map((p) =>
          p.ordenTrabajoActividadId === actividad.id ? { ...p, comentario } : p
        ),
      }));
    }
  };

  const handleActividadTrabajador = (actividad, trabajadorId) => {
  const existente = getActividad(actividad.id);

  if (!existente) {
    setForm((prev) => ({
      ...prev,
      planes: [
        ...prev.planes,
        {
          ordenTrabajoActividadId: actividad.id,
          planMantenimientoId: null,
          estado: null,
          comentario: "",
          trabajadorId: trabajadorId || null,
        },
      ],
    }));
  } else {
    setForm((prev) => ({
      ...prev,
      planes: prev.planes.map((p) =>
        p.ordenTrabajoActividadId === actividad.id
          ? { ...p, trabajadorId: trabajadorId || null }
          : p
      ),
    }));
  }
};

  // Correctivos
  const agregarCorrectivo = () => {
    setCorrectivos((prev) => [...prev, { id: Date.now(), fotos: [], comentario: "" }]);
  };
  const eliminarCorrectivo = (id) => {
    setCorrectivos((prev) => prev.filter((c) => c.id !== id));
  };
  const actualizarComentarioCorrectivo = (id, comentario) => {
    setCorrectivos((prev) => prev.map((c) => (c.id === id ? { ...c, comentario } : c)));
  };
  const actualizarFotosCorrectivo = (id, files) => {
    setCorrectivos((prev) => prev.map((c) => (c.id === id ? { ...c, fotos: files } : c)));
  };

  // Adjuntos (preview local)
  const convertirAdjuntos = () => {
    const lista = [];

    const mapFiles = (files, categoria) => {
      Array.from(files).forEach((file) => {
        lista.push({
          nombre: file.name,
          url: URL.createObjectURL(file),
          extension: file.name.split(".").pop(),
          categoria,
          ordenTrabajoId: ordenTrabajo?.id || null,
          ordenTrabajoEquipoId: equipoSeleccionado?.id || null,
        });
      });
    };

    if (fotosAntes?.length) mapFiles(fotosAntes, "ANTES");
    if (fotosDespues?.length) mapFiles(fotosDespues, "DESPUES");
    correctivos.forEach((c) => c.fotos?.length && mapFiles(c.fotos, "CORRECTIVO"));

    if (acta)
      lista.push({
        nombre: acta.name,
        url: URL.createObjectURL(acta),
        extension: acta.name.split(".").pop(),
        categoria: "ACTA_CONFORMIDAD",
      });

    if (informe)
      lista.push({
        nombre: informe.name,
        url: URL.createObjectURL(informe),
        extension: informe.name.split(".").pop(),
        categoria: "INFORME",
      });

    if (checklistAdjunto)
      lista.push({
        nombre: checklistAdjunto.name,
        url: URL.createObjectURL(checklistAdjunto),
        extension: checklistAdjunto.name.split(".").pop(),
        categoria: "CHECKLIST",
      });

    if (archivoExtra)
      lista.push({
        nombre: archivoExtra.name,
        url: URL.createObjectURL(archivoExtra),
        extension: archivoExtra.name.split(".").pop(),
        categoria: "OTRO",
      });

    return lista;
  };

  /** =========================
   * Submit
   * - crea notificación 1x equipo
   * - refresca notificaciones OT
   * - vuelve a selector para elegir el siguiente
   * ========================= */
  const handleSubmit = async () => {
    try {
      if (!equipoSeleccionado?.id) {
        alert("⚠️ Debes seleccionar un equipo");
        setOpenSelectEquipo(true);
        return;
      }

      if (yaExisteNotiEquipo) {
        alert("⚠️ Este equipo ya tiene notificación. Puedes abrir su PDF.");
        return;
      }

      if (!form.fechaInicio || !form.fechaFin) {
        alert("⚠️ Fechas de inicio y fin son obligatorias");
        return;
      }

      if (tecnicosSeleccionados.length === 0) {
        const confirmar = window.confirm("No has seleccionado técnicos. ¿Deseas continuar?");
        if (!confirmar) return;
      }

      setLoading(true);

      const adjuntos = convertirAdjuntos();
      const resumenCorrectivos = correctivos
        .map((c, i) => `${i + 1}. ${c.comentario}`.trim())
        .filter(Boolean)
        .join("\n");

      // SOLO planes del equipo seleccionado
      const setIdsActs = new Set(actividadesEquipoSeleccionado.map((a) => a.id));
      const planesFiltrados = (form.planes || []).filter((p) => setIdsActs.has(p.ordenTrabajoActividadId));

      await crearNotificacionService({
        ...form,
        resumenCorrectivos,
        ordenTrabajoId: ordenTrabajo?.id,
        ordenTrabajoEquipoId: equipoSeleccionado.id,
        precargarPlanes: planesFiltrados.length === 0,
        planes: planesFiltrados.map((p) => ({
          ...p,
          planMantenimientoId: null, 
            trabajadorId: p.trabajadorId ?? null,
        })),
        horometro: form.horometro ? Number(form.horometro) : null,
        numeroMisiones: form.numeroMisiones ? Number(form.numeroMisiones) : null,
        tecnicos: tecnicosSeleccionados.map((t) => t.id),
        adjuntos,
      });

      // refrescar lista para bloquear equipo + mostrar PDF
      await cargarNotificacionesOT();

      alert("✅ Notificación creada. Elige el siguiente equipo.");
      resetForm();
      setEquipoSeleccionado(null);
      setOpenSelectEquipo(true);
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error.message ||
        "Error desconocido";
      alert("❌ Error al crear notificación: " + msg);
    } finally {
      setLoading(false);
    }
  };

  /** =========================
   * UI helpers
   * ========================= */
  const ESTADO_CONFIG = {
    OK: { label: "✓ OK", active: "bg-emerald-500 text-white shadow-md", hover: "hover:border-emerald-500" },
    NO_OK: { label: "✗ NO OK", active: "bg-red-500 text-white shadow-md", hover: "hover:border-red-500" },
    NO_APLICA: { label: "— N/A", active: "bg-slate-500 text-white shadow-md", hover: "hover:border-slate-500" },
  };

  const estadoBadgeColor = (estado) => {
    if (estado === "OK") return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (estado === "NO_OK") return "bg-red-100 text-red-700 border-red-300";
    if (estado === "NO_APLICA") return "bg-slate-100 text-slate-600 border-slate-300";
    return "bg-amber-50 text-amber-600 border-amber-200";
  };

  const tipoTrabajoColor = (tipo) => {
    if (!tipo) return "bg-blue-100 text-blue-700";
    switch (tipo) {
      case "REVISION": return "bg-blue-100 text-blue-700";
      case "INSPECCION": return "bg-indigo-100 text-indigo-700";
      case "CAMBIO": return "bg-red-100 text-red-700";
      case "LIMPIEZA": return "bg-cyan-100 text-cyan-700";
      case "LUBRICACION": return "bg-yellow-100 text-yellow-700";
      case "AJUSTE": return "bg-orange-100 text-orange-700";
      case "APLICACION": return "bg-green-100 text-green-700";
      case "TORQUEO_REGULACION": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const countOK = form.planes.filter((p) => p.estado === "OK").length;
  const countNO_OK = form.planes.filter((p) => p.estado === "NO_OK").length;
  const countNA = form.planes.filter((p) => p.estado === "NO_APLICA").length;
  const countPending = totalActividades - countOK - countNO_OK - countNA;
  const checklistDone = countPending === 0 && totalActividades > 0;

  const tabs = [
    { id: "general", label: "General", icon: "📋" },
    {
      id: "checklist",
      label: "Checklist",
      icon: "☑️",
      badge:
        totalActividades > 0
          ? { text: `${checklistCompletado}/${totalActividades}`, done: checklistDone }
          : null,
    },
    {
      id: "correctivos",
      label: "Correctivos",
      icon: "🔧",
      badge: correctivos.length > 0 ? { text: correctivos.length, done: false } : null,
    },
    { id: "adjuntos", label: "Adjuntos", icon: "📎" },
  ];

  if (!isOpen) return null;

  /** =========================
   * Render
   * ========================= */
  return (
    <>
      <ModalElegirEquipo
        open={openSelectEquipo}
        equipos={equiposOT}
        notiByEquipoOTId={notiByEquipoOTId}
        onClose={() => setOpenSelectEquipo(false)}
        onSelect={(eq) => {
          setEquipoSeleccionado(eq);
          setOpenSelectEquipo(false);
        }}
      />

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] lg:max-w-7xl my-8">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-6 rounded-t-3xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-4xl">✅</span>
                  Cierre Técnico (Notificación por equipo)
                </h2>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <p className="text-amber-100 text-sm">
                    OT #{ordenTrabajo?.numeroOT || ordenTrabajo?.id}
                  </p>

                  <span className="text-amber-100 text-sm">•</span>

                  <p className="text-amber-100 text-sm">
                    Progreso:{" "}
                    <span className="font-bold">
                      {progresoEquipos.hechas}/{progresoEquipos.total}
                    </span>{" "}
                    (faltan {progresoEquipos.faltan})
                  </p>

                  <span className="text-amber-100 text-sm">•</span>

                  <p className="text-amber-100 text-sm truncate">
                    Equipo:{" "}
                    <span className="font-bold">{labelEquipoSeleccionado}</span>
                  </p>

                  <button
                    type="button"
                    onClick={() => setOpenSelectEquipo(true)}
                    className="ml-2 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white hover:bg-white/30"
                    disabled={loadingOrden || loadingNotis}
                  >
                    Elegir/Cambiar equipo
                  </button>

                  {yaExisteNotiEquipo && (
                    <button
                      type="button"
                      onClick={() => abrirPdfNotificacion(notiActual.id)}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
                      title="Abrir PDF del equipo seleccionado"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                  )}
                </div>

                {(loadingOrden || loadingNotis) && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando OT / Notificaciones...
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:rotate-90"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ALERT si equipo ya tiene notificación */}
          {yaExisteNotiEquipo && (
            <div className="px-6 pt-5">
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-800">
                      Este equipo ya tiene Notificación creada.
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Está bloqueado para evitar duplicados. Puedes abrir el PDF cuando lo necesites.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => abrirPdfNotificacion(notiActual.id)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          )}

          {/* TABS */}
          <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white mt-5">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-8 py-4 font-bold transition-all whitespace-nowrap relative
                    ${activeTab === tab.id
                      ? "text-amber-600 bg-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`
                        text-xs font-bold px-2 py-0.5 rounded-full
                        ${tab.badge.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}
                      `}>
                        {tab.badge.text}
                      </span>
                    )}
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6">

                {!equipoSeleccionado && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">🖥️</div>
                    <p className="text-sm text-slate-600 mb-2">
                      Primero selecciona un equipo para crear su notificación.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenSelectEquipo(true)}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600"
                    >
                      Elegir equipo
                    </button>
                  </div>
                )}

                {/* FECHAS */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📅</span> Fechas del Mantenimiento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Inicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="fechaInicio"
                        value={form.fechaInicio}
                        onChange={handleChange}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Fin <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="fechaFin"
                        value={form.fechaFin}
                        onChange={handleChange}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Último Preventivo
                      </label>
                      <input
                        type="date"
                        name="fechaUltimoMantenimientoPreventivo"
                        value={form.fechaUltimoMantenimientoPreventivo}
                        onChange={handleChange}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* TÉCNICOS */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">👥</span> Técnicos que Ejecutaron
                  </h3>

                  {tecnicosSeleccionados.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-xs font-bold text-slate-600 mb-2">
                        Seleccionados ({tecnicosSeleccionados.length})
                      </p>
                      {tecnicosSeleccionados.map((tecnico) => (
                        <div
                          key={tecnico.id}
                          className="bg-white rounded-lg p-3 border-2 border-purple-300 flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 rounded-full p-2">
                              <span className="text-base">👤</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{tecnico.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                                  {tecnico.rol}
                                </span>
                                <span className="text-xs text-slate-500">• {tecnico.empresa}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                            onClick={() => eliminarTecnico(tecnico.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-xs font-bold text-slate-700 mb-3">Agregar Técnico</p>

                    {loadingTrabajadores ? (
                      <div className="text-center py-6">
                        <div className="inline-block w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-600 mt-2 text-sm">Cargando trabajadores...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Filtrar por Rol</label>
                            <select
                              value={filtroRol}
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) => setFiltroRol(e.target.value)}
                              className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-100"
                            >
                              <option value="">Todos los roles</option>
                              <option value="tecnico_electrico">Técnico Eléctrico</option>
                              <option value="tecnico_mecanico">Técnico Mecánico</option>
                              <option value="operario_de_mantenimiento">Operario de Mantenimiento</option>
                              <option value="supervisor">Supervisor</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Buscar por Nombre</label>
                            <input
                              type="text"
                              placeholder="Escribe el nombre..."
                              value={busquedaNombre}
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) => setBusquedaNombre(e.target.value)}
                              className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-100"
                            />
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-lg">
                          {(() => {
                            const filtrados = listaTrabajadores.filter((t) => {
                              const rolOk = !filtroRol || t.rol === filtroRol;
                              const nombreOk =
                                !busquedaNombre ||
                                `${t.nombre} ${t.apellido || ""}`.toLowerCase().includes(busquedaNombre.toLowerCase());
                              const noAgregado = !tecnicosSeleccionados.some((s) => s.id === t.id);
                              return rolOk && nombreOk && noAgregado;
                            });

                            if (!equipoSeleccionado) {
                              return (
                                <div className="text-center py-6 text-slate-400">
                                  <p className="text-sm">Selecciona un equipo para agregar técnicos</p>
                                </div>
                              );
                            }

                            if (yaExisteNotiEquipo) {
                              return (
                                <div className="text-center py-6 text-slate-500">
                                  <p className="text-sm font-semibold">Este equipo ya está cerrado.</p>
                                  <p className="text-xs mt-1">Cambia de equipo o abre el PDF.</p>
                                </div>
                              );
                            }

                            if (filtrados.length === 0) {
                              return (
                                <div className="text-center py-6 text-slate-400">
                                  <p className="text-sm">No hay trabajadores disponibles</p>
                                  <p className="text-xs mt-1">Intenta cambiar los filtros</p>
                                </div>
                              );
                            }

                            return filtrados.map((trabajador) => (
                              <button
                                key={trabajador.id}
                                type="button"
                                onClick={() => agregarTecnico(trabajador.id)}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-all border-b border-slate-100 last:border-b-0 flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="bg-purple-100 group-hover:bg-purple-200 rounded-full p-2 transition-all">
                                    <span className="text-sm">👤</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm">
                                      {trabajador.nombre} {trabajador.apellido}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                        {(trabajador.rol || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                      </span>
                                      <span className="text-xs text-slate-500">• {trabajador.empresa}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-all">
                                  +
                                </div>
                              </button>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* DATOS OPERATIVOS */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">⚙️</span> Datos Operativos
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Horómetro</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        name="horometro"
                        value={form.horometro}
                        onChange={handleChange}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Número de Misiones</label>
                      <input
                        type="number"
                        placeholder="0"
                        name="numeroMisiones"
                        value={form.numeroMisiones}
                        onChange={handleChange}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Número de Equipo</label>
                      <input
                        type="text"
                        name="numeroEquipo"
                        value={form.numeroEquipo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg bg-slate-100"
                        disabled
                      />
                      <p className="text-xs text-green-600 mt-1">✓ Cargado desde el equipo seleccionado</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Código de Repuesto</label>
                      <input
                        type="text"
                        placeholder="Ej: REP-123"
                        name="codigoRepuesto"
                        value={form.codigoRepuesto}
                        onChange={handleChange}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* ESTADO */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">🔧</span> Estado General del Equipo{" "}
                    <span className="text-red-500">*</span>
                  </h3>
                  <select
                    name="estadoGeneralEquipo"
                    value={form.estadoGeneralEquipo}
                    onChange={handleChange}
                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-semibold disabled:bg-slate-100"
                    required
                  >
                    <option value="OPERATIVO">✅ Operativo</option>
                    <option value="INOPERATIVO">❌ Inoperativo</option>
                    <option value="OPERATIVO_CON_OBSERVACIONES">⚠️ Operativo con Observaciones</option>
                  </select>
                </div>

                {/* DESCRIPCIONES */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📝</span> Descripciones
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: "descripcionGeneral", label: "Descripción General", placeholder: "Descripción general..." },
                      { name: "descripcionMantenimiento", label: "Descripción del Mantenimiento", placeholder: "Mantenimiento realizado..." },
                      { name: "observaciones", label: "Observaciones", placeholder: "Observaciones..." },
                      { name: "recomendaciones", label: "Recomendaciones", placeholder: "Recomendaciones..." },
                    ].map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{field.label}</label>
                        <textarea
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          rows="2"
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none transition-all disabled:bg-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* FOTOS */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📸</span> Fotos del Mantenimiento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Fotos Antes", state: fotosAntes, setter: setFotosAntes },
                      { label: "Fotos Después", state: fotosDespues, setter: setFotosDespues },
                    ].map(({ label, state, setter }) => (
                      <div key={label}>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          onChange={(e) => setter(e.target.files)}
                          className="w-full text-sm px-3 py-2 border-2 border-dashed border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-400 cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                        {state?.length > 0 && (
                          <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                            ✓ {state.length} archivo(s)
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: CHECKLIST */}
            {activeTab === "checklist" && (
              <div className="space-y-4">
                {!equipoSeleccionado && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">🖥️</div>
                    <p className="text-sm text-slate-600 mb-1">Selecciona un equipo para ver su checklist</p>
                    <button
                      type="button"
                      onClick={() => setOpenSelectEquipo(true)}
                      className="mt-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600"
                    >
                      Elegir equipo
                    </button>
                  </div>
                )}

                {equipoSeleccionado && totalActividades > 0 && (
                  <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-700">Progreso del Checklist</h3>
                      <span className={`text-sm font-bold ${checklistDone ? "text-emerald-600" : "text-amber-600"}`}>
                        {checklistCompletado}/{totalActividades}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${checklistDone ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${totalActividades > 0 ? (checklistCompletado / totalActividades) * 100 : 0}%` }}
                      />
                    </div>

                    {yaExisteNotiEquipo && (
                      <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-bold">Este equipo ya tiene notificación.</p>
                          <p>El checklist aquí es solo para crear. Si quieres ver lo guardado, abre el PDF.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {equipoSeleccionado && actividadesEquipoSeleccionado.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">☑️</div>
                    <p className="text-sm text-slate-600 mb-1">Este equipo no tiene actividades registradas</p>
                  </div>
                )}

                {equipoSeleccionado && actividadesEquipoSeleccionado.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🖥️</span>
                        <div>
                          <p className="font-bold text-white text-sm">{labelEquipoSeleccionado}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">
                        {actividadesEquipoSeleccionado.length} actividad(es)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 bg-white">
                      {actividadesEquipoSeleccionado.map((actividad, idx) => {
                        const registrado = getActividad(actividad.id);
                        const estadoActual = registrado?.estado;
                        const esDePlan = !!actividad.planMantenimientoActividadId;

                        return (
                          <div
                            key={actividad.id}
                            className={`p-4 transition-all ${estadoActual ? "bg-white" : "bg-amber-50/40"}`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                                  {actividad.tipoTrabajo && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tipoTrabajoColor(actividad.tipoTrabajo)}`}>
                                      {actividad.tipoTrabajo}
                                    </span>
                                  )}
                                  {esDePlan ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                      Del plan
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                      Manual
                                    </span>
                                  )}
                                </div>

                                <p className="font-bold text-slate-800 text-sm leading-snug">
                                  {actividad.tarea || actividad.descripcion || `Actividad ${actividad.id}`}
                                </p>

                                {actividad.componente && (
                                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                    <span>⚙️</span> {actividad.componente}
                                  </p>
                                )}
                              </div>

                              {estadoActual && (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${estadoBadgeColor(estadoActual)} shrink-0`}>
                                  {estadoActual === "OK" ? "✓ OK" : estadoActual === "NO_OK" ? "✗ NO OK" : "— N/A"}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2 mb-2">
                              {Object.entries(ESTADO_CONFIG).map(([estadoKey, config]) => (
                                <button
                                  key={estadoKey}
                                  type="button"
                                  disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                  onClick={() => handleActividadEstado(actividad, estadoKey)}
                                  className={`
                                    flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border-2
                                    ${estadoActual === estadoKey
                                      ? config.active
                                      : `bg-white text-slate-600 border-slate-300 ${config.hover}`}
                                    ${(!equipoSeleccionado || yaExisteNotiEquipo) ? "opacity-60 cursor-not-allowed" : ""}
                                  `}
                                >
                                  {config.label}
                                </button>
                              ))}
                            </div>

                            {estadoActual && (
                              <textarea
                                placeholder="Comentarios adicionales (opcional)..."
                                value={registrado?.comentario || ""}
                                disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                onChange={(e) => handleActividadComentario(actividad, e.target.value)}
                                rows="2"
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-xs transition-all disabled:bg-slate-100"
                              />
                            )}

                            {estadoActual && (
  <div className="mb-2">
    <label className="block text-xs font-bold text-slate-600 mb-1">
      Responsable (obligatorio si está OK)
    </label>

    <select
      value={registrado?.trabajadorId || ""}
      disabled={!equipoSeleccionado || yaExisteNotiEquipo}
      onChange={(e) => handleActividadTrabajador(actividad, e.target.value)}
      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
    >
      <option value="">— Seleccionar técnico —</option>

      {tecnicosSeleccionados.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nombre} {t.rol ? `• ${t.rol}` : ""}
        </option>
      ))}
    </select>

    {estadoActual === "OK" && !registrado?.trabajadorId && (
      <p className="text-xs text-red-600 font-semibold mt-1">
        ⚠️ Debes elegir responsable si está OK
      </p>
    )}
  </div>
)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CORRECTIVOS */}
            {activeTab === "correctivos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-xl">🔧</span> Trabajos Correctivos
                  </h3>
                  <button
                    type="button"
                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                    onClick={agregarCorrectivo}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-bold hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg">+</span> Agregar Correctivo
                  </button>
                </div>

                {correctivos.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">🔧</div>
                    <p className="text-sm text-slate-600 mb-1">No hay correctivos registrados</p>
                    <p className="text-xs text-slate-500">Agrega correctivos si aplican</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {correctivos.map((correctivo, index) => (
                      <div
                        key={correctivo.id}
                        className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border-2 border-red-200 relative"
                      >
                        <button
                          type="button"
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          onClick={() => eliminarCorrectivo(correctivo.id)}
                          className="absolute top-3 right-3 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-lg p-1.5 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          ✕
                        </button>

                        <h4 className="font-bold text-slate-800 mb-3 text-sm">Correctivo #{index + 1}</h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                              Descripción del Correctivo
                            </label>
                            <textarea
                              value={correctivo.comentario}
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) => actualizarComentarioCorrectivo(correctivo.id, e.target.value)}
                              rows="2"
                              placeholder="Describe el trabajo correctivo realizado..."
                              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                              Fotos del Correctivo
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) => actualizarFotosCorrectivo(correctivo.id, e.target.files)}
                              className="w-full text-sm px-3 py-2 border-2 border-dashed border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-400 cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                            />
                            {correctivo.fotos?.length > 0 && (
                              <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                                ✓ {correctivo.fotos.length} archivo(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADJUNTOS */}
            {activeTab === "adjuntos" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📎</span> Documentos Adjuntos (Opcional)
                </h3>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border-2 border-emerald-300">
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    Acta de Conformidad (opcional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                    onChange={(e) => setActa(e.target.files[0])}
                    className="w-full text-sm px-3 py-2 border-2 border-dashed border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-emerald-500 cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  {acta && (
                    <p className="text-xs text-emerald-700 font-bold mt-2 bg-emerald-200 px-3 py-1.5 rounded-lg">
                      ✓ {acta.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "📄 Informe", state: informe, setter: setInforme, accept: ".pdf,.doc,.docx" },
                    { label: "📄 Checklist", state: checklistAdjunto, setter: setChecklistAdjunto, accept: ".pdf,.doc,.docx,.xlsx,.xls" },
                    { label: "📎 Archivo Adicional", state: archivoExtra, setter: setArchivoExtra, accept: "*" },
                  ].map(({ label, state, setter, accept }) => (
                    <div key={label} className="bg-white rounded-lg p-4 border-2 border-slate-200">
                      <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>
                      <input
                        type="file"
                        accept={accept}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        onChange={(e) => setter(e.target.files[0])}
                        className="w-full text-xs disabled:opacity-60"
                      />
                      {state && <p className="text-xs text-slate-600 mt-1.5 truncate">✓ {state.name}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t-2 border-slate-200 p-5 bg-gradient-to-b from-slate-50 to-white rounded-b-3xl">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span className="text-red-500">*</span>
                <span>Campos obligatorios</span>
              </div>

              <div className="flex gap-3 items-center">
                {equipoSeleccionado && yaExisteNotiEquipo && (
                  <button
                    type="button"
                    onClick={() => abrirPdfNotificacion(notiActual.id)}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 shadow-sm"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !equipoSeleccionado || yaExisteNotiEquipo}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 inline-flex items-center gap-2"
                  title={
                    !equipoSeleccionado
                      ? "Selecciona un equipo"
                      : yaExisteNotiEquipo
                      ? "Este equipo ya tiene notificación"
                      : "Guardar notificación"
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "✓ Guardar Notificación"
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default CrearNotificacionModal;