  import { useState, useEffect } from "react";
  import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Download,
    Package,
    AlertCircle,
    Loader2,
    Eye,
    Filter,
    X,
    ChevronDown,
    Calendar,
    MapPin,
    Truck,
    Shield,
    Box,
    FileText,
    ShoppingCart,
    Building2,
    Wrench,
    MoveRight,
    Globe,
  } from "lucide-react";

  import { equipoService } from "../mantenimiento/services/equipoService";
  import { clienteService } from "../mantenimiento/services/clienteService";
  import { familiaService } from "./service/familiaService";
  import { paisService } from "../mantenimiento/services/paisService";
  import EquipoModal from "./Equipomodal";
  import ModalCrearPlan from "../PlanMantenimiento/components/ModalCrearPlan";

  /* ================= MODAL DE DETALLE ================= */
  function EquipoDetailModal({ isOpen, onClose, equipo }) {
    if (!isOpen || !equipo) return null;

    const formatDate = (date) => {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[9999] p-4 animate-fadeIn overflow-y-auto">

<div className="bg-white w-full max-w-7xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-slideUp my-8">          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{equipo.codigo}</h3>
                  <p className="text-sm text-gray-500 mt-1">{equipo.nombre || "Sin nombre"}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cliente y Ubicación */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Cliente y Ubicación</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Cliente</p>
                    <p className="font-semibold text-gray-900">
                      {equipo.cliente?.razonSocial || "-"}
                    </p>
                    <p className="text-sm text-gray-600">{equipo.cliente?.ruc || "-"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Sede</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.sede || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Almacén</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.almacen || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ID Placa</p>
                    <p className="text-sm font-mono font-medium text-gray-900 bg-white px-3 py-1.5 rounded-lg inline-block">
                      {equipo.idPlaca || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tipo y País */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-900">Tipo y Ubicación</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tipo de Propiedad</p>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                        equipo.tipoEquipoPropiedad === "Vendido"
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : equipo.tipoEquipoPropiedad === "Propio"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-purple-100 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {equipo.tipoEquipoPropiedad === "Vendido" && <ShoppingCart className="w-4 h-4" />}
                      {equipo.tipoEquipoPropiedad === "Propio" && <Building2 className="w-4 h-4" />}
                      {equipo.tipoEquipoPropiedad === "Atendido" && <Wrench className="w-4 h-4" />}
                      {equipo.tipoEquipoPropiedad || "-"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">País</p>
                    <p className="text-sm font-medium text-gray-900">
                      {equipo.pais?.nombre || "-"} 
                      {equipo.pais?.codigo && (
                        <span className="ml-2 text-xs text-gray-500">({equipo.pais.codigo})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Orden de Venta */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Orden de Venta</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Número OV</p>
                      <p className="text-sm font-mono font-semibold text-gray-900 bg-white px-3 py-1.5 rounded-lg">
                        {equipo.numeroOV}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Fecha OV</p>
                      <p className="text-sm font-medium text-gray-900 bg-white px-3 py-1.5 rounded-lg">
                        {formatDate(equipo.fechaOV)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Orden Cliente</p>
                      <p className="text-sm font-mono font-medium text-gray-900 bg-white px-3 py-1.5 rounded-lg">
                        {equipo.numeroOrdenCliente || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Fecha Orden</p>
                      <p className="text-sm font-medium text-gray-900 bg-white px-3 py-1.5 rounded-lg">
                        {formatDate(equipo.fechaOrdenCliente)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Especificaciones del Equipo */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Box className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Especificaciones</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Familia</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.familia?.nombre || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Tipo</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.tipoEquipo || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Marca</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.marca || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Modelo</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.modelo || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Serie</p>
                      <p className="text-sm font-mono font-medium text-gray-900 bg-white px-3 py-1.5 rounded-lg">
                        {equipo.serie || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Línea</p>
                      <p className="text-sm font-medium text-gray-900">{equipo.linea || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logística y Estado */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">Logística y Estado</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Operador Logístico</p>
                    <p className="text-sm font-medium text-gray-900">{equipo.operadorLogistico || "-"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          equipo.status === "Almacen"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : equipo.status === "En compra"
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                      >
                        {equipo.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Estado</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          equipo.estado === "Operativo"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : equipo.estado === "Inoperativo"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {equipo.estado}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas y Garantía */}
              <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">Fechas y Garantía</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Entrega Prevista</p>
                    <p className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-lg">
                      {formatDate(equipo.fechaEntregaPrevista)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Entrega Real</p>
                    <p className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-lg">
                      {formatDate(equipo.fechaEntregaReal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Fin de Garantía
                    </p>
                    <p className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-lg">
                      {formatDate(equipo.finGarantia)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {equipo.descripcion && (
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Descripción</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {equipo.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= TARJETA DE EQUIPO KANBAN ================= */
  function EquipoCard({ equipo, onEdit, onDelete, onView, onMove, onCreatePlan }) {
    const [showMoveMenu, setShowMoveMenu] = useState(false);

    const getTipoIcon = (tipo) => {
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

    const formatDate = (date) => {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-4 group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-mono font-bold text-gray-900 text-sm truncate">
              {equipo.codigo}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{equipo.nombre || "-"}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onCreatePlan(equipo)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Crear plan de mantenimiento"
            >
              <Wrench className="w-4 h-4" />
            </button>
            <button
              onClick={() => onView(equipo)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Ver detalle"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(equipo)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(equipo.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OV */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-mono font-medium text-gray-700">{equipo.numeroOV}</span>
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-start gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {equipo.cliente?.razonSocial || "-"}
              </p>
              {equipo.sede && (
                <p className="text-xs text-gray-500 truncate">{equipo.sede}</p>
              )}
            </div>
          </div>
        </div>

        {/* Equipo Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Marca:</span>
            <span className="font-medium text-gray-900 truncate ml-2">{equipo.marca || "-"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Modelo:</span>
            <span className="font-medium text-gray-900 truncate ml-2">{equipo.modelo || "-"}</span>
          </div>
          {equipo.serie && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Serie:</span>
              <span className="font-mono text-gray-700 truncate ml-2">{equipo.serie}</span>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              equipo.status === "Almacen"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : equipo.status === "En compra"
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {equipo.status}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              equipo.estado === "Operativo"
                ? "bg-green-50 text-green-700 border border-green-200"
                : equipo.estado === "Inoperativo"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            {equipo.estado}
          </span>
        </div>

        {/* Footer - Move Button */}
        <div className="relative">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="w-full px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium border border-gray-200"
          >
            <MoveRight className="w-3.5 h-3.5" />
            Mover a...
          </button>

          {showMoveMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMoveMenu(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20">
                {["Vendido", "Propio", "Atendido"]
                  .filter((tipo) => tipo !== equipo.tipoEquipoPropiedad)
                  .map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => {
                        onMove(equipo, tipo);
                        setShowMoveMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {getTipoIcon(tipo)}
                      {tipo}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ================= COLUMNA KANBAN ================= */
  function KanbanColumn({ title, icon: Icon, color, equipos, onEdit, onDelete, onView, onMove, onCreatePlan }) {
    const colorClasses = {
      blue: {
        bg: "from-blue-50 to-blue-100/50",
        border: "border-blue-200",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        badgeBg: "bg-blue-600",
      },
      green: {
        bg: "from-green-50 to-green-100/50",
        border: "border-green-200",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        badgeBg: "bg-green-600",
      },
      purple: {
        bg: "from-purple-50 to-purple-100/50",
        border: "border-purple-200",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        badgeBg: "bg-purple-600",
      },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <div className="flex flex-col">
        {/* Column Header */}
        <div className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${colors.iconBg} rounded-lg`}>
                <Icon className={`w-5 h-5 ${colors.iconColor}`} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {equipos.length} {equipos.length === 1 ? "equipo" : "equipos"}
                </p>
              </div>
            </div>
            <div className={`${colors.badgeBg} text-white font-bold text-sm px-3 py-1.5 rounded-lg`}>
              {equipos.length}
            </div>
          </div>
        </div>

        {/* Column Content */}
        <div className="space-y-3">
          {equipos.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No hay equipos</p>
              <p className="text-xs text-gray-400 mt-1">Los equipos aparecerán aquí</p>
            </div>
          ) : (
            equipos.map((equipo) => (
              <EquipoCard
                key={equipo.id}
                equipo={equipo}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                onMove={onMove}
                onCreatePlan={onCreatePlan}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  /* ================= MAIN PAGE ================= */
  export default function EquiposPage() {
    const [equipos, setEquipos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [familias, setFamilias] = useState([]);
    const [paises, setPaises] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [selectedEquipo, setSelectedEquipo] = useState(null);
    const [equipoParaPlan, setEquipoParaPlan] = useState(null);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [filterEstado, setFilterEstado] = useState("Todos");
    const [filterCliente, setFilterCliente] = useState("Todos");
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      loadData();
    }, []);

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [equiposData, clientesData, familiasData, paisesData] = await Promise.all([
          equipoService.getEquipos(),
          clienteService.getClientes().catch(() => []),
          familiaService.getFamilias().catch(() => []),
          paisService.getPaises().catch(() => []),
        ]);

        setEquipos(equiposData);
        setClientes(clientesData);
        setFamilias(familiasData);
        setPaises(paisesData);
      } catch (err) {
        setError("Error al cargar los datos. Verifica que el backend esté corriendo.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const handleSave = async (dataWithNewFamilia) => {
      try {
        let familiaId = dataWithNewFamilia.familiaId;

        if (dataWithNewFamilia.newFamilia && dataWithNewFamilia.newFamilia.nombre) {
          const nuevaFamilia = await equipoService.createFamilia({
            nombre: dataWithNewFamilia.newFamilia.nombre,
            descripcion: dataWithNewFamilia.newFamilia.descripcion || null,
          });
          familiaId = nuevaFamilia.id;
        }

        const { newFamilia, ...equipoData } = dataWithNewFamilia;
        equipoData.familiaId = familiaId;

        if (editing) {
          await equipoService.updateEquipo(editing.id, equipoData);
        } else {
          await equipoService.createEquipo(equipoData);
        }

        await loadData();
        setModalOpen(false);
        setEditing(null);
      } catch (err) {
        throw err;
      }
    };

    const handleDelete = async (id) => {
      if (confirm("¿Estás seguro de eliminar este equipo?")) {
        try {
          await equipoService.deleteEquipo(id);
          await loadData();
        } catch (err) {
          alert("Error al eliminar el equipo: " + err.message);
          console.error(err);
        }
      }
    };

    const handleMove = async (equipo, newTipo) => {
      try {
        await equipoService.updateEquipo(equipo.id, {
          ...equipo,
          tipoEquipoPropiedad: newTipo,
        });
        await loadData();
      } catch (err) {
        alert("Error al mover el equipo: " + err.message);
        console.error(err);
      }
    };

    const handleCreatePlan = (equipo) => {
      setEquipoParaPlan(equipo);
      setPlanModalOpen(true);
    };

    const handlePlanCreated = () => {
      setPlanModalOpen(false);
      setEquipoParaPlan(null);
      alert("Plan de mantenimiento creado exitosamente");
    };

    const filteredEquipos = equipos.filter((eq) => {
      const matchesSearch =
        eq.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.numeroOV?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.cliente?.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "Todos" || eq.status === filterStatus;
      const matchesEstado = filterEstado === "Todos" || eq.estado === filterEstado;
      const matchesCliente = filterCliente === "Todos" || eq.clienteId === filterCliente;

      return matchesSearch && matchesStatus && matchesEstado && matchesCliente;
    });

    // Separar por tipo de propiedad
    const vendidos = filteredEquipos.filter((e) => e.tipoEquipoPropiedad === "Vendido");
    const propios = filteredEquipos.filter((e) => e.tipoEquipoPropiedad === "Propio");
    const atendidos = filteredEquipos.filter((e) => e.tipoEquipoPropiedad === "Atendido");

    // Estadísticas
    const stats = {
      total: equipos.length,
      vendidos: equipos.filter((e) => e.tipoEquipoPropiedad === "Vendido").length,
      propios: equipos.filter((e) => e.tipoEquipoPropiedad === "Propio").length,
      atendidos: equipos.filter((e) => e.tipoEquipoPropiedad === "Atendido").length,
      operativos: equipos.filter((e) => e.estado === "Operativo").length,
    };

    if (loading && equipos.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Cargando equipos...</p>
            <p className="text-sm text-gray-500 mt-2">Conectando con el servidor</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 w-full">
        <div className="max-w-[1800px] mx-auto w-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Equipos</h1>
              <p className="text-gray-600">Vista Kanban por tipo de propiedad</p>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 font-medium"
            >
              <Plus className="w-5 h-5" />
              Agregar Equipo
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">
                  Asegúrate de que tu backend esté en:{" "}
                  <code className="bg-red-100 px-2 py-1 rounded">http://localhost:3000/api</code>
                </p>
              </div>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reintentar"}
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <Package className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendidos</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.vendidos}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propios</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.propios}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Atendidos</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.atendidos}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Operativos</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.operativos}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por código, nombre, OV, marca, modelo, serie o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 border rounded-xl transition-all flex items-center gap-2 font-medium ${
                    showFilters
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>

                <button
                  onClick={loadData}
                  className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                  disabled={loading}
                  title="Actualizar lista"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                    >
                      <option value="Todos">Todos los status</option>
                      <option value="Almacen">Almacén</option>
                      <option value="En compra">En compra</option>
                      <option value="Entregado">Entregado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Estado</label>
                    <select
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                    >
                      <option value="Todos">Todos los estados</option>
                      <option value="No instalado">No instalado</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Inoperativo">Inoperativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Cliente</label>
                    <select
                      value={filterCliente}
                      onChange={(e) => setFilterCliente(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                    >
                      <option value="Todos">Todos los clientes</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.razonSocial}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            <KanbanColumn
              title="Vendidos"
              icon={ShoppingCart}
              color="blue"
              equipos={vendidos}
              onEdit={(equipo) => {
                setEditing(equipo);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onView={(equipo) => {
                setSelectedEquipo(equipo);
                setDetailModalOpen(true);
              }}
              onMove={handleMove}
              onCreatePlan={handleCreatePlan}
            />

            <KanbanColumn
              title="Propios"
              icon={Building2}
              color="green"
              equipos={propios}
              onEdit={(equipo) => {
                setEditing(equipo);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onView={(equipo) => {
                setSelectedEquipo(equipo);
                setDetailModalOpen(true);
              }}
              onMove={handleMove}
              onCreatePlan={handleCreatePlan}
            />

            <KanbanColumn
              title="Atendidos"
              icon={Wrench}
              color="purple"
              equipos={atendidos}
              onEdit={(equipo) => {
                setEditing(equipo);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onView={(equipo) => {
                setSelectedEquipo(equipo);
                setDetailModalOpen(true);
              }}
              onMove={handleMove}
              onCreatePlan={handleCreatePlan}
            />
          </div>
        </div>

        {/* Modals */}
        <EquipoModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
          initialData={editing}
          clientes={clientes}
          familias={familias}
          paises={paises}
        />

        <EquipoDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedEquipo(null);
          }}
          equipo={selectedEquipo}
        />

        {planModalOpen && (
          <ModalCrearPlan
            onClose={() => {
              setPlanModalOpen(false);
              setEquipoParaPlan(null);
            }}
            onCreated={handlePlanCreated}
            equipoPreseleccionado={equipoParaPlan}
          />
        )}
      </div>
    );
  }