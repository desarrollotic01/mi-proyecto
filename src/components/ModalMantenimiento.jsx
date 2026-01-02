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

export default function ModalMantenimiento({ isOpen, onClose ,
  formData,setFormData, handleSaveAll, listaAvisos =[] }) {

  console.log("¿Cuántos avisos llegaron al modal?:", listaAvisos.length);
  const [wizardStep, setWizardStep] = useState(1);


  // controla qué lookup está abierto
  const [lookupOpen, setLookupOpen] = useState(null);

  if (!isOpen) return null;

const direccionesDisponibles = Array.from(
  new Set(formData.equipos.map((e) => e.direccion))
);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((p) => ({ ...p, [name]: files[0] }));
      return;
    }

    //  CÓDIGO PARA CORRELATIVO DE NÚMERO DE AVISO
    if (name === "ordenVenta") {
      const ventaLimpia = value.trim();

      console.log("Buscando correlativo para:", ventaLimpia);
      console.log("Lista de avisos recibida:", listaAvisos);

      let nuevoCodigo = "";

      if (ventaLimpia) {

        const numeros = listaAvisos.map((aviso) =>{

          if (!aviso.numeroAviso) return 0;

          const partes = aviso.numeroAviso.split("AV");

          if (partes.length > 1){
            const sufijo = partes[partes.length - 1];
            return parseInt(sufijo, 10) || 0;
          }
          return 0;
        });

        const maximo = Math.max(0, ...numeros);
        const siguiente = maximo + 1;

        nuevoCodigo = `${ventaLimpia}AV${String(siguiente).padStart(3, "0")}`;
        
      }

      setFormData((p) => ({
        ...p,
        ordenVenta: value,
        numeroAviso: nuevoCodigo,
      }));
      return;
    }

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

    setFormData((p) => ({ ...p, [name]: value }));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-[1100px] h-[650px] flex flex-col">

        {/* HEADER */}
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

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 gap-4">

          {/* ===== PASO 1 ===== */}
          {wizardStep === 1 && (
            <>
              <Campo label="Número de Aviso" name="numeroAviso" handleInputChange={handleInputChange} formData={formData} disabled />
              <Campo label="Centro de Costo" name="centroCosto" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Orden de Venta" name="ordenVenta" handleInputChange={handleInputChange} formData={formData} />


              {/* 🔥 EQUIPOS TIPO SAP */}
              <div className="col-span-2">
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    Equipos
  </label>

  <div className="border rounded-lg p-2 min-h-[42px] flex flex-wrap gap-2">
    {formData.equipos.length === 0 && (
      <span className="text-gray-400 text-sm">
        No hay equipos seleccionados
      </span>
    )}

    {formData.equipos.map((eq) => (
      <span
        key={eq.codigo}
        className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
      >
        {eq.codigo}
        <button
          onClick={() =>
            setFormData((p) => ({
              ...p,
              equipos: p.equipos.filter((e) => e.codigo !== eq.codigo),
            }))
          }
          className="text-red-600 font-bold"
        >
          ✕
        </button>
      </span>
    ))}

    <button
      type="button"
      onClick={() => setLookupOpen("equipos")}
      className="ml-auto px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
    >
      + Agregar
    </button>
  </div>
</div>


              {/* 🔥 UBICACIÓN TÉCNICA TIPO SAP */}
              <CampoLookup
                label="Ubicación Técnica"
                value={formData.ubicacionTecnica}
                onOpen={() => setLookupOpen("ubicacion")}
              />

              <Campo label="Descripción" name="descripcion" handleInputChange={handleInputChange} formData={formData} />

              <Campo
                label="Prioridad"
                name="prioridad"
                tipo="select"
                opciones={["Baja", "Media", "Alta"]}
                handleInputChange={handleInputChange}
                formData={formData}
              />

              <Campo
                label="Fecha Atención Solicitada"
                name="fechaAtencion"
                type="date"
                handleInputChange={handleInputChange}
                formData={formData}
              />

              <Campo label="Solicitante" name="solicitante" handleInputChange={handleInputChange} formData={formData} />

              <Campo
                label="Tipo de Mantenimiento"
                name="tipoMantenimiento"
                tipo="select"
                opciones={["Preventivo", "Correctivo", "Mejora", "Predictivo"]}
                handleInputChange={handleInputChange}
                formData={formData}
              />
 <Campo
  label="Producto"
  name="producto"
  formData={formData}
  
/>
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

          {/* ===== PASO 2 ===== */}
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
<Campo label="Orden de cliente" name="Orden de Cliente" handleInputChange={handleInputChange} formData={formData} />
<Campo label="Almacen" name="Almacen" handleInputChange={handleInputChange} formData={formData} />
<Campo label="Sede" name="Sede" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Correo Contacto" name="correoContacto" disabled formData={formData} />
              <Campo label="Número de Contacto" name="numeroContacto" disabled formData={formData} />
            </>

          )}

          {/* ===== PASO 3 ===== */}
          {wizardStep === 3 && (
            <>
              <Campo label="Supervisor Asignado" name="supervisorAsignado" handleInputChange={handleInputChange} formData={formData} />
              <Campo label="Estado del Aviso" name="estadoAviso" handleInputChange={handleInputChange} formData={formData} />
              <CampoFile label="Documento Final" name="documentoFinal" handleInputChange={handleInputChange} />
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={() =>
              wizardStep === 1 ? onClose() : setWizardStep(wizardStep - 1)
            }
            className="bg-gray-300 px-4 py-2 rounded"
          >
            {wizardStep === 1 ? "Cancelar" : "Anterior"}
          </button>

          {wizardStep < 3 ? (
            <button
              onClick={() => setWizardStep(wizardStep + 1)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Siguiente
            </button>
          ) : (
            <button
  onClick={() => {
    handleSaveAll();
    onClose();
  }}
  className="bg-green-600 text-white px-4 py-2 rounded"
>
  Guardar Aviso
</button>
          )}
        </div>
      </div>

      {/* ===== MODALES SAP ===== */}
      <ModalLookup
        isOpen={lookupOpen === "equipos"}
        title="Selección de Equipos"
        data={equiposData}
        onClose={() => setLookupOpen(null)}
        onSelect={(item) =>
  setFormData((p) => {
    const exists = p.equipos.some((e) => e.codigo === item.codigo);
    if (exists) return p;

    const nuevosEquipos = [...p.equipos, item];

    return {
      ...p,
      equipos: nuevosEquipos,
      producto: nuevosEquipos[0]?.producto || "",
      direccionAtencion: "", // se reinicia porque cambian equipos
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
