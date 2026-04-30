import { useEffect, useMemo, useRef, useState } from "react";
import { planMantenimientoService } from "../services/planMantenimientoService";
import { parseExcelPlanMantenimiento, exportarPlanExcel, exportarListaPlanes, descargarPlantillaImportacion } from "../utils/planExcelUtils";
import {
  Plus,
  Wrench,
  Calendar,
  Settings2,
  Search,
  Filter,
  BadgeCheck,
  FileSpreadsheet,
  Upload,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

  // Import Excel state
  const importInputRef = useRef(null);
  const [importando, setImportando] = useState(false);
  const [importModal, setImportModal] = useState(null); // { planes, resultados, fase: 'preview'|'done' }

  // Delete state
  const [confirmEliminar, setConfirmEliminar] = useState(null); // plan a eliminar
  const [eliminando, setEliminando] = useState(false);

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

  const handleImportarExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      setImportando(true);
      const planes = await parseExcelPlanMantenimiento(file);
      if (!planes.length) {
        alert("No se encontraron planes válidos en el Excel.");
        return;
      }
      setImportModal({ planes, resultados: [], fase: "preview" });
    } catch (err) {
      console.error(err);
      alert("Error al leer el Excel: " + err.message);
    } finally {
      setImportando(false);
    }
  };

  const handleConfirmarImport = async () => {
    if (!importModal) return;
    const { planes } = importModal;
    const resultados = [];
    setImportModal((prev) => ({ ...prev, fase: "creando" }));

    for (const planData of planes) {
      try {
        const payload = {
          nombre: planData.nombre,
          tipo: planData.tipo,
          frecuencia: planData.frecuencia,
          contextoObjetivo: planData.contextoObjetivo,
          esEspecifico: false,
          tipoEquipo: planData.tipoEquipo || null,
          modeloEquipo: planData.modeloEquipo || null,
          actividades: JSON.stringify(
            planData.actividades.map((a, idx) => ({
              codigoActividad: a.codigoActividad,
              sistema: a.sistema || null,
              subsistema: a.subsistema || null,
              componente: a.componente || null,
              tarea: a.tarea,
              tipoTrabajo: a.tipoTrabajo,
              cantidadTecnicos: a.cantidadTecnicos,
              duracionMinutos: a.duracionMinutos,
              unidadDuracion: a.unidadDuracion,
              orden: idx + 1,
              items: [],
            }))
          ),
        };
        const created = await planMantenimientoService.createPlan(payload);
        resultados.push({ nombre: planData.nombre, ok: true, id: created?.id });
      } catch (err) {
        resultados.push({ nombre: planData.nombre, ok: false, error: err?.response?.data?.error || err.message });
      }
    }

    setImportModal((prev) => ({ ...prev, resultados, fase: "done" }));
    cargarPlanes();
  };

  const handleEliminarPlan = async (plan) => {
    try {
      setEliminando(true);
      await planMantenimientoService.deletePlan(plan.id);
      setConfirmEliminar(null);
      cargarPlanes();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar: " + (err?.response?.data?.error || err.message));
    } finally {
      setEliminando(false);
    }
  };

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
            <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
              {/* Input oculto para importar */}
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportarExcel}
              />
              <button
                onClick={descargarPlantillaImportacion}
                className="bg-white hover:bg-amber-50 border-2 border-amber-400 text-amber-700 px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 font-semibold"
                title="Descarga una plantilla Excel con instrucciones para importar planes"
              >
                <FileSpreadsheet size={18} className="text-amber-500" />
                Plantilla
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                disabled={importando}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all duration-200 font-semibold"
              >
                {importando ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Importar Excel
              </button>
              <button
                onClick={() => exportarListaPlanes(planesFiltrados)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all duration-200 font-semibold"
              >
                <FileSpreadsheet size={18} />
                Exportar lista
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
              onEliminarPlan={(plan) => setConfirmEliminar(plan)}
              onExportarPlan={exportarPlanExcel}
            />
          ) : (
            <PlanesMantenimientoExcel
              planes={planesFiltrados}
              onVer={(plan) => setPlanSeleccionado(plan)}
              onEditar={(plan) => setPlanAEditar(plan)}
              onEliminar={(plan) => setConfirmEliminar(plan)}
              onExportar={exportarPlanExcel}
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

      {/* MODAL IMPORTAR EXCEL */}
      {importModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-800">Importar desde Excel</h2>
                <p className="text-sm text-slate-500">
                  {importModal.fase === "preview"
                    ? `Se crearán ${importModal.planes.length} plan(es)`
                    : importModal.fase === "creando"
                    ? "Creando planes..."
                    : `Importación finalizada`}
                </p>
              </div>
              {importModal.fase !== "creando" && (
                <button
                  onClick={() => setImportModal(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-2">
              {importModal.fase === "preview" &&
                importModal.planes.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <FileSpreadsheet size={16} className="text-violet-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{p.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {p.frecuencia} · {p.actividades.length} actividades
                        {p.tipoEquipo ? ` · ${p.tipoEquipo}` : ""}
                      </p>
                    </div>
                  </div>
                ))}

              {importModal.fase === "creando" && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 size={32} className="animate-spin text-violet-600" />
                  <p className="text-slate-600 font-semibold">Creando planes, por favor espera...</p>
                </div>
              )}

              {importModal.fase === "done" &&
                importModal.resultados.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      r.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    {r.ok
                      ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      : <AlertCircle size={16} className="text-red-600 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${r.ok ? "text-emerald-800" : "text-red-800"} truncate`}>
                        {r.nombre}
                      </p>
                      {!r.ok && <p className="text-xs text-red-600">{r.error}</p>}
                    </div>
                  </div>
                ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              {importModal.fase === "preview" && (
                <>
                  <button
                    onClick={() => setImportModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarImport}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition"
                  >
                    Importar {importModal.planes.length} plan(es)
                  </button>
                </>
              )}
              {importModal.fase === "done" && (
                <button
                  onClick={() => setImportModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmEliminar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-black text-slate-800">Eliminar plan</h2>
                <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm mb-6">
              ¿Estás seguro de que quieres eliminar{" "}
              <span className="font-bold">{confirmEliminar.nombre}</span>?
              Se eliminarán todas sus actividades e ítems.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                disabled={eliminando}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 text-sm transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarPlan(confirmEliminar)}
                disabled={eliminando}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {eliminando && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}