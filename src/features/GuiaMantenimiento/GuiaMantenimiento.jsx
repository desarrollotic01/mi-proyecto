import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  Settings,
  Package,
  Users,
  Mail,
  ChevronRight,
  Wrench,
  CalendarDays,
  AlertTriangle,
  Eye,
  Edit,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

/* =================== DATOS DE EJEMPLO =================== */
const EQUIPOS_EJEMPLO = [
  { id: "1", codigo: "EQ-001", nombre: "Montacarga Toyota", cliente: "Propio ALSUD", tipoPropiedad: "Propio" },
  { id: "2", codigo: "EQ-002", nombre: "Compresor Atlas", cliente: "Minera San Rafael", tipoPropiedad: "Vendido" },
  { id: "3", codigo: "EQ-003", nombre: "GPS Teltonika FMB920", cliente: "Transportes Rápidos", tipoPropiedad: "Atendido" },
  { id: "4", codigo: "EQ-004", nombre: "Control Acceso ZK", cliente: "Corporación ABC", tipoPropiedad: "Vendido" },
  { id: "5", codigo: "EQ-005", nombre: "Sistema CCTV Hikvision", cliente: "Propio ALSUD", tipoPropiedad: "Propio" },
];

const PLANES_MANTENIMIENTO = [
  {
    id: "p1",
    nombre: "Mantenimiento Preventivo Mensual",
    descripcion: "Revisión mensual de componentes críticos",
    periodicidad: "Mensual",
    diasAnticipacion: 7,
    tareas: ["Inspección visual", "Lubricación", "Limpieza de filtros", "Revisión de conexiones"],
  },
  {
    id: "p2",
    nombre: "Mantenimiento Trimestral",
    descripcion: "Mantenimiento completo cada 3 meses",
    periodicidad: "Trimestral",
    diasAnticipacion: 15,
    tareas: ["Revisión completa", "Cambio de aceite", "Calibración", "Pruebas de funcionamiento"],
  },
  {
    id: "p3",
    nombre: "Inspección Anual",
    descripcion: "Inspección anual exhaustiva",
    periodicidad: "Anual",
    diasAnticipacion: 30,
    tareas: ["Auditoría completa", "Reemplazo de componentes", "Certificación", "Documentación"],
  },
];

const MANTENIMIENTOS_PROGRAMADOS = [
  {
    id: "m1",
    equipoId: "1",
    equipo: "Montacarga Toyota",
    planId: "p1",
    planNombre: "Mantenimiento Preventivo Mensual",
    fechaProxima: "2026-02-20",
    fechaUltimo: "2026-01-20",
    estado: "Pendiente",
    alertaActiva: true,
    cliente: "Propio ALSUD",
    tipoPropiedad: "Propio",
  },
  {
    id: "m2",
    equipoId: "2",
    equipo: "Compresor Atlas",
    planId: "p2",
    planNombre: "Mantenimiento Trimestral",
    fechaProxima: "2026-03-15",
    fechaUltimo: "2025-12-15",
    estado: "Programado",
    alertaActiva: false,
    cliente: "Minera San Rafael",
    tipoPropiedad: "Vendido",
  },
  {
    id: "m3",
    equipoId: "3",
    equipo: "GPS Teltonika FMB920",
    planId: "p1",
    planNombre: "Mantenimiento Preventivo Mensual",
    fechaProxima: "2026-02-18",
    fechaUltimo: "2026-01-18",
    estado: "Pendiente",
    alertaActiva: true,
    cliente: "Transportes Rápidos",
    tipoPropiedad: "Atendido",
  },
  {
    id: "m4",
    equipoId: "1",
    equipo: "Montacarga Toyota",
    planId: "p3",
    planNombre: "Inspección Anual",
    fechaProxima: "2026-12-01",
    fechaUltimo: "2025-12-01",
    estado: "Programado",
    alertaActiva: false,
    cliente: "Propio ALSUD",
    tipoPropiedad: "Propio",
  },
  {
    id: "m5",
    equipoId: "4",
    equipo: "Control Acceso ZK",
    planId: "p1",
    planNombre: "Mantenimiento Preventivo Mensual",
    fechaProxima: "2026-02-25",
    fechaUltimo: "2026-01-25",
    estado: "Atrasado",
    alertaActiva: true,
    cliente: "Corporación ABC",
    tipoPropiedad: "Vendido",
  },
];

/* =================== MODAL ACTIVAR PLAN =================== */
function ActivarPlanModal({ isOpen, onClose, equipo, planes, onActivar }) {
  const [planSeleccionado, setPlanSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0]
  );

  if (!isOpen) return null;

  const handleActivar = () => {
    if (!planSeleccionado) {
      alert("Debes seleccionar un plan");
      return;
    }
    onActivar({
      equipoId: equipo.id,
      planId: planSeleccionado,
      fechaInicio,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Activar Plan de Mantenimiento
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {equipo?.codigo} - {equipo?.nombre}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleccionar Plan de Mantenimiento
            </label>
            <select
              value={planSeleccionado}
              onChange={(e) => setPlanSeleccionado(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Seleccionar plan...</option>
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} - {plan.periodicidad}
                </option>
              ))}
            </select>
          </div>

          {planSeleccionado && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-2">
                Detalles del Plan
              </h4>
              {(() => {
                const plan = planes.find((p) => p.id === planSeleccionado);
                return (
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-800">
                      <strong>Descripción:</strong> {plan.descripcion}
                    </p>
                    <p className="text-blue-800">
                      <strong>Periodicidad:</strong> {plan.periodicidad}
                    </p>
                    <p className="text-blue-800">
                      <strong>Alerta anticipada:</strong> {plan.diasAnticipacion}{" "}
                      días antes
                    </p>
                    <div>
                      <strong className="text-blue-800">Tareas incluidas:</strong>
                      <ul className="list-disc list-inside mt-1 text-blue-700">
                        {plan.tareas.map((tarea, idx) => (
                          <li key={idx}>{tarea}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Primer Mantenimiento
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              El sistema calculará automáticamente las siguientes fechas según la
              periodicidad del plan
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleActivar}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-lg shadow-green-500/30 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Activar Plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== MODAL DETALLE MANTENIMIENTO =================== */
function DetalleMantenimientoModal({ isOpen, onClose, mantenimiento, onCrearOT }) {
  if (!isOpen || !mantenimiento) return null;

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const diasRestantes = Math.ceil(
    (new Date(mantenimiento.fechaProxima) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Detalle de Mantenimiento
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {mantenimiento.equipo}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                mantenimiento.estado === "Pendiente"
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  : mantenimiento.estado === "Programado"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {mantenimiento.estado}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Alerta */}
          {mantenimiento.alertaActiva && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900">
                  ¡Alerta de Mantenimiento!
                </p>
                <p className="text-sm text-orange-700">
                  Faltan {diasRestantes} días para el próximo mantenimiento
                </p>
              </div>
            </div>
          )}

          {/* Información del Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Plan de Mantenimiento</p>
              <p className="font-semibold text-gray-900">
                {mantenimiento.planNombre}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Cliente</p>
              <p className="font-semibold text-gray-900">
                {mantenimiento.cliente}
              </p>
              <span className="text-xs text-gray-500">
                ({mantenimiento.tipoPropiedad})
              </span>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-900">
                  Próximo Mantenimiento
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {formatFecha(mantenimiento.fechaProxima)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                En {diasRestantes} días
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-900">
                  Último Mantenimiento
                </p>
              </div>
              <p className="text-lg font-bold text-green-900">
                {formatFecha(mantenimiento.fechaUltimo)}
              </p>
            </div>
          </div>

          {/* Acciones según tipo */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Acciones Automáticas
            </h4>
            <div className="space-y-2 text-sm">
              {mantenimiento.tipoPropiedad === "Propio" ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-purple-800">
                      Al llegar la fecha: Se creará automáticamente una Orden de
                      Trabajo
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-purple-800">
                      Notificación interna al equipo técnico
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-purple-800">
                      Al llegar la fecha: Se enviará correo al cliente
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-purple-800">
                      Recordatorio interno para seguimiento
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
          >
            Cerrar
          </button>
          {mantenimiento.tipoPropiedad === "Propio" && (
            <button
              onClick={() => {
                onCrearOT(mantenimiento);
                alert(
                  "Orden de Trabajo creada exitosamente!\nSe ha actualizado la fecha del próximo mantenimiento."
                );
                onClose();
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Orden de Trabajo
            </button>
          )}
          {mantenimiento.tipoPropiedad !== "Propio" && (
            <button
              onClick={() => {
                alert(
                  `Correo enviado a ${mantenimiento.cliente}\nAsunto: Recordatorio de Mantenimiento Programado`
                );
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg shadow-purple-500/30 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Enviar Correo al Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =================== PÁGINA PRINCIPAL =================== */
export default function ProgramacionMantenimientoPage() {
  const [equipos] = useState(EQUIPOS_EJEMPLO);
  const [planes] = useState(PLANES_MANTENIMIENTO);
  const [mantenimientos, setMantenimientos] = useState(MANTENIMIENTOS_PROGRAMADOS);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalActivar, setModalActivar] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);
  const [vistaActual, setVistaActual] = useState("lista"); // 'lista' o 'equipos'

  const handleActivarPlan = (data) => {
    const nuevoMantenimiento = {
      id: `m${mantenimientos.length + 1}`,
      equipoId: data.equipoId,
      equipo: equipos.find((e) => e.id === data.equipoId)?.nombre,
      planId: data.planId,
      planNombre: planes.find((p) => p.id === data.planId)?.nombre,
      fechaProxima: data.fechaInicio,
      fechaUltimo: null,
      estado: "Programado",
      alertaActiva: false,
      cliente: equipos.find((e) => e.id === data.equipoId)?.cliente,
      tipoPropiedad: equipos.find((e) => e.id === data.equipoId)?.tipoPropiedad,
    };
    setMantenimientos([...mantenimientos, nuevoMantenimiento]);
    alert("Plan de mantenimiento activado exitosamente!");
  };

  const handleCrearOT = (mantenimiento) => {
    // Simular creación de OT y actualización de fechas
    console.log("Creando OT para:", mantenimiento);
  };

  const mantenimientosFiltrados = mantenimientos.filter((m) => {
    const matchTipo =
      filtroTipo === "Todos" || m.tipoPropiedad === filtroTipo;
    const matchSearch =
      m.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTipo && matchSearch;
  });

  const stats = {
    total: mantenimientos.length,
    pendientes: mantenimientos.filter((m) => m.estado === "Pendiente").length,
    programados: mantenimientos.filter((m) => m.estado === "Programado").length,
    atrasados: mantenimientos.filter((m) => m.estado === "Atrasado").length,
    alertas: mantenimientos.filter((m) => m.alertaActiva).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 w-full">
      <div className="max-w-[1800px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Programación de Mantenimientos
            </h1>
            <p className="text-gray-600">
              Control y gestión de mantenimientos preventivos
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                setVistaActual(vistaActual === "lista" ? "equipos" : "lista")
              }
              className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium text-gray-700"
            >
              {vistaActual === "lista" ? (
                <>
                  <Package className="w-4 h-4" />
                  Ver por Equipos
                </>
              ) : (
                <>
                  <CalendarDays className="w-4 h-4" />
                  Ver Lista
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <Wrench className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.pendientes}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programados</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.programados}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Atrasados</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.atrasados}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.alertas}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por equipo o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Propio">Propios ALSUD</option>
              <option value="Vendido">Equipos Vendidos</option>
              <option value="Atendido">Equipos Atendidos</option>
            </select>
          </div>
        </div>

        {/* Vista Lista o Vista Equipos */}
        {vistaActual === "lista" ? (
          /* Vista Lista de Mantenimientos */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Equipo
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Plan
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Cliente
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Próximo Mtto
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Alerta
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mantenimientosFiltrados.map((mant) => (
                    <tr
                      key={mant.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            mant.estado === "Pendiente"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : mant.estado === "Programado"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {mant.estado}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {mant.equipo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mant.tipoPropiedad}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-700">{mant.planNombre}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-700">{mant.cliente}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(mant.fechaProxima).toLocaleDateString("es-PE")}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        {mant.alertaActiva ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Bell className="w-4 h-4" />
                            <span className="text-xs font-medium">Activa</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => {
                            setMantenimientoSeleccionado(mant);
                            setModalDetalle(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Vista por Equipos */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {equipos.map((equipo) => {
              const mantsEquipo = mantenimientos.filter(
                (m) => m.equipoId === equipo.id
              );
              return (
                <div
                  key={equipo.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{equipo.codigo}</h3>
                      <p className="text-sm text-gray-600 mt-1">{equipo.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">{equipo.cliente}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        equipo.tipoPropiedad === "Propio"
                          ? "bg-green-100 text-green-700"
                          : equipo.tipoPropiedad === "Vendido"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {equipo.tipoPropiedad}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {mantsEquipo.length > 0 ? (
                      mantsEquipo.map((mant) => (
                        <div
                          key={mant.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-700">
                              {mant.planNombre}
                            </p>
                            {mant.alertaActiva && (
                              <Bell className="w-3.5 h-3.5 text-orange-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Próximo:{" "}
                            {new Date(mant.fechaProxima).toLocaleDateString("es-PE")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">
                        Sin mantenimientos programados
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEquipoSeleccionado(equipo);
                      setModalActivar(true);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Activar Plan
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <ActivarPlanModal
        isOpen={modalActivar}
        onClose={() => {
          setModalActivar(false);
          setEquipoSeleccionado(null);
        }}
        equipo={equipoSeleccionado}
        planes={planes}
        onActivar={handleActivarPlan}
      />

      <DetalleMantenimientoModal
        isOpen={modalDetalle}
        onClose={() => {
          setModalDetalle(false);
          setMantenimientoSeleccionado(null);
        }}
        mantenimiento={mantenimientoSeleccionado}
        onCrearOT={handleCrearOT}
      />
    </div>
  );
}