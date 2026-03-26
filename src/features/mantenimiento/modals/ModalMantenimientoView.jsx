import { useEffect, useState } from "react";
import { getTratamientoByAviso } from "../services/tratamientoService";

export default function ModalMantenimientoView({
  isOpen,
  onClose,
  wizardStep,
  setWizardStep,
  data,
  cambiarEstado,
  abrirTratamiento,
}) {
  const [tratamiento, setTratamiento] = useState(null);
  const [loadingTratamiento, setLoadingTratamiento] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.id) return;

    let active = true;

    const cargarTratamiento = async () => {
      try {
        setLoadingTratamiento(true);
        const resp = await getTratamientoByAviso(data.id);
        if (!active) return;
        setTratamiento(resp || null);
      } catch (error) {
        if (!active) return;
        setTratamiento(null);
      } finally {
        if (active) setLoadingTratamiento(false);
      }
    };

    cargarTratamiento();

    return () => {
      active = false;
    };
  }, [isOpen, data?.id]);

  if (!isOpen || !data) return null;

  const estadoActual = data._estadoReal || data.estadoAviso || data.estado || "";

  const ViewField = ({ label, value, fullWidth = false }) => (
    <div className={`flex flex-col gap-1 ${fullWidth ? "col-span-full" : ""}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="p-3 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 min-h-[42px] flex items-center">
        {value || <span className="text-slate-400">Sin información</span>}
      </div>
    </div>
  );

  const Badge = ({ children, variant = "default" }) => {
    const variants = {
      default: "bg-slate-100 text-slate-700 border border-slate-200",
      success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      warning: "bg-amber-50 text-amber-700 border border-amber-200",
      info: "bg-blue-50 text-blue-700 border border-blue-200",
      danger: "bg-rose-50 text-rose-700 border border-rose-200",
      purple: "bg-violet-50 text-violet-700 border border-violet-200",
      indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}
      >
        {children}
      </span>
    );
  };

  const getPrioridadVariant = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
      case "alta":
        return "danger";
      case "media":
        return "warning";
      case "baja":
        return "info";
      default:
        return "default";
    }
  };

  const getEstadoVariant = (estado) => {
    switch (estado?.toLowerCase()) {
      case "tratado":
        return "success";
      case "con ot":
        return "info";
      case "pendiente":
        return "warning";
      case "creado":
        return "default";
      case "rechazado":
        return "danger";
      case "finalizado":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTargetNombre = (te) => {
    return (
      te?.equipo?.nombre ||
      te?.equipo?.descripcion ||
      te?.ubicacionTecnica?.nombre ||
      te?.ubicacionTecnica?.descripcion ||
      "Sin objetivo"
    );
  };

  const getTargetCodigo = (te) => {
    return (
      te?.equipo?.codigo ||
      te?.equipo?.tag ||
      te?.ubicacionTecnica?.codigo ||
      "—"
    );
  };

  const getObjetivoSolicitud = (sol) => {
    if (!sol) return "—";

    if (sol.esGeneral) return "General";
    if (sol.equipo?.nombre) {
      return `${sol.equipo.nombre}${sol.equipo.codigo ? ` · ${sol.equipo.codigo}` : ""}`;
    }
    if (sol.ubicacionTecnica?.nombre) {
      return `${sol.ubicacionTecnica.nombre}${
        sol.ubicacionTecnica.codigo ? ` · ${sol.ubicacionTecnica.codigo}` : ""
      }`;
    }
    if (sol.equipo_id) return `Equipo asociado`;
    if (sol.ubicacion_tecnica_id) return `Ubicación técnica asociada`;

    return "—";
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      await cambiarEstado?.(data, nuevoEstado);
      onClose?.();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleAbrirTratamiento = () => {
    try {
      abrirTratamiento?.(data);
      onClose?.();
    } catch (error) {
      console.error("Error al abrir tratamiento:", error);
    }
  };

  const renderActionButtons = () => {
    if (!data) return null;

    if (estadoActual === "CREADO") {
      return (
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={handleAbrirTratamiento}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Tratar
          </button>

          <button
            onClick={() => handleCambiarEstado("RECHAZADO")}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Rechazar
          </button>
        </div>
      );
    }

    if (estadoActual === "TRATADO") {
      return (
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => handleCambiarEstado("CON_OT")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Generar OT
          </button>
        </div>
      );
    }

    if (estadoActual === "CON_OT") {
      return (
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => handleCambiarEstado("FINALIZADO")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Finalizar
          </button>

          <button
            onClick={() => handleCambiarEstado("FINALIZADO_SIN_FACTURACION")}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Sin Facturación
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[120rem] h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="px-5 py-3 border-b bg-slate-900">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Aviso de Mantenimiento
              </h2>
              <p className="text-slate-300 text-sm">
                {data.numeroAviso || "Sin número de aviso"}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2 flex-wrap justify-end">
                <Badge variant={getPrioridadVariant(data.prioridad)}>
                  {data.prioridad || "Sin prioridad"}
                </Badge>
                <Badge variant={getEstadoVariant(estadoActual)}>
                  {estadoActual || "Sin estado"}
                </Badge>
              </div>

              {renderActionButtons()}
            </div>
          </div>

          <div className="flex gap-6 mt-6 border-b border-slate-700 pb-2">
            {[
              { num: 1, label: "Información General" },
              { num: 2, label: "Cliente y Contacto" },
              { num: 3, label: "Equipos y Tratamiento" },
            ].map((step) => (
              <button
                key={step.num}
                className={`pb-2 font-semibold text-sm transition-all ${
                  wizardStep === step.num
                    ? "text-white border-b-2 border-white"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() => setWizardStep(step.num)}
              >
                {step.label}
              </button>
            ))}
          </div>

          <p className="text-slate-300 font-medium mt-3 text-sm">
            Paso {wizardStep} de 3
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {wizardStep === 1 && (
            <div className="space-y-6">
              <Section title="Datos del Aviso">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ViewField label="N° Orden de Venta" value={data.ordenVenta} />
                  <ViewField label="Centro de Costo" value={data.centroCosto} />
                  <ViewField label="Número de Aviso" value={data.numeroAviso} />
                  <ViewField label="Tipo de Aviso" value={data.tipoAviso} />
                  <ViewField
                    label="Tipo de Mantenimiento"
                    value={data.tipoMantenimiento}
                  />
                  <ViewField label="Producto" value={data.producto} />
                  <ViewField label="Prioridad" value={data.prioridad} />
                  <ViewField label="Estado del Aviso" value={estadoActual} />
                  <ViewField
                    label="Fecha de Atención"
                    value={formatDate(data.fechaAtencion)}
                  />
                </div>
              </Section>

              <Section title="Descripción">
                <div className="grid grid-cols-1 gap-4">
                  <ViewField
                    label="Descripción Resumida"
                    value={data.descripcionResumida}
                    fullWidth
                  />
                  <ViewField
                    label="Descripción Detallada"
                    value={data.descripcion}
                    fullWidth
                  />
                </div>
              </Section>

              <Section title="Ubicación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField
                    label="Ubicación Técnica"
                    value={data.ubicacionTecnica}
                  />
                  <ViewField
                    label="Dirección de Atención"
                    value={data.direccionAtencion}
                  />
                </div>
              </Section>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-6">
              <Section title="Datos del Cliente">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ViewField label="ID Cliente" value={data.cliente} />
                  <ViewField
                    label="N° Orden Cliente"
                    value={data.ordenCliente}
                  />
                  <ViewField label="Sede" value={data.sede} />
                  <ViewField label="Almacén" value={data.almacen} />
                </div>
              </Section>

              <Section title="Información de Contacto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ViewField
                    label="Nombre del Contacto"
                    value={data.nombreContacto}
                  />
                  <ViewField
                    label="Correo Electrónico"
                    value={data.correoContacto}
                  />
                  <ViewField
                    label="Número de Teléfono"
                    value={data.numeroContacto}
                  />
                </div>
              </Section>

              <Section title="Información del Solicitante">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField
                    label="Solicitante"
                    value={data.solicitante?.nombreApellido}
                  />
                  <ViewField
                    label="Usuario"
                    value={data.solicitante?.alias}
                  />
                </div>
              </Section>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-6">
              <Section title="Asignación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField
                    label="Supervisor Asignado"
                    value={data.supervisorAsignado}
                  />
                  <ViewField
                    label="Creado Por"
                    value={data.creador?.nombreApellido}
                  />
                </div>
              </Section>

              <Section
                title="Detalle del Tratamiento"
                right={
                  loadingTratamiento ? (
                    <Badge variant="default">Cargando...</Badge>
                  ) : tratamiento ? (
                    <Badge variant="success">
                      {tratamiento.estado || "Registrado"}
                    </Badge>
                  ) : (
                    <Badge variant="warning">Sin tratamiento</Badge>
                  )
                }
              >
                {tratamiento ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ViewField label="Estado" value={tratamiento.estado} />
                    <ViewField
                      label="Fecha creación"
                      value={formatDateTime(tratamiento.createdAt)}
                    />
                    <ViewField
                      label="Última actualización"
                      value={formatDateTime(tratamiento.updatedAt)}
                    />
                  </div>
                ) : (
                  <EmptyState text="No hay tratamiento registrado para este aviso." />
                )}
              </Section>

              <Section
                title="Solicitudes de Compra"
                right={
                  <Badge variant="info">{solicitudesCompra.length} registros</Badge>
                }
              >
                {solicitudesCompra.length > 0 ? (
                  <div className="space-y-4">
                    {solicitudesCompra.map((sol, index) => (
                      <SolicitudCard
                        key={sol.id || index}
                        titulo={`Solicitud de Compra #${index + 1}`}
                        subtitulo={sol.esGeneral ? "General" : "Individual"}
                        estado={sol.estado}
                        fields={[
                          ["Required Date", formatDate(sol.requiredDate)],
                          ["Department", sol.department],
                          ["Requester", sol.requester],
                          ["Comentarios", sol.comments],
                          ["Objetivo", getObjetivoSolicitud(sol)],
                        ]}
                        lineas={sol.lineas || []}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No hay solicitudes de compra registradas." />
                )}
              </Section>

              <Section
                title="Solicitudes de Almacén"
                right={
                  <Badge variant="purple">
                    {solicitudesAlmacen.length} registros
                  </Badge>
                }
              >
                {solicitudesAlmacen.length > 0 ? (
                  <div className="space-y-4">
                    {solicitudesAlmacen.map((sol, index) => (
                      <SolicitudCard
                        key={sol.id || index}
                        titulo={`Solicitud de Almacén #${index + 1}`}
                        subtitulo={sol.esGeneral ? "General" : "Individual"}
                        estado={sol.estado}
                        fields={[
                          ["Required Date", formatDate(sol.requiredDate)],
                          ["Department", sol.department],
                          ["Requester", sol.requester],
                          ["Comentarios", sol.comments],
                          ["Objetivo", getObjetivoSolicitud(sol)],
                        ]}
                        lineas={sol.lineas || []}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No hay solicitudes de almacén registradas." />
                )}
              </Section>

              <Section
                title="Objetivos y Actividades del Tratamiento"
                right={
                  <Badge variant="indigo">
                    {equiposTratamiento.length} objetivos
                  </Badge>
                }
              >
                {equiposTratamiento.length > 0 ? (
                  <div className="space-y-5">
                    {equiposTratamiento.map((te, index) => (
                      <div
                        key={te.id || index}
                        className="border border-slate-200 rounded-xl bg-white"
                      >
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {getTargetNombre(te)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Código: {getTargetCodigo(te)}
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {te.planMantenimiento ? (
                              <Badge variant="success">
                                Plan:{" "}
                                {te.planMantenimiento.codigoPlan ||
                                  te.planMantenimiento.nombre}
                              </Badge>
                            ) : (
                              <Badge variant="default">Sin plan</Badge>
                            )}
                            <Badge variant="default">
                              {(te.actividades || []).length} actividades
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {(te.actividades || []).length > 0 ? (
                            te.actividades.map((act, i) => (
                              <div
                                key={act.id || i}
                                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                              >
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {act.tarea || "Sin tarea"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {[act.sistema, act.subsistema, act.componente]
                                        .filter(Boolean)
                                        .join(" / ") || "Sin clasificación"}
                                    </p>
                                  </div>

                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant="default">
                                      {act.origen || "—"}
                                    </Badge>
                                    <Badge variant="info">
                                      {act.estado || "—"}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                                  <MiniField
                                    label="Tipo trabajo"
                                    value={act.tipoTrabajo}
                                  />
                                  <MiniField
                                    label="Rol técnico"
                                    value={act.rolTecnico}
                                  />
                                  <MiniField
                                    label="Cantidad técnicos"
                                    value={act.cantidadTecnicos}
                                  />
                                  <MiniField
                                    label="Duración"
                                    value={`${act.duracionEstimadaValor || 0} ${
                                      act.unidadDuracion || "min"
                                    }`}
                                  />
                                </div>

                                {act.descripcion && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                      Descripción
                                    </p>
                                    <p className="text-sm text-slate-700">
                                      {act.descripcion}
                                    </p>
                                  </div>
                                )}

                                {act.observaciones && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                      Observaciones
                                    </p>
                                    <p className="text-sm text-slate-700">
                                      {act.observaciones}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <EmptyState
                              text="No hay actividades registradas para este objetivo."
                              small
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No hay objetivos ni actividades en el tratamiento." />
                )}
              </Section>

              <Section title="Información de Auditoría">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField
                    label="Fecha de Creación"
                    value={formatDateTime(data.createdAt)}
                  />
                  <ViewField
                    label="Última Actualización"
                    value={formatDateTime(data.updatedAt)}
                  />
                </div>
              </Section>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white flex justify-between items-center">
          <button
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
            onClick={() => {
              if (wizardStep === 1) onClose();
              else setWizardStep((prev) => prev - 1);
            }}
          >
            {wizardStep === 1 ? "Cerrar" : "Anterior"}
          </button>

          {wizardStep < 3 ? (
            <button
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
              onClick={() => setWizardStep((prev) => prev + 1)}
            >
              Siguiente
            </button>
          ) : (
            <button
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
              onClick={onClose}
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text, small = false }) {
  return (
    <div
      className={`text-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 ${
        small ? "py-6 px-4" : "py-10 px-6"
      }`}
    >
      <p className="text-sm">{text}</p>
    </div>
  );
}

function MiniField({ label, value }) {
  return (
    <div className="border border-slate-200 rounded-lg bg-white p-3">
      <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
        {label}
      </p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}

function SolicitudCard({ titulo, subtitulo, estado, fields = [], lineas = [] }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-slate-900">{titulo}</p>
          <p className="text-xs text-slate-500">{subtitulo}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {estado || "Sin estado"}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map(([label, value], idx) => (
            <MiniField key={idx} label={label} value={value} />
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Líneas
          </p>

          {lineas.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      ItemCode
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Descripción
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cantidad
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Warehouse
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Costing
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Project
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Rubro SAP
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Paquete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, idx) => (
                    <tr
                      key={linea.id || idx}
                      className="border-t border-slate-200"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {linea.itemCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.description || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.quantity || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.warehouseCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.costingCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.projectCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.rubroSapCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {linea.paqueteTrabajo || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="No hay líneas registradas." small />
          )}
        </div>
      </div>
    </div>
  );
}