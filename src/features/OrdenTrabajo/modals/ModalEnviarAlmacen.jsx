import { useEffect, useState } from "react";
import {
  X,
  Mail,
  Send,
  CheckCheck,
  Loader2,
  Inbox,
  Plus,
  XCircle,
  UserCheck,
} from "lucide-react";
import { enviarBloqueAlmacen } from "../services/solicitudAlmacenService";
import { getPersonalCorreo } from "../services/personalCorreoService";

/* ─────────────────────────────────────────
   Agrupar solicitudes por bloque_id
───────────────────────────────────────── */
function agruparPorBloque(solicitudes) {
  const map = {};
  for (const sol of solicitudes) {
    const key = sol.bloque_id || "sin-bloque";
    if (!map[key]) map[key] = [];
    map[key].push(sol);
  }
  return map;
}

const esDraft = (sol) => {
  const e = sol?.estado?.toUpperCase();
  return e === "DRAFT" || e === "PENDIENTE";
};

/* ─────────────────────────────────────────
   Estado inicial por bloque
───────────────────────────────────────── */
function initBloqueConfig(primera, personal) {
  // Si ya tiene destinatario asignado, preseleccionarlo
  const destId = primera?.destinatario_id || primera?.destinatario?.id || "";
  const cc = Array.isArray(primera?.ccEmails) ? primera.ccEmails.filter(Boolean) : [];
  return { destinatarioId: destId, ccEmails: cc, ccInput: "" };
}

/* ─────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────── */
export default function ModalEnviarAlmacen({
  isOpen,
  onClose,
  solicitudesAlmacen = [],
  ordenTrabajoId,
  onEnviado,
}) {
  const [personal, setPersonal]     = useState([]);
  const [configs, setConfigs]       = useState({});   // { [bloqueId]: { destinatarioId, ccEmails, ccInput } }
  const [enviando, setEnviando]     = useState({});
  const [resultados, setResultados] = useState({});

  /* Cargar PersonalCorreo */
  useEffect(() => {
    if (!isOpen) return;
    getPersonalCorreo()
      .then((data) => {
        const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setPersonal(lista);
      })
      .catch(() => setPersonal([]));
  }, [isOpen]);

  /* Inicializar configs por bloque */
  useEffect(() => {
    if (!isOpen) return;
    const drafts = solicitudesAlmacen.filter(esDraft);
    const bloques = agruparPorBloque(drafts);
    const next = {};
    for (const [id, grupo] of Object.entries(bloques)) {
      next[id] = initBloqueConfig(grupo[0], personal);
    }
    setConfigs(next);
    setResultados({});
    setEnviando({});
  }, [isOpen, solicitudesAlmacen]);

  if (!isOpen) return null;

  const drafts  = solicitudesAlmacen.filter(esDraft);
  const enviadas = solicitudesAlmacen.filter((s) => !esDraft(s));
  const bloques  = agruparPorBloque(drafts);
  const bloqueIds = Object.keys(bloques);

  /* helpers por bloque */
  const getConfig = (bid) =>
    configs[bid] || { destinatarioId: "", ccEmails: [], ccInput: "" };

  const setConfig = (bid, patch) =>
    setConfigs((prev) => ({ ...prev, [bid]: { ...getConfig(bid), ...patch } }));

  const handleAddCc = (bid) => {
    const cfg = getConfig(bid);
    const email = cfg.ccInput.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (cfg.ccEmails.includes(email)) { setConfig(bid, { ccInput: "" }); return; }
    setConfig(bid, { ccEmails: [...cfg.ccEmails, email], ccInput: "" });
  };

  const handleRemoveCc = (bid, email) => {
    const cfg = getConfig(bid);
    setConfig(bid, { ccEmails: cfg.ccEmails.filter((e) => e !== email) });
  };

  const handleEnviar = async (bloqueId) => {
    const cfg = getConfig(bloqueId);
    if (!cfg.destinatarioId) {
      alert("Selecciona un destinatario principal (TO)");
      return;
    }
    try {
      setEnviando((prev) => ({ ...prev, [bloqueId]: true }));
      const res = await enviarBloqueAlmacen({
        bloqueId,
        ordenTrabajoId,
        destinatarioId: cfg.destinatarioId,
        ccEmails: cfg.ccEmails,
      });
      setResultados((prev) => ({ ...prev, [bloqueId]: { success: true, data: res } }));
      onEnviado?.();
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Error al enviar";
      setResultados((prev) => ({ ...prev, [bloqueId]: { success: false, error: msg } }));
    } finally {
      setEnviando((prev) => ({ ...prev, [bloqueId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-5 py-4 border-b bg-teal-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Enviar Solicitudes de Almacén
              </h3>
              <p className="text-xs text-slate-500">
                {bloqueIds.length} bloque{bloqueIds.length !== 1 ? "s" : ""} pendiente{bloqueIds.length !== 1 ? "s" : ""}
                {enviadas.length > 0 && ` · ${enviadas.length} ya enviada${enviadas.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-teal-100 transition">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {bloqueIds.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay solicitudes pendientes de envío</p>
              {enviadas.length > 0 && (
                <p className="text-xs text-emerald-600 mt-1">Todas ya fueron enviadas</p>
              )}
            </div>
          )}

          {bloqueIds.map((bloqueId, idx) => {
            const grupo    = bloques[bloqueId];
            const cfg      = getConfig(bloqueId);
            const resultado = resultados[bloqueId];
            const isEnviando = enviando[bloqueId];
            const yaEnviado  = resultado?.success;

            return (
              <div
                key={bloqueId}
                className={`rounded-xl border p-4 space-y-3 transition-colors ${
                  yaEnviado ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Bloque {idx + 1} · {grupo.length} solicitud{grupo.length !== 1 ? "es" : ""}
                  </p>
                  {yaEnviado ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCheck className="w-3.5 h-3.5" /> Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEnviar(bloqueId)}
                      disabled={isEnviando || !cfg.destinatarioId}
                      title={!cfg.destinatarioId ? "Selecciona un destinatario primero" : ""}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
                    >
                      {isEnviando
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                        : <><Send className="w-3.5 h-3.5" /> Enviar</>
                      }
                    </button>
                  )}
                </div>

                {!yaEnviado && (
                  <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {/* Destinatario TO */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Destinatario (TO) *
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                        value={cfg.destinatarioId}
                        onChange={(e) => setConfig(bloqueId, { destinatarioId: e.target.value })}
                      >
                        <option value="">Seleccione destinatario…</option>
                        {personal.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} — {p.correo}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CC */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Copia (CC)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="correo@empresa.com"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                          value={cfg.ccInput}
                          onChange={(e) => setConfig(bloqueId, { ccInput: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCc(bloqueId); } }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCc(bloqueId)}
                          disabled={!cfg.ccInput.trim()}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm transition disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {cfg.ccEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {cfg.ccEmails.map((email) => (
                            <span
                              key={email}
                              className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-medium"
                            >
                              {email}
                              <button
                                type="button"
                                onClick={() => handleRemoveCc(bloqueId, email)}
                                className="hover:text-red-500 transition"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {resultado?.error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Error: {resultado.error}
                  </p>
                )}

                {/* Solicitudes del bloque */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grupo.map((sol) => (
                    <div
                      key={sol.id}
                      className="text-xs border border-slate-100 rounded-lg bg-slate-50/80 p-2.5 space-y-0.5"
                    >
                      <p className="font-semibold text-slate-800">
                        {sol.numeroSolicitud || `SA-${sol.id?.slice(0, 8)}`}
                      </p>
                      <p className="text-slate-500">
                        {sol.esGeneral ? "General" : "Específica"} ·{" "}
                        {sol.lineas?.length || 0} ítem{sol.lineas?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Solicitudes ya enviadas */}
          {enviadas.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 select-none">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                {enviadas.length} solicitud{enviadas.length !== 1 ? "es" : ""} ya enviada{enviadas.length !== 1 ? "s" : ""}
              </summary>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enviadas.map((sol) => (
                  <div
                    key={sol.id}
                    className="text-xs border border-emerald-100 rounded-lg bg-emerald-50 px-2.5 py-2 space-y-0.5"
                  >
                    <p className="font-semibold text-emerald-800">
                      {sol.numeroSolicitud || sol.id?.slice(0, 8)}
                    </p>
                    <p className="text-emerald-600">
                      {sol.estado} · {sol.lineas?.length || 0} ítems
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-white flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
