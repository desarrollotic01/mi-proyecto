import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import AdjuntosViewer from "../../adjuntos/components/AdjuntosViewer";
import { getTratamientoByAviso } from "../services/tratamientoService";
import { ESTADOS_AV } from "../config/camposMantenimiento";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
};

const fmtDt = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const str = (v) => (v && typeof v === "object" ? v.razonSocial || v.nombre || v.nombreApellido || "" : v || "");

/* ─────────────────────────────────────────────
   Small atoms
───────────────────────────────────────────── */
function Field({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-full" : ""}>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-800 font-medium min-h-[20px]">{value || <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
        {title}
      </p>
      {children}
    </div>
  );
}

function StatusPill({ label, color = "slate" }) {
  const map = {
    slate:  "bg-slate-100 text-slate-700 border-slate-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    red:    "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[color] || map.slate}`}>
      {label}
    </span>
  );
}

const prioColor = (p) =>
  ({ Alta: "red", Media: "yellow", Baja: "blue" })[p] || "slate";

const estadoBadgeStyle = (e) =>
  ESTADOS_AV[e]?.badge || "bg-slate-100 text-slate-700 border-slate-200";

/* ─────────────────────────────────────────────
   TABS config
───────────────────────────────────────────── */
const TABS = [
  { id: 1, label: "Información general" },
  { id: 2, label: "Cliente y contacto" },
  { id: 3, label: "Tratamiento" },
  { id: 4, label: "Documentos" },
];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ModalMantenimientoView({
  isOpen, onClose, wizardStep, setWizardStep,
  data, cambiarEstado, abrirTratamiento, onEditarAviso,
}) {
  const [tratamiento, setTratamiento] = useState(null);
  const [loadingTrat, setLoadingTrat] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.id) return;
    let alive = true;
    setLoadingTrat(true);
    getTratamientoByAviso(data.id)
      .then((r) => { if (alive) setTratamiento(r || null); })
      .catch(() => { if (alive) setTratamiento(null); })
      .finally(() => { if (alive) setLoadingTrat(false); });
    return () => { alive = false; };
  }, [isOpen, data?.id]);

  if (!isOpen || !data) return null;

  const estadoKey = data._estadoReal || data.estado || "";

  const handleEstado = async (next) => {
    await cambiarEstado?.(data, next);
    onClose?.();
  };

  /* ── Action buttons ── */
  const renderActions = () => {
    if (estadoKey === "CREADO") return (
      <div className="flex gap-2 flex-wrap">
        {onEditarAviso && (
          <button onClick={() => { onEditarAviso(data); onClose?.(); }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5">
            <Pencil className="w-4 h-4" /> Editar
          </button>
        )}
        <button onClick={() => { abrirTratamiento?.(data); onClose?.(); }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
          Tratar
        </button>
        <button onClick={() => handleEstado("RECHAZADO")}
          className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-sm font-semibold rounded-lg transition-colors">
          Rechazar
        </button>
      </div>
    );
    if (estadoKey === "TRATADO") return (
      <div className="flex gap-2 flex-wrap">
        {abrirTratamiento && (
          <button onClick={() => { abrirTratamiento?.(data); onClose?.(); }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5">
            <Pencil className="w-4 h-4" /> Editar
          </button>
        )}
        <button onClick={() => handleEstado("CON_OT")}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
          Generar OT
        </button>
        <button onClick={() => handleEstado("RECHAZADO")}
          className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-sm font-semibold rounded-lg transition-colors">
          Rechazar
        </button>
      </div>
    );
    if (estadoKey === "CON_OT") return (
      <div className="flex gap-2">
        <button onClick={() => handleEstado("FINALIZADO")}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
          Finalizar
        </button>
        <button onClick={() => handleEstado("FINALIZADO_SIN_FACTURACION")}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-lg transition-colors">
          Sin facturación
        </button>
      </div>
    );
    return null;
  };

  const solicitudesCompra  = tratamiento?.solicitudesCompra  || [];
  const solicitudesAlmacen = tratamiento?.solicitudesAlmacen || [];
  const equiposTrat        = tratamiento?.equipos            || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">

        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                Aviso {data.numeroAviso ? `#${data.numeroAviso}` : ""}
              </h2>
              {estadoKey && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoBadgeStyle(estadoKey)}`}>
                  {ESTADOS_AV[estadoKey]?.label || estadoKey}
                </span>
              )}
              {data.prioridad && (
                <StatusPill label={data.prioridad} color={prioColor(data.prioridad)} />
              )}
            </div>
            {data.descripcionResumida && (
              <p className="text-sm text-slate-500 mt-1 truncate">{data.descripcionResumida}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {renderActions()}
            <button onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setWizardStep(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2 ${
                wizardStep === t.id
                  ? "text-slate-900 border-slate-900"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">

          {/* ======= TAB 1: INFO GENERAL ======= */}
          {wizardStep === 1 && (
            <>
              <SectionBlock title="Datos del aviso">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                  <Field label="N° Aviso"            value={data.numeroAviso} />
                  <Field label="Tipo de aviso"       value={data.tipoAviso} />
                  <Field label="Tipo de mantenimiento" value={data.tipoMantenimiento} />
                  <Field label="Prioridad"           value={data.prioridad} />
                  <Field label="Estado"              value={ESTADOS_AV[estadoKey]?.label || estadoKey} />
                  <Field label="Fecha de atención"   value={fmt(data.fechaAtencion)} />
                  <Field label="N° Orden de venta"   value={data.ordenVenta} />
                  <Field label="Centro de costo"     value={data.centroCosto} />
                  <Field label="Producto"            value={data.producto} />
                </div>
              </SectionBlock>

              <SectionBlock title="Descripción">
                <div className="space-y-5">
                  <Field label="Resumen"  value={data.descripcionResumida} wide />
                  <Field label="Detalle"  value={data.descripcion}         wide />
                </div>
              </SectionBlock>

              <SectionBlock title="Ubicación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Ubicación técnica"   value={str(data.ubicacionTecnica)} />
                  <Field label="Dirección de atención" value={data.direccionAtencion} />
                </div>
              </SectionBlock>
            </>
          )}

          {/* ======= TAB 2: CLIENTE Y CONTACTO ======= */}
          {wizardStep === 2 && (
            <>
              <SectionBlock title="Cliente">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                  <Field label="Cliente"          value={str(data.cliente)} />
                  <Field label="N° Orden cliente" value={data.ordenCliente} />
                  <Field label="Sede"             value={str(data.sede)} />
                  <Field label="Almacén"          value={str(data.almacen)} />
                </div>
              </SectionBlock>

              <SectionBlock title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                  <Field label="Nombre"   value={data.nombreContacto} />
                  <Field label="Correo"   value={data.correoContacto} />
                  <Field label="Teléfono" value={data.numeroContacto} />
                </div>
              </SectionBlock>

              <SectionBlock title="Solicitante">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Nombre"    value={str(data.solicitante)} />
                  <Field label="Supervisor" value={str(data.supervisorAsignado)} />
                </div>
              </SectionBlock>
            </>
          )}

          {/* ======= TAB 3: TRATAMIENTO ======= */}
          {wizardStep === 3 && (
            <>
              <SectionBlock title="Tratamiento">
                {loadingTrat ? (
                  <p className="text-sm text-slate-400">Cargando...</p>
                ) : tratamiento ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <Field label="Estado"              value={tratamiento.estado} />
                    <Field label="Creado"              value={fmtDt(tratamiento.createdAt)} />
                    <Field label="Última actualización" value={fmtDt(tratamiento.updatedAt)} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    Sin tratamiento registrado
                  </p>
                )}
              </SectionBlock>

              {/* Solicitudes de compra */}
              <SectionBlock title={`Solicitudes de compra (${solicitudesCompra.length})`}>
                {solicitudesCompra.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    Sin solicitudes de compra
                  </p>
                ) : (
                  <div className="space-y-3">
                    {solicitudesCompra.map((sol, i) => (
                      <SolicitudRow key={sol.id || i} index={i + 1} sol={sol} tipo="Compra" fmt={fmt} />
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Solicitudes de almacén */}
              <SectionBlock title={`Solicitudes de almacén (${solicitudesAlmacen.length})`}>
                {solicitudesAlmacen.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    Sin solicitudes de almacén
                  </p>
                ) : (
                  <div className="space-y-3">
                    {solicitudesAlmacen.map((sol, i) => (
                      <SolicitudRow key={sol.id || i} index={i + 1} sol={sol} tipo="Almacén" fmt={fmt} />
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Objetivos */}
              <SectionBlock title={`Objetivos y actividades (${equiposTrat.length})`}>
                {equiposTrat.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    Sin objetivos registrados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {equiposTrat.map((te, i) => (
                      <ObjetivoBlock key={te.id || i} te={te} />
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Auditoría */}
              <SectionBlock title="Auditoría">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Creado por"          value={str(data.creador)} />
                  <Field label="Supervisor asignado" value={str(data.supervisorAsignado)} />
                  <Field label="Fecha de creación"   value={fmtDt(data.createdAt)} />
                  <Field label="Última modificación" value={fmtDt(data.updatedAt)} />
                </div>
              </SectionBlock>
            </>
          )}

          {/* ======= TAB 4: DOCUMENTOS ======= */}
          {wizardStep === 4 && (
            <>
              {/* Documentos adjuntos */}
              <SectionBlock title="Documentos adjuntos">
                <AdjuntosViewer
                  adjuntos={Array.isArray(data.documentos) ? data.documentos : []}
                  titulo=""
                  emptyMessage="No se adjuntaron documentos al crear este aviso."
                />
              </SectionBlock>

              {/* Documento final */}
              {data.documentoFinal && (
                <SectionBlock title="Documento final">
                  <AdjuntosViewer
                    adjuntos={[{
                      nombre: data.documentoFinal.split("/").pop(),
                      url: data.documentoFinal,
                      tipo: data.documentoFinal.split(".").pop(),
                      categoria: "DOCUMENTO FINAL",
                    }]}
                    titulo=""
                  />
                </SectionBlock>
              )}

              {!Array.isArray(data.documentos) || (data.documentos.length === 0 && !data.documentoFinal) ? null : null}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => wizardStep === 1 ? onClose() : setWizardStep((p) => p - 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {wizardStep === 1 ? "Cerrar" : "Anterior"}
          </button>

          <span className="text-xs text-slate-400">
            Paso {wizardStep} de {TABS.length}
          </span>

          {wizardStep < TABS.length ? (
            <button
              onClick={() => setWizardStep((p) => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SolicitudRow
───────────────────────────────────────────── */
function SolicitudRow({ index, sol, tipo, fmt }) {
  const [open, setOpen] = useState(false);
  const lineas = sol.lineas || [];

  const objetivo = (() => {
    if (sol.esGeneral) return "General";
    if (sol.equipo?.nombre) return sol.equipo.nombre;
    if (sol.ubicacionTecnica?.nombre) return sol.ubicacionTecnica.nombre;
    return "—";
  })();

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-800">
            {tipo} #{index}
            {sol.numeroSolicitud && <span className="text-slate-400 font-normal ml-2">· {sol.numeroSolicitud}</span>}
          </span>
          <span className="text-xs text-slate-500">{objetivo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            {lineas.length} ítem{lineas.length !== 1 ? "s" : ""}
          </span>
          {sol.estado && (
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              {sol.estado}
            </span>
          )}
          <span className="text-slate-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4 text-xs">
            {sol.requiredDate && <div><p className="text-slate-400 font-semibold uppercase">Fecha requerida</p><p className="text-slate-700">{fmt(sol.requiredDate)}</p></div>}
            {sol.requester    && <div><p className="text-slate-400 font-semibold uppercase">Solicitante</p><p className="text-slate-700">{sol.requester}</p></div>}
            {sol.department   && <div><p className="text-slate-400 font-semibold uppercase">Departamento</p><p className="text-slate-700">{sol.department}</p></div>}
            {sol.comments     && <div className="col-span-full"><p className="text-slate-400 font-semibold uppercase">Comentarios</p><p className="text-slate-700">{sol.comments}</p></div>}
          </div>

          {lineas.length > 0 && (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Código", "Descripción", "Cant.", "Almacén", "C. Costo", "Proyecto"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((l, i) => (
                    <tr key={l.id || i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-semibold text-slate-700">{l.itemCode || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[220px] truncate">{l.description || "—"}</td>
                      <td className="px-3 py-2 text-center font-semibold text-slate-700">{l.quantity ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{l.warehouseCode || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{l.costingCode || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{l.projectCode || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ObjetivoBlock
───────────────────────────────────────────── */
function ObjetivoBlock({ te }) {
  const nombre = te?.equipo?.nombre || te?.ubicacionTecnica?.nombre || "Sin objetivo";
  const codigo = te?.equipo?.codigo || te?.equipo?.tag || te?.ubicacionTecnica?.codigo || "";
  const actividades = te.actividades || [];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{nombre}</p>
          {codigo && <p className="text-xs text-slate-400">{codigo}</p>}
        </div>
        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
          {actividades.length} actividad{actividades.length !== 1 ? "es" : ""}
        </span>
      </div>

      {actividades.length > 0 && (
        <div className="divide-y divide-slate-100">
          {actividades.map((act, i) => (
            <div key={act.id || i} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{act.tarea || "Sin tarea"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {[act.sistema, act.subsistema, act.componente].filter(Boolean).join(" / ") || "Sin clasificación"}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {act.estado && <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{act.estado}</span>}
                  {act.origen && <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">{act.origen}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><p className="text-slate-400 font-semibold uppercase">Tipo trabajo</p><p className="text-slate-700">{act.tipoTrabajo || "—"}</p></div>
                <div><p className="text-slate-400 font-semibold uppercase">Rol técnico</p><p className="text-slate-700">{act.rolTecnico || "—"}</p></div>
                <div><p className="text-slate-400 font-semibold uppercase">Técnicos</p><p className="text-slate-700">{act.cantidadTecnicos ?? "—"}</p></div>
                <div><p className="text-slate-400 font-semibold uppercase">Duración</p><p className="text-slate-700">{act.duracionEstimadaValor ? `${act.duracionEstimadaValor} ${act.unidadDuracion || "min"}` : "—"}</p></div>
              </div>
              {act.descripcion && <p className="text-xs text-slate-600 mt-2">{act.descripcion}</p>}
              {act.observaciones && <p className="text-xs text-slate-500 mt-1 italic">{act.observaciones}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
