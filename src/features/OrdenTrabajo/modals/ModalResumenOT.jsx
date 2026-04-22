import React, { useEffect, useState, useCallback } from "react";
import {
  X, Plus, Trash2, FileText, Loader2,
  Package, MapPinned, ChevronDown, ChevronUp, Table2,
} from "lucide-react";
import { getNotificacionesByOT, generarPdfResumenOT } from "../services/notificacionService";

const COLUMNAS_DEFAULT = ["Cambio 1", "Cambio 2", "Cambio 3", "Cambio 4", "Cambio 5"];

const getLabel = (n) => {
  const eqOT = n?.equipoOT;
  if (eqOT?.equipoId)
    return eqOT?.equipo?.nombre || eqOT?.equipo?.codigo || eqOT?.descripcionEquipo || `Equipo ${eqOT.id}`;
  if (eqOT?.ubicacionTecnicaId)
    return eqOT?.ubicacionTecnica?.nombre || eqOT?.ubicacionTecnica?.codigo || `Ubicación ${eqOT.id}`;
  return `Registro ${n.id}`;
};

const getSub = (n) => {
  const eqOT = n?.equipoOT;
  if (eqOT?.equipoId && eqOT?.equipo?.codigo) return eqOT.equipo.codigo;
  if (eqOT?.ubicacionTecnicaId && eqOT?.ubicacionTecnica?.codigo) return eqOT.ubicacionTecnica.codigo;
  return "";
};

const getIcon = (n) => (n?.equipoOT?.ubicacionTecnicaId ? MapPinned : Package);

let _cnt = 1;
const newGrupo = () => ({
  id: `g_${_cnt++}`,
  nombre: "",
  columnas: [...COLUMNAS_DEFAULT],
  notificacionIds: [],
  valores: {},       // { [notifId]: ["", "", "", "", ""] }
  collapsed: false,
});

export default function ModalResumenOT({ isOpen, onClose, ordenTrabajoId, numeroOT }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [grupos, setGrupos] = useState([newGrupo()]);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !ordenTrabajoId) return;
    let active = true;
    setLoadingData(true);
    setError(null);
    getNotificacionesByOT(ordenTrabajoId)
      .then((data) => { if (active) setNotificaciones(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setError("Error al cargar notificaciones"); })
      .finally(() => { if (active) setLoadingData(false); });
    return () => { active = false; };
  }, [isOpen, ordenTrabajoId]);

  const addGrupo = useCallback(() => setGrupos((p) => [...p, newGrupo()]), []);
  const removeGrupo = useCallback((id) => setGrupos((p) => p.filter((g) => g.id !== id)), []);
  const toggleCollapse = useCallback((id) =>
    setGrupos((p) => p.map((g) => g.id === id ? { ...g, collapsed: !g.collapsed } : g)), []);
  const updateNombre = useCallback((id, v) =>
    setGrupos((p) => p.map((g) => g.id === id ? { ...g, nombre: v } : g)), []);
  const updateColumna = useCallback((gid, idx, v) =>
    setGrupos((p) => p.map((g) =>
      g.id === gid ? { ...g, columnas: g.columnas.map((c, i) => i === idx ? v : c) } : g
    )), []);

  const toggleEquipo = useCallback((gid, notifId) => {
    setGrupos((p) => p.map((g) => {
      if (g.id !== gid) return g;
      const has = g.notificacionIds.includes(notifId);
      const notificacionIds = has
        ? g.notificacionIds.filter((id) => id !== notifId)
        : [...g.notificacionIds, notifId];
      // Inicializar valores vacíos si es nuevo
      const valores = { ...g.valores };
      if (!has && !valores[notifId]) valores[notifId] = ["", "", "", "", ""];
      return { ...g, notificacionIds, valores };
    }));
  }, []);

  const selectAll = useCallback((gid) => {
    setGrupos((p) => p.map((g) => {
      if (g.id !== gid) return g;
      const notificacionIds = notificaciones.map((n) => n.id);
      const valores = { ...g.valores };
      notificaciones.forEach((n) => { if (!valores[n.id]) valores[n.id] = ["", "", "", "", ""]; });
      return { ...g, notificacionIds, valores };
    }));
  }, [notificaciones]);

  const clearAll = useCallback((gid) =>
    setGrupos((p) => p.map((g) => g.id === gid ? { ...g, notificacionIds: [] } : g)), []);

  const updateValor = useCallback((gid, notifId, colIdx, v) => {
    setGrupos((p) => p.map((g) => {
      if (g.id !== gid) return g;
      const prev = g.valores[notifId] || ["", "", "", "", ""];
      const next = prev.map((c, i) => i === colIdx ? v : c);
      return { ...g, valores: { ...g.valores, [notifId]: next } };
    }));
  }, []);

  const handleGenerar = async () => {
    const gruposValidos = grupos.filter((g) => g.notificacionIds.length > 0);
    if (!gruposValidos.length) { alert("⚠️ Agrega al menos un equipo en alguna tabla"); return; }
    setGenerando(true);
    setError(null);
    try {
      await generarPdfResumenOT(
        ordenTrabajoId,
        gruposValidos.map((g) => ({
          nombre: g.nombre,
          columnas: g.columnas,
          notificacionIds: g.notificacionIds,
          valores: g.valores,
        }))
      );
    } catch (err) {
      setError("Error al generar PDF: " + (err?.response?.data?.message || err.message));
    } finally {
      setGenerando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              <Table2 className="w-6 h-6" />
              Tabla de Repuestos para Cambio
            </h3>
            <p className="text-sm text-blue-200 mt-1">
              OT: <span className="font-bold">{numeroOT || ordenTrabajoId}</span>
            </p>
            <p className="text-xs text-blue-300 mt-1">
              Agrupa equipos, personaliza columnas y escribe los repuestos directamente en cada celda
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
          {loadingData ? (
            <div className="py-12 flex flex-col items-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Cargando equipos...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              <Table2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-semibold">No hay notificaciones en esta OT</p>
            </div>
          ) : (
            grupos.map((grupo, gi) => (
              <GrupoEditor
                key={grupo.id}
                grupo={grupo}
                index={gi}
                notificaciones={notificaciones}
                onToggleCollapse={() => toggleCollapse(grupo.id)}
                onRemove={() => removeGrupo(grupo.id)}
                onUpdateNombre={(v) => updateNombre(grupo.id, v)}
                onUpdateColumna={(idx, v) => updateColumna(grupo.id, idx, v)}
                onToggleEquipo={(nid) => toggleEquipo(grupo.id, nid)}
                onSelectAll={() => selectAll(grupo.id)}
                onClearAll={() => clearAll(grupo.id)}
                onUpdateValor={(nid, ci, v) => updateValor(grupo.id, nid, ci, v)}
                canRemove={grupos.length > 1}
              />
            ))
          )}

          <button
            type="button"
            onClick={addGrupo}
            disabled={loadingData}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-300 text-blue-700 font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar tabla
          </button>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={handleGenerar}
            disabled={generando || loadingData || notificaciones.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-800 text-white font-bold text-sm hover:bg-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {generando ? "Generando PDF..." : "Generar PDF"}
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Grupo editor ───────────────────────────────────────────── */

function GrupoEditor({
  grupo, index, notificaciones,
  onToggleCollapse, onRemove, onUpdateNombre,
  onUpdateColumna, onToggleEquipo, onSelectAll, onClearAll,
  onUpdateValor, canRemove,
}) {
  const selected = grupo.notificacionIds;
  const selectedNotifs = notificaciones.filter((n) => selected.includes(n.id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Grupo header bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="w-7 h-7 rounded-lg bg-blue-800 text-white flex items-center justify-center text-xs font-black shrink-0">
          {index + 1}
        </div>
        <input
          type="text"
          value={grupo.nombre}
          onChange={(e) => onUpdateNombre(e.target.value)}
          placeholder={`Tabla ${index + 1} (nombre opcional)`}
          className="flex-1 text-sm font-semibold bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
        />
        <span className="text-xs text-slate-500 shrink-0">
          {selected.length} equipo{selected.length !== 1 ? "s" : ""}
        </span>
        <button type="button" onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition text-slate-500">
          {grupo.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 transition text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!grupo.collapsed && (
        <div className="p-4 space-y-5">

          {/* 1. Nombres de columnas */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nombres de columnas (repuestos / cambios)
            </p>
            <div className="grid grid-cols-5 gap-2">
              {grupo.columnas.map((col, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={col}
                  onChange={(e) => onUpdateColumna(idx, e.target.value)}
                  placeholder={`Cambio ${idx + 1}`}
                  className="w-full px-2.5 py-2 rounded-lg border border-amber-300 text-[11px] text-center font-bold text-slate-700 bg-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                />
              ))}
            </div>
          </div>

          {/* 2. Selección de equipos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Equipos a incluir
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={onSelectAll}
                  className="text-xs text-blue-700 font-semibold hover:underline">Todos</button>
                <button type="button" onClick={onClearAll}
                  className="text-xs text-slate-500 font-semibold hover:underline">Ninguno</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {notificaciones.map((n) => {
                const Icon = getIcon(n);
                const label = getLabel(n);
                const isSelected = selected.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onToggleEquipo(n.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition ${
                      isSelected
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tabla editable (intersecciones) */}
          {selectedNotifs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Editar repuestos por equipo
                <span className="ml-2 text-amber-600 normal-case font-semibold">
                  — escribe en las celdas amarillas
                </span>
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="px-3 py-2.5 text-left bg-slate-800 text-white font-bold border border-slate-600 whitespace-nowrap">
                        Equipo
                      </th>
                      <th className="px-3 py-2.5 bg-slate-800 text-white font-bold border border-slate-600 whitespace-nowrap">
                        Fecha Mantto
                      </th>
                      {grupo.columnas.map((c, i) => (
                        <th key={i}
                          className="px-3 py-2.5 bg-amber-600 text-white font-bold border border-amber-700 whitespace-nowrap min-w-[100px]">
                          {c || `Cambio ${i + 1}`}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 bg-slate-800 text-white font-bold border border-slate-600 whitespace-nowrap">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotifs.map((n, ri) => {
                      const vals = grupo.valores[n.id] || ["", "", "", "", ""];
                      const estadoClass =
                        n.estadoGeneralEquipo === "OPERATIVO"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : n.estadoGeneralEquipo === "INOPERATIVO"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200";

                      return (
                        <tr key={n.id} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-3 py-2 border border-slate-200 font-bold text-slate-800 whitespace-nowrap">
                            {getLabel(n)}
                            {getSub(n) && <span className="block text-[10px] text-slate-400 font-normal">{getSub(n)}</span>}
                          </td>
                          <td className="px-3 py-2 border border-slate-200 text-center text-slate-500 whitespace-nowrap">
                            {n.fechaInicio ? new Date(n.fechaInicio).toLocaleDateString("es-PE") : "—"}
                          </td>
                          {[0, 1, 2, 3, 4].map((ci) => (
                            <td key={ci} className="border border-amber-200 p-0 bg-amber-50">
                              <input
                                type="text"
                                value={vals[ci] || ""}
                                onChange={(e) => onUpdateValor(n.id, ci, e.target.value)}
                                placeholder="—"
                                className="w-full h-full px-2 py-2 text-xs text-slate-800 bg-transparent focus:outline-none focus:bg-amber-100 placeholder-amber-300 text-center"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 border border-slate-200 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoClass}`}>
                              {n.estadoGeneralEquipo === "OPERATIVO_CON_OBSERVACIONES"
                                ? "OP. C/OBS"
                                : n.estadoGeneralEquipo || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedNotifs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-slate-400 text-sm">
              Selecciona equipos arriba para editar los repuestos
            </div>
          )}
        </div>
      )}
    </div>
  );
}
