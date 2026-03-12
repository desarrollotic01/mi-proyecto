import { useState, useEffect, useMemo } from "react";
import { X, Loader2, AlertCircle, Calendar, Package, User, MapPin, Wrench, Plus, ShoppingCart, Building2, Globe, CheckCircle2, Search, Image as ImageIcon, UploadCloud } from "lucide-react";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
export default function EquipoModal({ isOpen, onClose, onSave, initialData, clientes = [], familias = [], paises = [] }) {


  const DEFAULT_FORM = {
    numeroOV: "",
    fechaOV: "",
    numeroOrdenCliente: "",
    fechaOrdenCliente: "",
    clienteId: "",
    id_cliente: "",
    paisId: "",
    tipoEquipoPropiedad: "Vendido",
    sede: "",
    almacen: "",
    operadorLogistico: "",
    status: "Almacen",
    idPlaca: "",
    nombre: "",
    descripcion: "",
    marca: "",
    modelo: "",
    serie: "",
    fechaEntregaPrevista: "",
    fechaEntregaReal: "",
    estado: "No instalado",
    finGarantia: "",
    familiaId: "",
    tipoEquipo: "",
    linea: "Acceso",
    lineaOtroTexto: "",
    codigo: "",
    creticidad: "B",
    planesMantenimientoIds: [],
  };

  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showNewFamilia, setShowNewFamilia] = useState(false);
  const [newFamilia, setNewFamilia] = useState({ nombre: "", descripcion: "" });
  const [planes, setPlanes] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  // 1. Agrega useMemo a tus imports de React arriba
  // import { useState, useEffect, useMemo } from "react";

  const [busquedaPlan, setBusquedaPlan] = useState("");

  const planesFiltrados = useMemo(() => {
    return planes.filter(p =>
      p.nombre?.toLowerCase().includes(busquedaPlan.toLowerCase()) ||
      p.codigoPlan?.toLowerCase().includes(busquedaPlan.toLowerCase())
    );
  }, [planes, busquedaPlan]);


  useEffect(() => {
    const loadPlanes = async () => {
      setLoadingPlanes(true);
      try {
        const data = await planMantenimientoService.getPlanes();
        setPlanes(Array.isArray(data) ? data.filter(p => p.activo) : []);
      } catch (e) {
        console.error("Error cargando planes", e);
        setPlanes([]);
      } finally {
        setLoadingPlanes(false);
      }
    };

    if (isOpen) loadPlanes();
  }, [isOpen]);


  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        ...DEFAULT_FORM,
        ...initialData,
        planesMantenimientoIds: Array.isArray(initialData.planesMantenimiento)
          ? initialData.planesMantenimiento.map((p) => p.id)
          : Array.isArray(initialData.planesMantenimientoIds)
            ? initialData.planesMantenimientoIds
            : [],
      });
    } else {
      setForm(DEFAULT_FORM);
    }

    setError(null);
    setActiveTab("general");
    setShowNewFamilia(false);
    setNewFamilia({ nombre: "", descripcion: "" });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // 1. Crear una lista de campos faltantes
    const faltantes = [];
    if (!form.codigo) faltantes.push("Código");
    if (!form.nombre) faltantes.push("Nombre");
    if (!form.numeroOV) faltantes.push("Número OV");
    if (!form.clienteId) faltantes.push("Cliente");
    if (!form.paisId) faltantes.push("País");
    if (!form.tipoEquipoPropiedad) faltantes.push("Tipo de Propiedad");

    if (faltantes.length > 0) {
      setError(`Faltan completar campos obligatorios: ${faltantes.join(", ")}`);
      return;
    }

    // Validar "Otros" en línea
    if (form.linea === "Otros" && !form.lineaOtroTexto) {
      setError("Debes especificar el texto para 'Otros' en Línea");
      return;
    }

    setLoading(true);
    setError(null);

    setLoading(true);
    setError(null);

    try {
      // 2. Preparamos los datos básicos SIN el campo de imágenes
      const dataToSave = {
        ...form,
        newFamilia: showNewFamilia && newFamilia.nombre ? newFamilia : null,
        // imagenes: []  <-- Simplemente no lo incluimos o lo mandamos vacío
      };

      // 3. Enviamos solo la data de texto
      await onSave(dataToSave);

      onClose();
    } catch (err) {
      // Si sigue saliendo 400, el error está en uno de los campos de texto arriba
      setError(err.response?.data?.message || err.message || "Error al guardar el equipo");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Package },
    { id: "orden", label: "Orden de Venta", icon: User },
    { id: "fechas", label: "Fechas y Garantía", icon: Calendar },
    { id: "planes", label: "Planes", icon: Wrench },
    { id: "archivos", label: "Archivos", icon: ImageIcon },
  ];

  const getTipoPropiedadIcon = (tipo) => {
    switch (tipo) {
      case "Vendido":
        return <ShoppingCart className="w-4 h-4" />;
      case "Propio":
        return <Building2 className="w-4 h-4" />;
      case "Atendido":
        return <Wrench className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl transform transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {initialData ? "Editar Equipo" : "Nuevo Equipo"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {initialData ? "Actualiza la información del equipo" : "Completa los datos del nuevo equipo"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 bg-gray-50 px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 max-h-[calc(100vh-280px)] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* TAB: General */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: EQ-001"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Equipo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Control de acceso vehicular principal"
                  maxLength={60}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">{form.nombre.length}/60 caracteres</p>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.clienteId}
                  onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razonSocial} - {cliente.ruc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lima"
                  value={form.id_cliente}
                  onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Propiedad <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Vendido", "Propio", "Atendido"].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setForm({ ...form, tipoEquipoPropiedad: tipo })}
                      className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${form.tipoEquipoPropiedad === tipo
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      disabled={loading}
                    >
                      {getTipoPropiedadIcon(tipo)}
                      <span className="font-medium text-sm">{tipo}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  País <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={form.paisId}
                    onChange={(e) => setForm({ ...form, paisId: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    disabled={loading}
                  >
                    <option value="">Seleccionar país...</option>
                    {paises.map((pais) => (
                      <option key={pais.id} value={pais.id}>
                        {pais.nombre} ({pais.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sede
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lima"
                  value={form.sede}
                  onChange={(e) => setForm({ ...form, sede: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Almacén
                </label>
                <input
                  type="text"
                  placeholder="Ej: Almacén Central"
                  value={form.almacen}
                  onChange={(e) => setForm({ ...form, almacen: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Operador Logístico
                </label>
                <input
                  type="text"
                  placeholder="Ej: DHL, Shalom"
                  value={form.operadorLogistico}
                  onChange={(e) => setForm({ ...form, operadorLogistico: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                >
                  <option value="Almacen">Almacén</option>
                  <option value="En compra">En compra</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Creticidad
                </label>
                <select
                  value={form.creticidad}
                  onChange={(e) => setForm({ ...form, creticidad: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                >
                  <option value="No instalado">No instalado</option>
                  <option value="Operativo">Operativo</option>
                  <option value="Inoperativo">Inoperativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Placa
                </label>
                <input
                  type="text"
                  placeholder="Ej: ABC-123"
                  value={form.idPlaca}
                  onChange={(e) => setForm({ ...form, idPlaca: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* TAB: Orden de Venta */}
          {activeTab === "orden" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número OV <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: OV-1001"
                  value={form.numeroOV}
                  onChange={(e) => setForm({ ...form, numeroOV: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha OV
                </label>
                <input
                  type="date"
                  value={form.fechaOV}
                  onChange={(e) => setForm({ ...form, fechaOV: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número Orden Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ej: OC-9001"
                  value={form.numeroOrdenCliente}
                  onChange={(e) => setForm({ ...form, numeroOrdenCliente: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Orden Cliente
                </label>
                <input
                  type="date"
                  value={form.fechaOrdenCliente}
                  onChange={(e) => setForm({ ...form, fechaOrdenCliente: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* TAB: Datos del Equipo */}
          {activeTab === "equipo" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción del Equipo
                </label>
                <textarea
                  placeholder="Descripción detallada del equipo, características técnicas, etc."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Familia
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.familiaId}
                    onChange={(e) => {
                      if (e.target.value === "nueva") {
                        setShowNewFamilia(true);
                      } else {
                        setForm({ ...form, familiaId: e.target.value });
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    disabled={loading}
                  >
                    <option value="">Seleccionar familia...</option>
                    {familias.map((familia) => (
                      <option key={familia.id} value={familia.id}>
                        {familia.nombre}
                      </option>
                    ))}

                    {/* <option value="nueva">+ Crear nueva familia</option> */}
                  </select>
                </div>

                {showNewFamilia && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-blue-900">Nueva Familia</p>
                      <button
                        onClick={() => {
                          setShowNewFamilia(false);
                          setNewFamilia({ nombre: "", descripcion: "" });
                        }}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre de la familia (ej: GPS, Cámaras)"
                        value={newFamilia.nombre}
                        onChange={(e) => setNewFamilia({ ...newFamilia, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={newFamilia.descripcion}
                        onChange={(e) => setNewFamilia({ ...newFamilia, descripcion: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                      <p className="text-xs text-blue-700 mt-2">
                        Nota: La familia se creará cuando guardes el equipo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Equipo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Controlador, Rastreador"
                  value={form.tipoEquipo}
                  onChange={(e) => setForm({ ...form, tipoEquipo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  placeholder="Ej: ZKTeco, Teltonika"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  placeholder="Ej: ProAccess X, FMB920"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Serie
                </label>
                <input
                  type="text"
                  placeholder="Ej: SERIE-0001"
                  value={form.serie}
                  onChange={(e) => setForm({ ...form, serie: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Línea
                </label>
                <select
                  value={form.linea}
                  onChange={(e) => setForm({ ...form, linea: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                >
                  <option value="Acceso">Acceso</option>
                  <option value="Autosat">Autosat</option>
                  <option value="Vehiculos">Vehículos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              {form.linea === "Otros" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Especificar otra línea <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Especificar línea personalizada..."
                    value={form.lineaOtroTexto || ""}
                    onChange={(e) => setForm({ ...form, lineaOtroTexto: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: Fechas y Garantía */}
          {activeTab === "fechas" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Entrega Prevista
                </label>
                <input
                  type="date"
                  value={form.fechaEntregaPrevista}
                  onChange={(e) => setForm({ ...form, fechaEntregaPrevista: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Entrega Real
                </label>
                <input
                  type="date"
                  value={form.fechaEntregaReal || ""}
                  onChange={(e) => setForm({ ...form, fechaEntregaReal: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fin de Garantía
                </label>
                <input
                  type="date"
                  value={form.finGarantia}
                  onChange={(e) => setForm({ ...form, finGarantia: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Información de fechas</p>
                    <p className="text-xs text-blue-700 mt-1">
                      La fecha de entrega prevista es estimada. La fecha real se actualiza cuando el equipo es entregado.
                      La garantía se calcula automáticamente a partir de la fecha de entrega real.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* TAB: Archivos / Imágenes */}
          {activeTab === "archivos" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-900">Galería del Equipo</p>
                <p className="text-xs text-blue-700 mt-1">Sube fotos del estado físico, placas o comprobantes.</p>
              </div>

              {/* Zona de Carga */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-10 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="upload-img"
                  onChange={(e) => {
                    // Aquí manejarás la lógica de archivos
                    const files = Array.from(e.target.files);
                    console.log("Archivos seleccionados:", files);
                  }}
                />
                <label htmlFor="upload-img" className="flex flex-col items-center gap-3 cursor-pointer">
                  <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Haz clic para añadir imágenes</span>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">JPG, PNG o WEBP</span>
                </label>
              </div>

              {/* Contenedor de Vista Previa (Placeholder) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {/* Aquí se mapearán las imágenes seleccionadas */}
                <div className="aspect-square bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center border-dotted">
                  <ImageIcon className="text-slate-300" size={32} />
                </div>
              </div>
            </div>
          )}


          {/* TAB: Planes de Mantenimiento */}
          {activeTab === "planes" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-900">
                  Vincular Planes de Mantenimiento al Equipo
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Selecciona uno o varios planes. Se guardarán como relación (belongsToMany).
                </p>
              </div>
              {/* --- BUSCADOR --- */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar plan por nombre o código..."
                  value={busquedaPlan}
                  onChange={(e) => setBusquedaPlan(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              {loadingPlanes ? (

                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando planes...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planesFiltrados.length === 0 ? (
                    <div className="md:col-span-2 p-10 border border-dashed border-slate-300 rounded-xl text-center">
                      <p className="text-slate-700 font-medium">
                        {planes.length === 0 ? "No hay planes activos" : "No se encontraron planes"}
                      </p>
                    </div>
                  ) : (
                    planesFiltrados.map((p) => {
                      const checked = form.planesMantenimientoIds.includes(p.id);

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setForm((prev) => {
                              const existe = prev.planesMantenimientoIds.includes(p.id);
                              return {
                                ...prev,
                                planesMantenimientoIds: existe
                                  ? prev.planesMantenimientoIds.filter((x) => x !== p.id)
                                  : [...prev.planesMantenimientoIds, p.id],
                              };
                            });
                          }}
                          className={`text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${checked
                              ? "border-emerald-400 bg-emerald-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          disabled={loading}
                        >
                          <div className={`mt-0.5 ${checked ? "text-emerald-600" : "text-slate-400"}`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>

                          <div className="flex-1">
                            <p className="font-bold text-slate-800">{p.nombre}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                                {p.codigoPlan || "SIN CÓDIGO"}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                                {p.tipo}
                              </span>
                              {p.esEspecifico && (
                                <span className="text-xs px-2 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 font-bold">
                                  ESPECÍFICO
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-2">
                              {p.actividades?.length || 0} actividades
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* resumen */}
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-slate-600">
                  Seleccionados:{" "}
                  <b className="text-slate-800">{form.planesMantenimientoIds.length}</b>
                </p>

                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, planesMantenimientoIds: [] }))}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  disabled={loading}
                >
                  Limpiar selección
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !form.codigo || !form.numeroOV || !form.clienteId || !form.nombre || !form.paisId || !form.tipoEquipoPropiedad}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "Actualizar Equipo" : "Crear Equipo"}
          </button>
        </div>
      </div>
    </div>
  );
} 