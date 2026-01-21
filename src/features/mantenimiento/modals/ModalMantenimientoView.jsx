export default function ModalMantenimientoView({
  isOpen,
  onClose,
  wizardStep,
  setWizardStep,
  data,
}) {
  if (!isOpen || !data) return null;

  const ViewField = ({ label, value }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500">
        {label}
      </label>
      <div className="p-2 border rounded-md bg-gray-100 text-sm">
        {value || "—"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

      {/* MODAL FIJO */}
      <div className="bg-white rounded-xl shadow-2xl w-[1100px] h-[650px] flex flex-col overflow-hidden">

        {/* ---------------- HEADER ---------------- */}
        <div className="p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-blue-700">
            Aviso de Mantenimiento (Vista)
          </h2>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-b pb-2">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                className={`pb-2 font-semibold ${
                  wizardStep === step
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500"
                }`}
                onClick={() => setWizardStep(step)}
              >
                {step === 1 && "Información General"}
                {step === 2 && "Datos del Cliente"}
                {step === 3 && "Persona Designada"}
              </button>
            ))}
          </div>

          <p className="text-gray-600 font-semibold mt-3">
            Paso {wizardStep} de 3
          </p>
        </div>

        {/* ---------------- CONTENIDO ---------------- */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* === PASO 1 === */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <ViewField label="N° OV" value={data.ov} />
              <ViewField label="Equipo Vendido" value={data.equipoVendido} />
              <ViewField label="Equipo ALSUD" value={data.equipoAlsud} />
              <ViewField label="Ubicación Técnica" value={data.ubicacionTecnica} />

              <ViewField label="Equipo Atendido" value={data.equipoAtendido} />
              <ViewField label="Descripción" value={data.descripcion} />
              <ViewField label="Prioridad" value={data.prioridad} />
              <ViewField
                label="Fecha de Atención"
                value={
                  data.fechaAtencion
                    ? new Date(data.fechaAtencion).toLocaleDateString("es-PE")
                    : "—"
                }
              />

              <ViewField label="Solicitante" value={data.solicitante} />
              <ViewField label="Tipo de Atención" value={data.tipoAtencion} />
              <ViewField
                label="Tipo de Mantenimiento"
                value={data.tipoMantenimiento}
              />
              <ViewField label="Producto" value={data.producto} />
            </div>
          )}

          {/* === PASO 2 === */}
          {wizardStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ViewField label="N° Orden Cliente" value={data.ordenCliente} />
              <ViewField label="Sede" value={data.sede} />
              <ViewField label="Almacén" value={data.almacen} />
              <ViewField label="Nombre Contacto" value={data.nombreContacto} />
              <ViewField label="Correo Contacto" value={data.correoContacto} />
              <ViewField label="Número de Contacto" value={data.numeroContacto} />
              <ViewField label="Cliente" value={data.cliente} />
            </div>
          )}

          {/* === PASO 3 === */}
          {wizardStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ViewField
                label="Supervisor Asignado"
                value={data.supervisorAsignado}
              />
              <ViewField
                label="Personal Requerido"
                value={data.personalRequerido}
              />
              <ViewField
                label="Contratistas Requeridos"
                value={data.contratistasRequeridos}
              />
              <ViewField label="Estado del Aviso" value={data.estadoAviso} />
              <ViewField label="Número de Aviso" value={data.numeroAviso} />
            </div>
          )}
        </div>

        {/* ---------------- FOOTER ---------------- */}
        <div className="p-4 border-t bg-white flex justify-between">
          <button
            className="px-4 py-2 bg-gray-300 rounded-md"
            onClick={() => {
              if (wizardStep === 1) onClose();
              else setWizardStep((prev) => prev - 1);
            }}
          >
            {wizardStep === 1 ? "Cerrar" : "Anterior"}
          </button>

          {wizardStep < 3 && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={() => setWizardStep((prev) => prev + 1)}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
