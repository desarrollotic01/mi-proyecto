import React, { useEffect, useMemo, useState } from "react";
import { X, FileText, Loader2, CheckCircle2, Package, MapPinned, Table2 } from "lucide-react";
import AdjuntosViewer from "../../adjuntos/components/AdjuntosViewer";
import {
  getNotificacionesByOT,
  abrirPdfNotificacion,
  abrirPdfCombinadoOT,
} from "../services/notificacionService";
import ModalResumenOT from "./ModalResumenOT";

const getRegistroLabel = (n) => {
  const eqOT = n?.equipoOT;

  if (eqOT?.equipoId) {
    return (
      eqOT?.numeroEquipo ||
      eqOT?.equipo?.codigo ||
      eqOT?.equipo?.nombre ||
      eqOT?.descripcionEquipo ||
      `Equipo ${eqOT?.id || ""}`
    );
  }

  if (eqOT?.ubicacionTecnicaId) {
    return (
      eqOT?.ubicacionTecnica?.codigo ||
      eqOT?.ubicacionTecnica?.nombre ||
      eqOT?.descripcionUbicacion ||
      `Ubicación técnica ${eqOT?.id || ""}`
    );
  }

  return `Registro ${eqOT?.id || ""}`;
};

const getRegistroSub = (n) => {
  const eqOT = n?.equipoOT;

  if (eqOT?.equipoId) {
    if (eqOT?.equipo?.nombre) {
      return `${eqOT.equipo.nombre}${
        eqOT.equipo.codigo ? ` • ${eqOT.equipo.codigo}` : ""
      }`;
    }
    return eqOT?.descripcionEquipo || "";
  }

  if (eqOT?.ubicacionTecnicaId) {
    if (eqOT?.ubicacionTecnica?.nombre) {
      return `${eqOT.ubicacionTecnica.nombre}${
        eqOT.ubicacionTecnica.codigo ? ` • ${eqOT.ubicacionTecnica.codigo}` : ""
      }`;
    }
    return eqOT?.descripcionUbicacion || "";
  }

  return "";
};

const getRegistroIcon = (n) => {
  const eqOT = n?.equipoOT;
  return eqOT?.ubicacionTecnicaId ? MapPinned : Package;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-PE");
  } catch {
    return value;
  }
};

export default function ModalInformesNotificacion({
  isOpen,
  onClose,
  ordenTrabajoId,
  numeroOT,
}) {
  const [loading, setLoading] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showResumen, setShowResumen] = useState(false);

  useEffect(() => {
    if (!isOpen || !ordenTrabajoId) return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getNotificacionesByOT(ordenTrabajoId);
        if (!active) return;
        setNotificaciones(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando notificaciones de la OT:", error);
        if (active) setNotificaciones([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [isOpen, ordenTrabajoId]);

  const resumen = useMemo(() => {
    return {
      total: notificaciones.length,
      finalizadas: notificaciones.filter((n) => n.estado === "FINALIZADO").length,
      borrador: notificaciones.filter((n) => n.estado === "BORRADOR").length,
    };
  }, [notificaciones]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Informes de la Notificación
            </h3>
            <p className="text-sm text-slate-200 mt-1">
              OT: <span className="font-bold">{numeroOT || ordenTrabajoId}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10">
                Total: {resumen.total}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/20">
                Finalizadas: {resumen.finalizadas}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/20">
                Borrador: {resumen.borrador}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="font-semibold">Cargando notificaciones...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No hay notificaciones registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {notificaciones.map((n, idx) => {
                const Icon = getRegistroIcon(n);
                const label = getRegistroLabel(n);
                const sub = getRegistroSub(n);

                return (
                  <div
                    key={n.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-900 shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {idx + 1}. {label}
                          </p>

                          {sub ? (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {sub}
                            </p>
                          ) : null}

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              ID: {n.id}
                            </span>

                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border ${
                                n.estado === "FINALIZADO"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {n.estado || "BORRADOR"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirPdfNotificacion(n.id)}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                          Fecha inicio
                        </p>
                        <p className="text-sm text-slate-800">
                          {formatDateTime(n.fechaInicio)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                          Fecha fin
                        </p>
                        <p className="text-sm text-slate-800">
                          {formatDateTime(n.fechaFin)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                          Estado general
                        </p>
                        <p className="text-sm text-slate-800">
                          {n.estadoGeneralEquipo || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                          Técnicos
                        </p>
                        <p className="text-sm text-slate-800">
                          {Array.isArray(n.tecnicos) ? n.tecnicos.length : 0}
                        </p>
                      </div>
                    </div>

                    {n.descripcionGeneral && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] font-bold uppercase text-slate-500 mb-1">
                          Descripción general
                        </p>
                        <p className="text-sm text-slate-700 line-clamp-3">
                          {n.descripcionGeneral}
                        </p>
                      </div>
                    )}

                    {/* Adjuntos de la notificación */}
                    {Array.isArray(n.adjuntos) && n.adjuntos.length > 0 && (
                      <div className="mt-3">
                        <AdjuntosViewer
                          adjuntos={n.adjuntos}
                          titulo="Documentos adjuntos"
                          compact
                        />
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Informe disponible para abrir
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => abrirPdfCombinadoOT(ordenTrabajoId)}
            disabled={notificaciones.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            PDF Completo
          </button>

          <button
            type="button"
            onClick={() => setShowResumen(true)}
            disabled={notificaciones.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-800 text-white font-bold text-sm hover:bg-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Table2 className="w-4 h-4" />
            Tabla repuestos para cambio
          </button>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ModalResumenOT
        isOpen={showResumen}
        onClose={() => setShowResumen(false)}
        ordenTrabajoId={ordenTrabajoId}
        numeroOT={numeroOT}
      />
    </div>
  );
}