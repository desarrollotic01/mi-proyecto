import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { planMantenimientoService } from "../services/planMantenimientoService";
import {
  Plus,
  Wrench,
  Calendar,
  Settings2,
  Search,
  Filter,
  BadgeCheck,
  FileSpreadsheet,
} from "lucide-react";

import ModalCrearPlan from "../components/ModalCrearPlan";
import VistaPlanesSimple from "../components/VistaPlanesSimple";
import PlanesMantenimientoExcel from "../components/PlanesMantenimientoExcel";
import ModalDetallePlan from "../components/Modaldetalleplan"; 

export default function PlanesMantenimiento() {
  const [planes, setPlanes] = useState([]);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [planAEditar, setPlanAEditar] = useState(null);

  const [vista, setVista] = useState("SIMPLE");
  const [q, setQ] = useState("");
  const [fTipo, setFTipo] = useState("TODOS");
  const [fEstado, setFEstado] = useState("TODOS");

  const cargarPlanes = async () => {
    try {
      const data = await planMantenimientoService.getPlanes();
      setPlanes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando planes", error);
      setPlanes([]);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  const getTipoBadge = (tipo) => {
    const styles = {
      PREVENTIVO: "bg-blue-100 text-blue-700 border-blue-200",
      CORRECTIVO: "bg-red-100 text-red-700 border-red-200",
      MEJORA: "bg-purple-100 text-purple-700 border-purple-200",
      INSPECCION: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return styles[tipo] || styles.PREVENTIVO;
  };

  const getEquiposLabel = (plan) => {
    const equipos = plan?.equipos || [];
    if (!Array.isArray(equipos) || equipos.length === 0) return "Sin asignar";
    const top = equipos
      .slice(0, 2)
      .map((e) => e?.nombre || e?.codigo)
      .filter(Boolean);
    const extra = equipos.length - top.length;
    return extra > 0 ? `${top.join(", ")} +${extra}` : top.join(", ");
  };

  const planesFiltrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return (planes || [])
      .filter((p) => {
        if (fEstado === "ACTIVOS" && !p.activo) return false;
        if (fEstado === "INACTIVOS" && p.activo) return false;
        if (fTipo !== "TODOS" && p.tipo !== fTipo) return false;
        if (!texto) return true;
        const equiposTxt = (p?.equipos || [])
          .map((e) => `${e?.codigo || ""} ${e?.nombre || ""}`.trim())
          .join(" ")
          .toLowerCase();
        const fields = [
          p?.nombre, p?.codigoPlan, p?.tipo, p?.modeloEquipo, p?.tipoEquipo, equiposTxt,
        ].filter(Boolean).join(" ").toLowerCase();
        return fields.includes(texto);
      })
      .sort((a, b) => {
        const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
  }, [planes, q, fTipo, fEstado]);

  const stats = useMemo(() => {
    const total = planes.length;
    const activos = planes.filter((p) => p.activo).length;
    const preventivos = planes.filter((p) => p.tipo === "PREVENTIVO").length;
    const correctivos = planes.filter((p) => p.tipo === "CORRECTIVO").length;
    const especificos = planes.filter((p) => p.esEspecifico).length;
    return { total, activos, preventivos, correctivos, especificos };
  }, [planes]);

  return (
    // ← min-h-screen → h-screen overflow-hidden para que la página use toda la pantalla
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 flex items-center gap-3 mb-1">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Wrench className="text-white" size={28} />
                </div>
                Planes de Mantenimiento
              </h1>
              <p className="text-slate-600 ml-16">Gestiona y organiza tus planes de mantenimiento</p>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-auto">
              <button
                onClick={() => {
                  const data = planesFiltrados.map((p) => ({
                    Código: p.codigoPlan || "",
                    Nombre: p.nombre || "",
                    Tipo: p.tipo || "",
                    "Modelo Equipo": p.modeloEquipo || "",
                    "Tipo Equipo": p.tipoEquipo || "",
                    Equipos: getEquiposLabel(p),
                    Estado: p.activo ? "Activo" : "Inactivo",
                    Específico: p.esEspecifico ? "Sí" : "No",
                    "Fecha Creación": p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-PE") : "",
                    Actividades: (p.actividades || []).length,
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Planes");
                  XLSX.writeFile(wb, `Planes_Mantenimiento_${new Date().toISOString().slice(0,10)}.xlsx`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all duration-200 font-semibold"
              >
                <FileSpreadsheet size={18} />
                Exportar Excel
              </button>
              <button
                onClick={() => setMostrarModalCrear(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span className="font-semibold">Nuevo Plan</span>
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: Calendar, label: "Total", value: stats.total, color: "blue-100 text-blue-600" },
              { icon: Settings2, label: "Activos", value: stats.activos, color: "green-100 text-green-600" },
              { icon: Wrench, label: "Preventivos", value: stats.preventivos, color: "purple-100 text-purple-600" },
              { icon: Wrench, label: "Correctivos", value: stats.correctivos, color: "red-100 text-red-600" },
              { icon: BadgeCheck, label: "Específicos", value: stats.especificos, color: "emerald-100 text-emerald-600" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`bg-${color.split(" ")[0]} p-2 rounded-lg`}>
                    <Icon className={color.split(" ")[1]} size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-xs text-slate-600">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BUSCADOR + FILTROS */}
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre, código, tipo, equipo..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-500 shrink-0" />
                  <select
                    value={fTipo}
                    onChange={(e) => setFTipo(e.target.value)}
                    className="py-2.5 px-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition bg-white text-sm"
                  >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="PREVENTIVO">PREVENTIVO</option>
                    <option value="CORRECTIVO">CORRECTIVO</option>
                    <option value="MEJORA">MEJORA</option>
                    <option value="INSPECCION">INSPECCION</option>
                  </select>
                </div>
                <select
                  value={fEstado}
                  onChange={(e) => setFEstado(e.target.value)}
                  className="py-2.5 px-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition bg-white text-sm"
                >
                  <option value="TODOS">Todos</option>
                  <option value="ACTIVOS">Activos</option>
                  <option value="INACTIVOS">Inactivos</option>
                </select>
                <button
                  onClick={() => { setQ(""); setFTipo("TODOS"); setFEstado("TODOS"); }}
                  className="py-2.5 px-4 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition font-semibold text-slate-700 text-sm"
                >
                  Limpiar
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Mostrando <b>{planesFiltrados.length}</b> de <b>{planes.length}</b> planes
            </p>
          </div>

          {/* TABS */}
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setVista("SIMPLE")}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition text-sm ${
                  vista === "SIMPLE"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Vista simple
                <span className="text-xs opacity-80 px-2 py-0.5 rounded-full bg-white/20">Tabla</span>
              </button>
              <button
                onClick={() => setVista("EXCEL")}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition text-sm ${
                  vista === "EXCEL"
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Vista Excel
                <span className="text-xs opacity-80 px-2 py-0.5 rounded-full bg-white/20">Detallada</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 px-2">
              {vista === "SIMPLE"
                ? "Vista rápida para ver planes y entrar al detalle."
                : "Vista estilo Excel: expandible por actividades e items + exportación."}
            </p>
          </div>

          {/* CONTENIDO */}
          {vista === "SIMPLE" ? (
            <VistaPlanesSimple
              planes={planesFiltrados}
              getTipoBadge={getTipoBadge}
              getEquiposLabel={getEquiposLabel}
              onVerPlan={(plan) => setPlanSeleccionado(plan)}
              onCrearPlan={() => setMostrarModalCrear(true)}
              onEditarPlan={(plan) => setPlanAEditar(plan)}
            />
          ) : (
            <PlanesMantenimientoExcel
              planes={planesFiltrados}
              onVer={(plan) => setPlanSeleccionado(plan)}
              onEditar={(plan) => setPlanAEditar(plan)}
            />
          )}
        </div>
      </div>

      {/* MODAL DETALLE GRANDE */}
      {planSeleccionado && (
        <ModalDetallePlan
          plan={planSeleccionado}
          onClose={() => setPlanSeleccionado(null)}
        />
      )}

      {/* MODAL CREAR */}
      {mostrarModalCrear && (
        <ModalCrearPlan
          onClose={() => setMostrarModalCrear(false)}
          onCreated={cargarPlanes}
        />
      )}

      {/* MODAL EDITAR */}
      {planAEditar && (
        <ModalCrearPlan
          initialPlan={planAEditar}
          onClose={() => setPlanAEditar(null)}
          onCreated={() => { cargarPlanes(); setPlanAEditar(null); }}
        />
      )}
    </div>
  );
}