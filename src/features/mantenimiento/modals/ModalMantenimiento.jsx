import { useState, useEffect } from "react";
import { 
  X, ChevronRight, ChevronLeft, Save, FileText, Users, Settings, 
  AlertCircle, Plus, Trash2, Wrench, Package, MapPin, Calendar,
  User, Building, Phone, Mail, Upload, CheckCircle, Search
} from "lucide-react";

import { useAuth } from "../../../auth/context/AuthContext";
import { crearAviso } from "../services/avisoServices";
import { clienteService } from "../services/clienteService";
import { equipoService } from "../services/equipoService";
import { UbicacionTecnicaService } from "../services/ubicacionService";
import { getContactosPorCliente } from "../services/contactoService";
import { paisService } from "../services/paisService";



const opcionesProducto = [
  "Racks", "Vehiculo", "Autosat", "Techo y Cerramiento",
  "Equipos Propios", "Sanitarias", "HVAC", "DACI", "ACI",
  "Datos y Comunicaciones", "Eléctrico", "Pisos y Estructuras",
];

/* ================= MODAL DE BÚSQUEDA ================= */
function ModalBusqueda({ isOpen, onClose, title, data, onSelect, tipo, equiposSeleccionados = [] }) {
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
                const yaSeleccionado = tipo === "equipos" && isEquipoSeleccionado(item.id);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      if (tipo === "ubicacion") {
                        onClose();
                      }
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
                            <MapPin className="w-5 h-5 text-green-600" />
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

        {/* Footer con botón cerrar para equipos */}
        {tipo === "equipos" && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Listo - Cerrar
            </button>
          </div>
        )}
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
        const [clientesData, equiposResp, ubicacionesResp,paisesResp] = await Promise.all([
          clienteService.getClientes(),
          equipoService.getEquipos(),
          UbicacionTecnicaService.getUbicacionTecnicas(),
          paisService.getPaises()
        ]);


        setPaises(paisesResp);
        setClientes(clientesData);
        setEquiposData(equiposResp);
        setUbicacionesData(ubicacionesResp);

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
      setFormData((p) => ({ ...p, [name]: files[0] }));
      return;
    }

    if (name === "ordenVenta") {
      const ventaLimpia = value.trim();
      let nuevoCodigo = "";

      if (ventaLimpia) {
        const numeros = listaAvisos.map((a) => {
          if (!a.numeroAviso) return 0;
          const partes = a.numeroAviso.split("AV");
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

    if (name === "cliente") {
      setFormData({
        ...formData,
        cliente: value, 
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
  try {

    // ✅ VALIDACIÓN NUEVA
    if (tipoAviso === "mantenimiento" && !formData.tipoMantenimiento) {
      alert("Debe seleccionar el tipo de mantenimiento");
      setSaving(false);
      return;
    }

    const payload = {
      ...formData,
      tipoAviso,
      tipoMantenimiento:
        tipoAviso === "instalacion"
          ? null
          : formData.tipoMantenimiento,
    };

    delete payload.estadoAviso;
    delete payload.ubicacionTecnicaId;

    await crearAviso(payload);

    onCreated?.();
    onClose();
  } catch (error) {
    alert(
      error.response?.data?.errors?.join("\n") ||
      "Error al guardar aviso"
    );
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
                setFormData(p => ({
                  ...p,
                  tipoMantenimiento: null,
                }));
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


                {/* 🔄 CAMBIO: Renderizamos equipos usando sus IDs */}
                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equipos
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
  onClick={() => !tieneUbicacion && setLookupOpen("equipos")}
  disabled={tieneUbicacion}
  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 font-medium transition-colors
    ${
      tieneUbicacion
        ? "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
        : "border-blue-300 text-blue-600 hover:bg-blue-50"
    }
  `}
>
  <Plus className="w-5 h-5" />
  Buscar y Agregar Equipos
</button>

                  </div>
                </div>

                {/* Ubicación Técnica con Modal */}
           <div className="col-span-full">
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
</div>


                {formData.equipos?.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dirección de Atención
                    </label>

                    <select
                      name="direccionAtencion"
                      value={formData.direccionAtencion || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar dirección</option>

                      {direccionesDesdeEquipos().map((dir) => (
                        <option key={dir} value={dir}>
                          {dir}
                        </option>
                      ))}
                    </select>

                    <p className="text-xs text-gray-500 mt-1">
                      Se muestran las ubicaciones de los equipos seleccionados
                    </p>
                  </div>
                )}

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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Documentos Adjuntos
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      name="documentos"
                      onChange={handleInputChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      Seleccionar Archivos
                    </label>
                  </div>
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
                    name="cliente"
                    value={formData.cliente || ""}
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
                  <input
                    type="text"
                    name="supervisorAsignado"
                    value={formData.supervisorAsignado || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Nombre del supervisor"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Documento Final
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Adjunta el documento final del servicio
                    </p>
                    <input
                      type="file"
                      name="documentoFinal"
                      onChange={handleInputChange}
                      className="hidden"
                      id="doc-final"
                    />
                    <label
                      htmlFor="doc-final"
                      className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      Seleccionar Documento
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => wizardStep === 1 ? onClose() : setWizardStep(wizardStep - 1)}
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
              onClick={() => wizardStep < 3 ? setWizardStep(wizardStep + 1) : handleGuardarAviso()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50"
            >
              {saving ? (
                <>Guardando...</>
              ) : wizardStep < 3 ? (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Aviso
                </>
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
      />
    </div>
  );
}