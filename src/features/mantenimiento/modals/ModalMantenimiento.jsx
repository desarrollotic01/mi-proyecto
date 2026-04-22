import { useState, useEffect } from "react";
import {
  X, ChevronRight, ChevronLeft, Save, FileText, Users, Settings,
  AlertCircle, Plus, Trash2, Wrench, Package, MapPin, Calendar,
  User, Building, Phone, Mail, Upload, CheckCircle, Search, ShoppingCart
} from "lucide-react";

import { useAuth } from "../../../auth/context/AuthContext";
import { crearAviso } from "../services/avisoServices";
import { clienteService } from "../services/clienteService";
import { equipoService } from "../services/equipoService";
import { UbicacionTecnicaService } from "../services/ubicacionService";
import { getContactosPorCliente } from "../services/ContactoService";
import { paisService } from "../services/paisService";
import { getTrabajadores } from "../services/trabajadoresService";
import AdjuntoUploader from "../../adjuntos/components/AdjuntoUploader";


const opcionesProducto = [
  "Racks", "Vehiculo", "Autosat", "Techo y Cerramiento",
  "Equipos Propios", "Sanitarias", "HVAC", "DACI", "ACI",
  "Datos y Comunicaciones", "Eléctrico", "Pisos y Estructuras",
];

/* ================= MODAL DE BÚSQUEDA ================= */
function ModalBusqueda({ isOpen, onClose, title, data, onSelect, tipo, equiposSeleccionados = [], ubicacionesSeleccionadas = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredData = data.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.codigo?.toLowerCase().includes(search) ||
      item.nombre?.toLowerCase().includes(search)
    );
  });

  const isEquipoSeleccionado = (equipoId) => {
    return equiposSeleccionados.includes(equipoId);
  };

  const isUbicacionSeleccionada = (ubicacionId) => {
    return ubicacionesSeleccionadas.includes(ubicacionId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
              {tipo === "equipos" && equiposSeleccionados.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {equiposSeleccionados.length} equipo{equiposSeleccionados.length !== 1 ? 's' : ''} seleccionado{equiposSeleccionados.length !== 1 ? 's' : ''}
                </p>
              )}
              {tipo === "ubicacion" && ubicacionesSeleccionadas.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {ubicacionesSeleccionadas.length} ubicación{ubicacionesSeleccionadas.length !== 1 ? 'es' : ''} seleccionada{ubicacionesSeleccionadas.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Lista */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No se encontraron resultados</p>
              <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((item) => {
                const yaSeleccionado =
                  (tipo === "equipos" && isEquipoSeleccionado(item.id)) ||
                  (tipo === "ubicacion" && isUbicacionSeleccionada(item.id));

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      // Never auto-close — user clicks "Listo" to dismiss
                    }}
                    disabled={yaSeleccionado}
                    className={`w-full p-4 border rounded-xl text-left group transition-all ${
                      yaSeleccionado
                        ? "border-green-300 bg-green-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {tipo === "equipos" ? (
                            <Package className={`w-5 h-5 ${yaSeleccionado ? "text-green-600" : "text-blue-600"}`} />
                          ) : (
                            <MapPin className={`w-5 h-5 ${yaSeleccionado ? "text-green-600" : "text-emerald-600"}`} />
                          )}
                          <div>
                            <p className={`font-semibold ${yaSeleccionado ? "text-green-900" : "text-gray-900"}`}>
                              {item.nombre}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">{item.codigo}</p>
                          </div>
                        </div>
                        {item.descripcion && (
                          <p className="text-sm text-gray-600 mt-2 ml-8">{item.descripcion}</p>
                        )}
                      </div>
                      {yaSeleccionado ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Seleccionado</span>
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con botón cerrar (siempre visible para multi-select) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Listo - Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MODAL PRINCIPAL ================= */
export default function ModalMantenimiento({
  isOpen,
  onClose,
  formData,
  setFormData,
  listaAvisos = [],
  onCreated,
}) {


  const [wizardStep, setWizardStep] = useState(1);
  const [tipoAviso, setTipoAviso] = useState("mantenimiento");
  const [lookupOpen, setLookupOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitErrors, setSubmitErrors] = useState([]);
  const { user } = useAuth();
  const [paises, setPaises] = useState([]);



  // Estados de datos del backend
  const [clientes, setClientes] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [equiposData, setEquiposData] = useState([]);
  const [ubicacionesData, setUbicacionesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const tieneEquipos = (formData.equipos || []).length > 0;
const tieneUbicacion = (formData.ubicaciones||[]).length > 0;

  const esPeru = paises.find(p => p.id === formData.paisId)?.nombre === "PERÚ";

  const [departamentos, setDepartamentos] = useState([]);
const [provincias, setProvincias] = useState([]);
const [distritos, setDistritos] = useState([]);


const [supervisores, setSupervisores] = useState([]);

useEffect(() => {
  if (user?.nombre) {
    setFormData((prev) => ({
      ...prev,
      solicitante: user.nombre,
    }));
  }
}, [user]);


  /* ================= CARGAR DATOS DEL BACKEND ================= */
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [clientesData, equiposResp, ubicacionesResp,paisesResp,supervisoresResp] = await Promise.all([
          clienteService.getClientes(),
          equipoService.getEquipos(),
          UbicacionTecnicaService.getUbicacionTecnicas(),
          paisService.getPaises(),
          getTrabajadores("supervisor")
        ]);


        setPaises(paisesResp);
        setClientes(clientesData);
        setEquiposData(equiposResp);
        setUbicacionesData(ubicacionesResp);
        setSupervisores(supervisoresResp);

      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("Error al cargar los datos iniciales");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  
  // 🔄 CAMBIO: Ahora obtenemos direcciones desde los equipos usando sus IDs
  const direccionesDesdeEquipos = () => {
    if (!formData.equipos || formData.equipos.length === 0) return [];

    return Array.from(
      new Set(
        formData.equipos
          .map((equipoId) => {
            const equipo = equiposData.find(e => e.id === equipoId);
            return equipo?.ubicacionTecnica;
          })
          .filter(Boolean)
      )
    );
  };

  const handleDepartamento = (e) => {
  const dep = e.target.value;
  setFormData(prev => ({
    ...prev,
    departamento: dep,
    provincia: "",
    distrito: "",
  }));

  // cargar provincias
  const provs = getProvincias(dep); 
  setProvincias(provs);
};

const handleProvincia = (e) => {
  const prov = e.target.value;
  setFormData(prev => ({
    ...prev,
    provincia: prov,
    distrito: "",
  }));

  const dists = getDistritos(prov);
  setDistritos(dists);
};

  useEffect(() => {
    const direccionesValidas = direccionesDesdeEquipos();

    if (
      formData.direccionAtencion &&
      !direccionesValidas.includes(formData.direccionAtencion)
    ) {
      setFormData((p) => ({
        ...p,
        direccionAtencion: "",
      }));
    }
  }, [formData.equipos]);

  if (!isOpen) return null;

  /* ================= HANDLERS ================= */
  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;

    if (files) {
  if (name === "documentos") {
    setFormData((p) => ({
      ...p,
      documentos: Array.from(files),
    }));
  } else {
    setFormData((p) => ({
      ...p,
      [name]: files[0],
    }));
  }
  return;
}

    if (name === "ordenVenta") {
      setFormData((p) => ({ ...p, ordenVenta: value }));
      return;
    }

    if (name === "clienteId") {
      setFormData({
        ...formData,
        clienteId: value, 
        nombreContacto: "",
        correoContacto: "",
        numeroContacto: "",
      });

      try {
        const contactosData = await getContactosPorCliente(value);
        setContactos(contactosData);
      } catch {
        setContactos([]);
      }
      return;
    }

    if (name === "nombreContacto") {
      const contacto = contactos.find((c) => c.nombre === value);
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

  // 🔄 CAMBIO: Ahora solo guardamos el ID del equipo
  const handleSelectEquipo = (equipo) => {
  const yaExiste = (formData.equipos || []).includes(equipo.id);
  if (!yaExiste) {
    setFormData((p) => ({
      ...p,
      equipos: [...(p.equipos || []), equipo.id],
      // 🔥 limpiar ubicación si había una
      ubicacionTecnica: "",
      ubicacionTecnicaId: null,
    }));
  }
};


const handleSelectUbicacion = (ubicacion) => {
  const yaExiste = (formData.ubicaciones || []).includes(ubicacion.id);

  if (!yaExiste) {
    setFormData((p) => ({
      ...p,
      ubicaciones: [...(p.ubicaciones || []), ubicacion.id],
      // 🔥 limpiar equipos si había
      equipos: [],
    }));
  }
};


const removeUbicacion = (ubicacionId) => {
  setFormData((p) => ({
    ...p,
    ubicaciones: (p.ubicaciones || []).filter(
      (id) => id !== ubicacionId
    ),
  }));
};


const getUbicacionData = (ubicacionId) => {
  return ubicacionesData.find(u => u.id === ubicacionId);
};



  // 🔄 CAMBIO: Removemos por ID
  const removeEquipo = (equipoId) => {
    setFormData((p) => ({
      ...p,
      equipos: (p.equipos || []).filter((id) => id !== equipoId),
    }));
  };

const handleGuardarAviso = async () => {
  setSaving(true);
  setSubmitErrors([]);

  try {
    if (tipoAviso === "mantenimiento" && !formData.tipoMantenimiento) {
      setSubmitErrors(["Debe seleccionar el tipo de mantenimiento"]);
      return;
    }

    const formDataToSend = new FormData();

    // Campos normales (excluir tipoAviso — se agrega abajo desde el estado)
    Object.entries(formData).forEach(([key, value]) => {
      if (["documentos", "documentoFinal", "equipos", "ubicaciones", "tipoAviso"].includes(key)) return;
      if (value !== null && value !== undefined) {
        formDataToSend.append(key, value);
      }
    });

    // tipoAviso desde el estado (una sola vez, correcto)
    formDataToSend.append("tipoAviso", tipoAviso);

    // Equipos (array)
    if (formData.equipos?.length) {
      formData.equipos.forEach((id) => formDataToSend.append("equipos", id));
    }

    // Ubicaciones (array)
    if (formData.ubicaciones?.length) {
      formData.ubicaciones.forEach((id) => formDataToSend.append("ubicaciones", id));
    }

    // Documentos
    if (formData.documentos?.length) {
      formData.documentos.forEach((file) => formDataToSend.append("documentos", file));
    }

    // Documento final
    if (formData.documentoFinal) {
      formDataToSend.append("documentoFinal", formData.documentoFinal);
    }

    await crearAviso(formDataToSend);

    onCreated?.();
    onClose();

  } catch (error) {
    console.error(error);
    // Mostrar errores del backend inline sin cerrar ni resetear el form
    const serverErrors = error?.response?.data?.errors;
    if (Array.isArray(serverErrors) && serverErrors.length > 0) {
      setSubmitErrors(serverErrors);
    } else {
      setSubmitErrors(["Error al guardar el aviso. Intenta nuevamente."]);
    }
  } finally {
    setSaving(false);
  }
};

  // 🔄 CAMBIO: Función helper para obtener datos de un equipo por su ID
  const getEquipoData = (equipoId) => {
    return equiposData.find(e => e.id === equipoId);
  };

  const steps = [
    { number: 1, title: "Información General", icon: FileText },
    { number: 2, title: "Datos del Cliente", icon: Users },
    { number: 3, title: "Gestión", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Nuevo Aviso
                </h2>
                <p className="text-sm text-gray-600">Completa la información del aviso</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tipo de Aviso Selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setTipoAviso("mantenimiento")}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                tipoAviso === "mantenimiento"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              <Wrench className="w-5 h-5 inline mr-2" />
              Mantenimiento
            </button>
            <button
              onClick={() => {
                setTipoAviso("instalacion");
                setFormData(p => ({ ...p, tipoMantenimiento: null }));
              }}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                tipoAviso === "instalacion"
                  ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-green-300"
              }`}
            >
              <Package className="w-5 h-5 inline mr-2" />
              Instalación
            </button>
            <button
              onClick={() => {
                setTipoAviso("venta");
                setWizardStep(1);
                setFormData(p => ({ ...p, tipoMantenimiento: null, ubicaciones: [] }));
              }}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                tipoAviso === "venta"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
              }`}
            >
              <ShoppingCart className="w-5 h-5 inline mr-2" />
              Venta (repuestos)
            </button>
          </div>

          {/* Steps Progress */}
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = wizardStep === step.number;
              const isCompleted = wizardStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <button
                    onClick={() => setWizardStep(step.number)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`font-semibold hidden md:inline ${
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-4 ${wizardStep > step.number ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BODY - CONTENIDO DINÁMICO */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* STEP 1: Información General */}
            {wizardStep === 1 && (
              <>
                {/* CAMPOS PRINCIPALES AL INICIO */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Orden de Venta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ordenVenta"
                    value={formData.ordenVenta || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Ej: OV-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Centro de Costo
                  </label>
                  <input
                    type="text"
                    name="centroCosto"
                    value={formData.centroCosto || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Ej: CC-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Aviso
                  </label>
                  <input
                    type="text"
                    name="numeroAviso"
                    value={formData.numeroAviso || ""}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-mono"
                    placeholder="Auto-generado"
                  />
                </div>

                <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    País
  </label>
  <select
    name="paisId"
    value={formData.paisId || ""}
    onChange={handleInputChange}
    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    <option value="">Seleccionar país</option>
    {paises.map((p) => (
      <option key={p.id} value={p.id}>
        {p.nombre}
      </option>
    ))}
  </select>
</div>

<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Atencion
                  </label>
                  <select
                    name="tipoAtencion"
                    value={formData.tipoAtencion || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value="interna">Interna</option>
                    <option value="venta">Venta</option>
                  </select>
                </div>


                {/* Equipos */}
                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equipos {tipoAviso === "venta" && <span className="text-gray-400 font-normal">(opcional)</span>}
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 min-h-[100px] bg-gray-50">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(formData.equipos || []).map((equipoId) => {
                        const equipo = getEquipoData(equipoId);
                        if (!equipo) return null;
                        
                        return (
                          <div
                            key={equipoId}
                            className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium"
                          >
                            <Package className="w-4 h-4" />
                            {equipo.codigo} - {equipo.nombre}
                            <button
                              onClick={() => removeEquipo(equipoId)}
                              className="ml-1 hover:bg-blue-200 rounded p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  <button
  onClick={() => !(tieneUbicacion && tipoAviso !== "venta") && setLookupOpen("equipos")}
  disabled={tieneUbicacion && tipoAviso !== "venta"}
  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 font-medium transition-colors
    ${
      tieneUbicacion && tipoAviso !== "venta"
        ? "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
        : tipoAviso === "venta"
          ? "border-orange-300 text-orange-600 hover:bg-orange-50"
          : "border-blue-300 text-blue-600 hover:bg-blue-50"
    }
  `}
>
  <Plus className="w-5 h-5" />
  {tipoAviso === "venta" ? "Agregar Equipo (opcional)" : "Buscar y Agregar Equipos"}
</button>

                  </div>
                </div>

                {/* Ubicación Técnica con Modal — no aplica para venta */}
                {tipoAviso !== "venta" && <div className="col-span-full">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Ubicaciones Técnicas
  </label>

  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 min-h-[100px] bg-gray-50">
    
    <div className="flex flex-wrap gap-2 mb-3">
      {(formData.ubicaciones || []).map((ubicacionId) => {
        const ubicacion = getUbicacionData(ubicacionId);
        if (!ubicacion) return null;

        return (
          <div
            key={ubicacionId}
            className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium"
          >
            <MapPin className="w-4 h-4" />
            {ubicacion.codigo} - {ubicacion.nombre}

            <button
              onClick={() => removeUbicacion(ubicacionId)}
              className="ml-1 hover:bg-green-200 rounded p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>

    <button
      onClick={() => !tieneEquipos && setLookupOpen("ubicacion")}
      disabled={tieneEquipos}
      className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 font-medium transition-colors
        ${
          tieneEquipos
            ? "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
            : "border-green-300 text-green-600 hover:bg-green-50"
        }
      `}
    >
      <Plus className="w-5 h-5" />
      Buscar y Agregar Ubicaciones
    </button>

  </div>
</div>}


                {/* DIRECCIÓN */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Dirección de Atención
  </label>

  {/* 🇵🇪 PERÚ */}
  {esPeru ? (
    <div className="grid grid-cols-3 gap-3">
      
      {/* Departamento */}
      <select
        value={formData.departamento || ""}
        onChange={handleDepartamento}
        className="px-3 py-2 border rounded-xl"
      >
        <option value="">Departamento</option>
        {departamentos.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Provincia */}
      <select
        value={formData.provincia || ""}
        onChange={handleProvincia}
        className="px-3 py-2 border rounded-xl"
        disabled={!formData.departamento}
      >
        <option value="">Provincia</option>
        {provincias.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Distrito */}
      <select
        value={formData.distrito || ""}
        onChange={(e) =>
          setFormData(prev => ({ ...prev, distrito: e.target.value }))
        }
        className="px-3 py-2 border rounded-xl"
        disabled={!formData.provincia}
      >
        <option value="">Distrito</option>
        {distritos.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

    </div>
  ) : (
    /* 🌎 OTROS PAÍSES */
    <input
      type="text"
      name="direccionAtencion"
      placeholder="Ingrese dirección"
      value={formData.direccionAtencion || ""}
      onChange={handleInputChange}
      className="w-full px-4 py-2.5 border rounded-xl"
    />
  )}

  <p className="text-xs text-gray-500 mt-1">
    {esPeru
      ? "Seleccione ubicación por niveles"
      : "Ingrese dirección manual"}
  </p>
</div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    name="prioridad"
                    value={formData.prioridad || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                {/* Fecha Atención */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Atención Solicitada
                  </label>
                  <input
                    type="date"
                    name="fechaAtencion"
                    value={formData.fechaAtencion || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* Solicitante */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Solicitante
                  </label>

                  
                  <input

                  
  type="text"
  value={`${user?.nombre} (${user?.email})`}

  disabled
  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
/>

                </div>

                {/* Tipo de Mantenimiento - CONDICIONAL */}
                {tipoAviso === "mantenimiento" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Mantenimiento
                    </label>
                    <select
                      name="tipoMantenimiento"
                      value={formData.tipoMantenimiento || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Preventivo">Preventivo</option>
                      <option value="Correctivo">Correctivo</option>
                      <option value="Mejora">Mejora</option>
                      <option value="Predictivo">Predictivo</option>
                    </select>
                  </div>
                )}

                {/* Producto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    name="producto"
                    value={formData.producto || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">Seleccionar</option>
                    {opcionesProducto.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Descripciones */}
                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción Resumida
                  </label>
                  <textarea
                    name="descripcionResumida"
                    value={formData.descripcionResumida || ""}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Resumen breve del aviso"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción Detallada
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ""}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Descripción completa del trabajo a realizar"
                  />
                </div>

                {/* Documentos */}
                <div className="col-span-full">
                  <AdjuntoUploader
                    mode="local"
                    multiple
                    maxFiles={10}
                    label="Documentos Adjuntos"
                    placeholder="Arrastra archivos aquí o haz clic para seleccionar"
                    onFilesChange={(files) =>
                      setFormData((p) => ({ ...p, documentos: files }))
                    }
                  />
                </div>
              </>
            )}

            {/* STEP 2: Datos del Cliente */}
            {wizardStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clienteId"
                    value={formData.clienteId || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razonSocial}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contacto
                  </label>
                  <select
                    name="nombreContacto"
                    value={formData.nombreContacto || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">Seleccionar contacto</option>
                    {contactos.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número OC de Cliente
                  </label>
                  <input
                    type="text"
                    name="ordenCliente"
                    value={formData.ordenCliente || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="OC-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Almacén
                  </label>
                  <input
                    type="text"
                    name="almacen"
                    value={formData.almacen || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Nombre del almacén"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sede
                  </label>
                  <input
                    type="text"
                    name="sede"
                    value={formData.sede || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Sede del cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Correo Contacto
                  </label>
                  <input
                    type="email"
                    name="correoContacto"
                    value={formData.correoContacto || ""}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono Contacto
                  </label>
                  <input
                    type="tel"
                    name="numeroContacto"
                    value={formData.numeroContacto || ""}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>
              </>
            )}

            {/* STEP 3: Gestión */}
            {wizardStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supervisor Asignado
                  </label>
                  <select
  name="supervisorId"
  value={formData.supervisorId || ""}
  onChange={handleInputChange}
  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
>
  <option value="">Seleccionar supervisor</option>

  {supervisores.map((s) => (
    <option key={s.id} value={s.id}>
      {s.nombre} {s.apellido}
    </option>
  ))}
</select>
                </div>

                <div className="col-span-full">
                  <AdjuntoUploader
                    mode="local"
                    multiple={false}
                    label="Documentos de Cierre"
                    placeholder="Adjunta el documento de cierre del servicio"
                    onFilesChange={(files) =>
                      setFormData((p) => ({ ...p, documentoFinal: files[0] ?? null }))
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ERRORES DE ENVÍO */}
        {submitErrors.length > 0 && (
          <div className="mx-6 mb-0 mt-0 p-4 bg-red-50 border border-red-200 rounded-xl">
            {submitErrors.map((err, i) => (
              <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSubmitErrors([]);
                wizardStep === 1 ? onClose() : setWizardStep(wizardStep - 1);
              }}
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-white transition-colors flex items-center gap-2 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              {wizardStep === 1 ? "Cancelar" : "Anterior"}
            </button>

            <div className="text-sm text-gray-500">
              Paso {wizardStep} de {steps.length}
            </div>

            <button
              disabled={saving}
              onClick={() => {
                setSubmitErrors([]);
                wizardStep < 3 ? setWizardStep(wizardStep + 1) : handleGuardarAviso();
              }}
              className={`px-6 py-3 bg-gradient-to-r text-white rounded-xl transition-all flex items-center gap-2 shadow-lg font-medium disabled:opacity-50 ${
                tipoAviso === "venta"
                  ? "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30"
                  : "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30"
              }`}
            >
              {saving ? (
                <>Guardando...</>
              ) : wizardStep < 3 ? (
                <>Siguiente<ChevronRight className="w-4 h-4" /></>
              ) : (
                <><Save className="w-4 h-4" />Guardar Aviso</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Búsqueda para Equipos */}
      <ModalBusqueda
        isOpen={lookupOpen === "equipos"}
        onClose={() => setLookupOpen(null)}
        title="Buscar Equipos"
        data={equiposData}
        onSelect={handleSelectEquipo}
        tipo="equipos"
        equiposSeleccionados={formData.equipos || []}
      />

      {/* Modal de Búsqueda para Ubicación Técnica */}
      <ModalBusqueda
        isOpen={lookupOpen === "ubicacion"}
        onClose={() => setLookupOpen(null)}
        title="Buscar Ubicación Técnica"
        data={ubicacionesData}
        onSelect={handleSelectUbicacion}
        tipo="ubicacion"
        ubicacionesSeleccionadas={formData.ubicaciones || []}
      />
    </div>
  );
}