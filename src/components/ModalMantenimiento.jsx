import { useState } from "react";

import Campo from "./inputs/Campo";
import CampoFile from "./inputs/CampoFile";
import CampoLookup from "./inputs/CampoLookup";
import ModalLookup from "./inputs/ModalLookup";

import {
  clientes,
  contactosPorCliente,
  equiposData,
  ubicacionesData,
} from "../components/data";

/* =========================
   CONSTANTES
========================= */
const opcionesProducto = [
  "Racks",
  "Vehiculo",
  "Autosat",
  "Techo y Cerramiento",
  "Equipos Propios",
  "Sanitarias",
  "HVAC",
  "DACI",
  "ACI",
  "Datos y Comunicaciones",
  "Eléctrico",
  "Pisos y Estructuras",
];

export default function ModalMantenimiento({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSaveAll,
  listaAvisos = [],
}) {
  if (!isOpen) return null;

  /* =========================
     ESTADOS
  ========================= */
  const [wizardStep, setWizardStep] = useState(1);
  const [lookupOpen, setLookupOpen] = useState(null);

  /* =========================
     DERIVADOS
  ========================= */
  const direccionesDisponibles = Array.from(
    new Set(formData.equipos.map((e) => e.direccion))
  );

  /* =========================
     HANDLERS
  ========================= */
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // ===== ARCHIVOS =====
    if (files) {
      setFormData((p) => ({ ...p, [name]: files[0] }));
      return;
    }

    // ===== CORRELATIVO AVISO =====
    if (name === "ordenVenta") {
      const ventaLimpia = value.trim();
      let nuevoCodigo = "";

      if (ventaLimpia) {
        const numeros = listaAvisos.map((aviso) => {
          if (!aviso.numeroAviso) return 0;
          const partes = aviso.numeroAviso.split("AV");
          return parseInt(partes.at(-1), 10) || 0;
        });

        const siguiente = Math.max(0, ...numeros) + 1;
        nuevoCodigo = `${ventaLimpia}AV${String(siguiente).padStart(3, "0")}`;
      }

      setFormData((p) => ({
        ...p,
        ordenVenta: value,
        numeroAviso: nuevoCodigo,
      }));
      return;
    }

    // ===== CLIENTE =====
    if (name === "cliente") {
      setFormData({
        ...formData,
        cliente: value,
        nombreContacto: "",
        correoContacto: "",
        numeroContacto: "",
      });
      return;
    }

    // ===== CONTACTO =====
    if (name === "nombreContacto") {
      const contacto = contactosPorCliente[formData.cliente]?.find(
        (c) => c.nombre === value
      );

      setFormData({
        ...formData,
        nombreContacto: value,
        correoContacto: contacto?.correo || "",
        numeroContacto: contacto?.telefono || "",
      });
      return;
    }

    // ===== DEFAULT =====
    setFormData((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-[1100px] h-[650px] flex flex-col">

        {/* ================= HEADER ================= */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-700">
            Aviso de Mantenimiento
          </h2>

          <div className="flex gap-6 mt-4">
            {["Información General", "Datos del Cliente", "Gestión"].map(
              (t, i) => (
                <button
                  key={i}
                  onClick={() => setWizardStep(i + 1)}
                  className={`font-semibold ${
                    wizardStep === i + 1
                      ? "text-black border-b-2"
                      : "text-gray-400"
                  }`}
                >
                  {t}
                </button>
              )
            )}
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 gap-4">

          {/* ==================================================
              PASO 1 – INFORMACIÓN GENERAL
          ================================================== */}
          {wizardStep === 1 && (
            <>
              {/* IDENTIFICACIÓN */}
              <Campo label="Orden de Venta" name="ordenVenta" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Centro de Costo" name="centroCosto" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Número de Aviso" name="numeroAviso" disabled formData={formData} />

              {/* EQUIPOS */}
              <div className="col-span-2">
                <label className="text-sm font-semibold">Equipos</label>
                <div className="border rounded-lg p-2 flex flex-wrap gap-2 min-h-[42px]">
                  {formData.equipos.length === 0 && (
                    <span className="text-gray-400 text-sm">
                      No hay equipos seleccionados
                    </span>
                  )}

                  {formData.equipos.map((eq) => (
                    <span
                      key={eq.codigo}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-2"
                    >
                      {eq.codigo}
                      <button
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            equipos: p.equipos.filter(
                              (e) => e.codigo !== eq.codigo
                            ),
                          }))
                        }
                        className="text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}

                  <button
                    onClick={() => setLookupOpen("equipos")}
                    className="ml-auto px-2 py-1 border rounded text-sm"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              <CampoLookup
                label="Ubicación Técnica"
                value={formData.ubicacionTecnica}
                onOpen={() => setLookupOpen("ubicacion")}
              />

              <Campo
                label="Descripción Resumida"
                name="descripcionResumida"
                tipo="textarea"
                handleInputChange={handleInputChange}
                formData={formData}
              />

              <div className="col-span-2">
                <Campo
                  label="Descripción"
                  name="descripcion"
                  tipo="textarea"
                  rows={8}
                  handleInputChange={handleInputChange}
                  formData={formData}
                />
              </div>

              <Campo label="Prioridad" name="prioridad" tipo="select" opciones={["Baja", "Media", "Alta"]} handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Fecha Atención Solicitada" name="fechaAtencion" type="date" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Solicitante" name="solicitante" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Tipo de Mantenimiento" name="tipoMantenimiento" tipo="select" opciones={["Preventivo", "Correctivo", "Mejora", "Predictivo"]} handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Producto" name="producto" tipo="select" opciones={opcionesProducto} handleInputChange={handleInputChange} formData={formData} />

              {formData.equipos.length > 0 && (
                <Campo
                  label="Dirección del Punto de Atención"
                  name="direccionAtencion"
                  tipo="select"
                  opciones={direccionesDisponibles}
                  handleInputChange={handleInputChange}
                  formData={formData}
                />
              )}

              <CampoFile label="Documentos Adjuntos" name="documentos" handleInputChange={handleInputChange} />
            </>
          )}

          {/* ==================================================
              PASO 2 – DATOS DEL CLIENTE
          ================================================== */}
          {wizardStep === 2 && (
            <>
              <Campo label="Cliente" name="cliente" tipo="select" opciones={clientes} handleInputChange={handleInputChange} formData={formData} />

              <Campo
                label="Nombre de Contacto"
                name="nombreContacto"
                tipo="select"
                opciones={
                  contactosPorCliente[formData.cliente]?.map((c) => c.nombre) || []
                }
                handleInputChange={handleInputChange}
                formData={formData}
              />

              <Campo label="Número OC de Cliente" name="ordenCliente" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Almacén" name="almacen" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Sede" name="sede" handleInputChange={handleInputChange} formData={formData} />

              <Campo label="Correo Contacto" name="correoContacto" disabled formData={formData} />
              <Campo label="Número de Contacto" name="numeroContacto" disabled formData={formData} />
            </>
          )}

          {/* ==================================================
              PASO 3 – GESTIÓN
          ================================================== */}
          {wizardStep === 3 && (
            <>
              <Campo label="Supervisor Asignado" name="supervisorAsignado" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Estado del Aviso" name="estadoAviso" handleInputChange={handleInputChange} formData={formData} />
              <CampoFile label="Documento Final" name="documentoFinal" handleInputChange={handleInputChange} />
            </>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={() =>
              wizardStep === 1 ? onClose() : setWizardStep(wizardStep - 1)
            }
            className="bg-gray-300 px-4 py-2 rounded"
          >
            {wizardStep === 1 ? "Cancelar" : "Anterior"}
          </button>

          <button
            onClick={() => {
              if (wizardStep < 3) setWizardStep(wizardStep + 1);
              else {
                handleSaveAll();
                onClose();
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {wizardStep < 3 ? "Siguiente" : "Guardar Aviso"}
          </button>
        </div>
      </div>

      {/* ================= MODALES ================= */}
      <ModalLookup
        isOpen={lookupOpen === "equipos"}
        title="Selección de Equipos"
        data={equiposData}
        onClose={() => setLookupOpen(null)}
        onSelect={(item) =>
          setFormData((p) => {
            if (p.equipos.some((e) => e.codigo === item.codigo)) return p;
            const nuevos = [...p.equipos, item];
            return {
              ...p,
              equipos: nuevos,
              producto: nuevos[0]?.producto || "",
              direccionAtencion: "",
            };
          })
        }
      />

      <ModalLookup
        isOpen={lookupOpen === "ubicacion"}
        title="Selección de Ubicación Técnica"
        data={ubicacionesData}
        onClose={() => setLookupOpen(null)}
        onSelect={(item) =>
          setFormData((p) => ({
            ...p,
            ubicacionTecnica: `${item.codigo} - ${item.nombre}`,
          }))
        }
      />
    </div>
  );
}
