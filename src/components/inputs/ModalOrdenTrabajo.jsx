import Campo from "../inputs/campo";
import CampoFile from "../inputs/campoFile";

export default function ModalOrdenTrabajo({
  isOpen,
  onClose,
  wizardStep,
  setWizardStep,
  formData,
  handleInputChange,
  handleSaveAll,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

      <div className="bg-white rounded-xl shadow-2xl w-[1100px] h-[650px] flex flex-col overflow-hidden">

        {/* ---------------- HEADER ---------------- */}
        <div className="p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-blue-700">
            Orden de Trabajo
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
                    : "text-gray-500"
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

        {/* ---------------- CONTENIDO ---------------- */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* === PASO 1 : INFORMACIÓN GENERAL === */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <Campo label="N° de Aviso" name="numeroAviso" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Descripción de OT" name="descripcionOT" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Descripción Detallada OT" name="descripcionDetalladaOT" handleInputChange={handleInputChange} formData={formData} />

              <Campo label="Equipo (Vendido)" name="equipoVendido" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Equipo (Atendido)" name="equipoAtendido" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Equipo (ALSUD)" name="equipoAlsud" handleInputChange={handleInputChange} formData={formData} />

              <Campo label="Tipo de OT" name="tipoOT" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Prioridad" name="prioridad" handleInputChange={handleInputChange} formData={formData} />

              <Campo label="Inicio Programado" name="inicioProgramado" type="date" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Fin Programado" name="finProgramado" type="date" handleInputChange={handleInputChange} formData={formData} />

              <Campo label="Clave de Control" name="claveControl" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="N° OT" name="numeroOT" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Cliente" name="cliente" handleInputChange={handleInputChange} formData={formData} />
            </div>
          )}

          {/* === PASO 2 : RECURSOS ASIGNADOS === */}
          {wizardStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <Campo label="Personal Asignado" name="personalAsignado" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Cantidad de Técnicos" name="cantidadTecnicos" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Empresa Asignada" name="empresaAsignada" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Materiales Asignados" name="materialesAsignados" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Supervisor Responsable" name="supervisorResponsable" handleInputChange={handleInputChange} formData={formData} />

            </div>
          )}

          {/* === PASO 3 : COMPLETADO POR SUPERVISOR === */}
          {wizardStep === 3 && (
            <>
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                COMPLETADO POR SUPERVISOR (NOTIFICACIÓN)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <Campo label="Inicio Real" name="inicioReal" type="date" handleInputChange={handleInputChange} formData={formData} />
                <Campo label="Fin Real" name="finReal" type="date" handleInputChange={handleInputChange} formData={formData} />

                <Campo label="Personal Designado (Real)" name="personalDesignadoReal" handleInputChange={handleInputChange} formData={formData} />
                <Campo label="Empresas Asignadas" name="empresasAsignadasReal" handleInputChange={handleInputChange} formData={formData} />

                <Campo label="Materiales Utilizados" name="materialesUtilizados" handleInputChange={handleInputChange} formData={formData} />
                <Campo label="Estado OT" name="estadoOT" handleInputChange={handleInputChange} formData={formData} />

                <CampoFile label="Documentos Cargados" name="documentosCargados" handleInputChange={handleInputChange} formData={formData} />
                <CampoFile label="Datos Adjuntos" name="datosAdjuntos" handleInputChange={handleInputChange} formData={formData} />

              </div>
            </>
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
            {wizardStep === 1 ? "Cancelar" : "Anterior"}
          </button>

          {wizardStep < 3 ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={() => setWizardStep((prev) => prev + 1)}
            >
              Siguiente
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md"
              onClick={handleSaveAll}
            >
              Guardar
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
