import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  Wrench,
  Layers,
  Briefcase,
  Search,
} from "lucide-react";
import { guiaMantenimientoService } from "../features/GuiaMantenimiento/services/guiaMantenimientoService";

const STATUS_ORDER = [
  "CREADO",
  "TRATADO",
  "CON_OT",
  "FINALIZADO",
  "FINALIZADO_SIN_FACTURACION",
  "RECHAZADO",
];

const HEADER_STYLES = {
  CREADO: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
  TRATADO: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
  CON_OT: "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
  FINALIZADO: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
  FINALIZADO_SIN_FACTURACION: "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
  RECHAZADO: "bg-gradient-to-br from-red-600 to-red-700 text-white",
};

export default function GuiasMantenimientoKanban() {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchGuias();
  }, []);

  async function fetchGuias() {
    setLoading(true);
    setError(null);
    try {
      const data = await guiaMantenimientoService.getGuias();
      setGuias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Error cargando guías");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return guias;
    return guias.filter((g) => {
      const prod = String(g.producto || "").toLowerCase();
      const nro = String(g.numeroAviso || g.numero || g.nro || "").toLowerCase();
      return prod.includes(q) || nro.includes(q);
    });
  }, [guias, query]);

  const grouped = useMemo(() => {
    const map = {};
    STATUS_ORDER.forEach((s) => (map[s] = []));
    filtered.forEach((g) => {
      const estado = g.estado || g._estado || "CREADO";
      if (!map[estado]) map[estado] = [];
      map[estado].push(g);
    });
    return map;
  }, [filtered]);

  const handleChangeState = async (guia, direction) => {
    const idx = STATUS_ORDER.indexOf(guia.estado || guia._estado || "CREADO");
    if (idx === -1) return;
    const targetIdx = direction === "next" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= STATUS_ORDER.length) return;
    const nuevoEstado = STATUS_ORDER[targetIdx];

    try {
      // Actualiza en backend
      await guiaMantenimientoService.patchGuia(guia.id || guia._id || guia.guid, { estado: nuevoEstado });
      // Refresca datos
      await fetchGuias();
    } catch (err) {
      console.error(err);
      // No mostramos alertas intrusivas en UI minimalista
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Guías de Mantenimiento</h1>
            <p className="text-sm text-slate-500">Panel Kanban - Light UI</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por producto o número de alerta"
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 shadow-sm w-72"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <div className="text-sm text-slate-500">{loading ? "Cargando..." : `${guias.length} guías`}</div>
          </div>
        </header>

        {error && <div className="text-rose-600 mb-4">{error}</div>}

        <div className="flex gap-3 overflow-x-auto pb-3">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="w-[320px] flex-shrink-0">
              <div className={`px-3 py-2 rounded-t-lg ${HEADER_STYLES[status] || "bg-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm tracking-tight">{status.replaceAll("_", " ")}</span>
                  </div>
                  <div className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded text-white/90">{grouped[status]?.length || 0}</div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-b-lg p-3 space-y-3 min-h-[120px]">
                {(grouped[status] || []).map((guia) => (
                  <div key={guia.id || guia._id || JSON.stringify(guia)} className="bg-white border border-slate-100 rounded-xl shadow-sm p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-slate-800">{guia.producto || guia.descripcion || "Sin producto"}</div>
                          <div className="text-xs text-slate-500">#{guia.numeroAviso || guia.numero || guia.nro || "-"}</div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{guia.producto || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{guia.equipo || guia.equipoNombre || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{guia.plan || guia.planNombre || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{guia.ordenVenta || guia.ov || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">{guia.cliente || guia.contacto || "—"}</div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleChangeState(guia, "prev")}
                          className="px-2 py-1 text-xs rounded border bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handleChangeState(guia, "next")}
                          className="px-2 py-1 text-xs rounded border bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {(!grouped[status] || grouped[status].length === 0) && (
                  <div className="py-6 text-center text-sm text-slate-400">Sin guías</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
