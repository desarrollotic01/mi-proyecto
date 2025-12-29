import Campo from "../inputs/campo";
import CampoFile from "../inputs/campoFile";

export default function ModalOrdenTrabajoView({
  isOpen,
  onClose,
  wizardStep,
  setWizardStep,
  data,
}) {
  if (!isOpen || !data) return null;

  const disabled = true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[1100px] h-[650px] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-blue-700">
            Orden de Trabajo – Vista
          </h2>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-b pb-2">
            {[
              { id: 1, label: "Información General" },
              { id: 2, label: "Recursos Asignados" },
              { id: 3, label: "Completado por Supervisor" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`pb-2 font-semibold ${
                  wizardStep === tab.id
                    ? "text-black border-b-2 border-black"
                    : "text-gray-400"
                }`}
                onClick={() => setWizardStep(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-gray-600 font-semibold mt-3">
            Paso {wizardStep} de 3
          </p>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* PASO 1 */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <Campo label="N° de Aviso" name="numeroAviso" formData={data} disabled={disabled} />
              <Campo label="Descripción de OT" name="descripcionOT" formData={data} disabled={disabled} />
              <Campo label="Descripción Detallada OT" name="descripcionDetalladaOT" formData={data} disabled={disabled} />

              <Campo label="Equipo (Vendido)" name="equipoVendido" formData={data} disabled={disabled} />
              <Campo label="Equipo (Atendido)" name="equipoAtendido" formData={data} disabled={disabled} />
              <Campo label="Equipo (ALSUD)" name="equipoAlsud" formData={data} disabled={disabled} />

              <Campo label="Tipo de OT" name="tipoOT" formData={data} disabled={disabled} />
              <Campo label="Prioridad" name="prioridad" formData={data} disabled={disabled} />

              <Campo label="Inicio Programado" name="inicioProgramado" type="date" formData={data} disabled={disabled} />
              <Campo label="Fin Programado" name="finProgramado" type="date" formData={data} disabled={disabled} />

              <Campo label="Clave de Control" name="claveControl" formData={data} disabled={disabled} />
              <Campo label="N° OT" name="numeroOT" formData={data} disabled={disabled} />
              <Campo label="Cliente" name="cliente" formData={data} disabled={disabled} />
            </div>
          )}

          {/* PASO 2 */}
          {wizardStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <Campo label="Personal Asignado" name="personalAsignado" formData={data} disabled={disabled} />
              <Campo label="Cantidad de Técnicos" name="cantidadTecnicos" formData={data} disabled={disabled} />
              <Campo label="Empresa Asignada" name="empresaAsignada" formData={data} disabled={disabled} />
              <Campo label="Materiales Asignados" name="materialesAsignados" formData={data} disabled={disabled} />
              <Campo label="Supervisor Responsable" name="supervisorResponsable" formData={data} disabled={disabled} />

            </div>
          )}

          {/* PASO 3 */}
          {wizardStep === 3 && (
            <>
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                COMPLETADO POR SUPERVISOR
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <Campo label="Inicio Real" name="inicioReal" type="date" formData={data} disabled={disabled} />
                <Campo label="Fin Real" name="finReal" type="date" formData={data} disabled={disabled} />

                <Campo label="Personal Designado (Real)" name="personalDesignadoReal" formData={data} disabled={disabled} />
                <Campo label="Empresas Asignadas" name="empresasAsignadasReal" formData={data} disabled={disabled} />

                <Campo label="Materiales Utilizados" name="materialesUtilizados" formData={data} disabled={disabled} />
                <Campo label="Estado OT" name="estadoOT" formData={data} disabled={disabled} />

                <CampoFile label="Documentos Cargados" name="documentosCargados" formData={data} disabled />
                <CampoFile label="Datos Adjuntos" name="datosAdjuntos" formData={data} disabled />

              </div>
            </>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white flex justify-between">
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded-md"
            onClick={onClose}
          >
            Cerrar
          </button>

          <div className="flex gap-2">
            {wizardStep > 1 && (
              <button
                className="px-4 py-2 bg-gray-200 rounded-md"
                onClick={() => setWizardStep((p) => p - 1)}
              >
                Anterior
              </button>
            )}

            {wizardStep < 3 && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={() => setWizardStep((p) => p + 1)}
              >
                Siguiente
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
