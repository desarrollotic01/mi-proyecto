import { useState, useEffect } from "react";
import {
  X, Zap, ShoppingCart, Boxes, Mail, AlertCircle,
  Loader2, Plus, Trash2, UserPlus, Check, XCircle,
} from "lucide-react";
import {
  getPersonalCorreo,
  createPersonalCorreo,
  deletePersonalCorreo,
} from "../services/personalCorreoService";

export default function ModalLiberarOT({ isOpen, onClose, onConfirm, verificacion, liberando }) {
  const [destinatarioId, setDestinatarioId]   = useState("");
  const [lista, setLista]                     = useState([]);
  const [loadingLista, setLoadingLista]       = useState(false);

  // CC emails
  const [ccInput, setCcInput]                 = useState("");
  const [ccEmails, setCcEmails]               = useState([]);

  // Form nuevo destinatario
  const [mostrarForm, setMostrarForm]         = useState(false);
  const [nuevoNombre, setNuevoNombre]         = useState("");
  const [nuevoCorreo, setNuevoCorreo]         = useState("");
  const [creando, setCreando]                 = useState(false);
  const [eliminandoId, setEliminandoId]       = useState(null);

  /* ── Cargar lista al abrir ── */
  useEffect(() => {
    if (!isOpen) return;
    setDestinatarioId("");
    setCcEmails([]);
    setCcInput("");
    setMostrarForm(false);
    setNuevoNombre("");
    setNuevoCorreo("");
    cargarLista();
  }, [isOpen]);

  const handleAddCc = () => {
    const email = ccInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (ccEmails.includes(email)) { setCcInput(""); return; }
    setCcEmails((prev) => [...prev, email]);
    setCcInput("");
  };

  const handleRemoveCc = (email) =>
    setCcEmails((prev) => prev.filter((e) => e !== email));

  const cargarLista = async () => {
    try {
      setLoadingLista(true);
      const data = await getPersonalCorreo();
      setLista(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setLista([]);
    } finally {
      setLoadingLista(false);
    }
  };

  const handleCrear = async () => {
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) return;
    try {
      setCreando(true);
      const nuevo = await createPersonalCorreo({ nombre: nuevoNombre.trim(), correo: nuevoCorreo.trim() });
      const creado = nuevo?.data || nuevo;
      setLista((prev) => [...prev, creado]);
      setDestinatarioId(creado.id);
      setNuevoNombre("");
      setNuevoCorreo("");
      setMostrarForm(false);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Error al crear contacto");
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (id, e) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este destinatario?")) return;
    try {
      setEliminandoId(id);
      await deletePersonalCorreo(id);
      setLista((prev) => prev.filter((d) => d.id !== id));
      if (destinatarioId === id) setDestinatarioId("");
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Error al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  if (!isOpen || !verificacion) return null;

  const { hayCompra, hayAlmacen, totalLineasCompra, totalLineasAlmacen } = verificacion;
  const puedeLiberar = !hayAlmacen || !!destinatarioId;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-violet-600 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Liberar Orden de Trabajo</h3>
          </div>
          <button onClick={onClose} disabled={liberando} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-slate-600">
            Al liberar la OT se procesarán automáticamente las solicitudes pendientes:
          </p>

          {/* Compra */}
          <div className={`rounded-xl border p-4 ${hayCompra ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-3">
              <ShoppingCart className={`w-5 h-5 ${hayCompra ? "text-blue-600" : "text-slate-400"}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${hayCompra ? "text-blue-800" : "text-slate-500"}`}>
                  Solicitud de Compra
                </p>
                {hayCompra ? (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {totalLineasCompra} ítem{totalLineasCompra !== 1 ? "s" : ""} → Se consolidará y enviará a SAP
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">Sin solicitudes de compra</p>
                )}
              </div>
              {hayCompra && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold">→ SAP</span>
              )}
            </div>
          </div>

          {/* Almacén */}
          <div className={`rounded-xl border p-4 ${hayAlmacen ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-3">
              <Boxes className={`w-5 h-5 ${hayAlmacen ? "text-teal-600" : "text-slate-400"}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${hayAlmacen ? "text-teal-800" : "text-slate-500"}`}>
                  Solicitud de Almacén
                </p>
                {hayAlmacen ? (
                  <p className="text-xs text-teal-600 mt-0.5">
                    {totalLineasAlmacen} ítem{totalLineasAlmacen !== 1 ? "s" : ""} → Se enviará por correo
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">Sin solicitudes de almacén</p>
                )}
              </div>
              {hayAlmacen && (
                <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-lg font-semibold flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Correo
                </span>
              )}
            </div>

            {/* Selector de destinatario */}
            {hayAlmacen && (
              <div className="mt-3 pt-3 border-t border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-teal-800">
                    Destinatario del correo *
                  </label>
                  <button
                    onClick={() => setMostrarForm((v) => !v)}
                    disabled={liberando}
                    className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Nuevo
                  </button>
                </div>

                {/* Form nuevo destinatario */}
                {mostrarForm && (
                  <div className="bg-white border border-teal-200 rounded-xl p-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={nuevoCorreo}
                      onChange={(e) => setNuevoCorreo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCrear}
                        disabled={creando || !nuevoNombre.trim() || !nuevoCorreo.trim()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                      >
                        {creando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Guardar
                      </button>
                      <button
                        onClick={() => setMostrarForm(false)}
                        className="px-3 py-2 border border-slate-200 text-xs text-slate-600 rounded-lg hover:bg-slate-50 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de destinatarios */}
                {loadingLista ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                  </div>
                ) : lista.length === 0 ? (
                  <p className="text-xs text-slate-400">No hay destinatarios. Crea uno arriba.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {lista.map((d) => {
                      const seleccionado = destinatarioId === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => !liberando && setDestinatarioId(d.id)}
                          className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition ${
                            seleccionado
                              ? "border-teal-400 bg-teal-100"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {seleccionado && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{d.nombre}</p>
                              <p className="text-xs text-slate-500 truncate">{d.correo}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleEliminar(d.id, e)}
                            disabled={eliminandoId === d.id || liberando}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 disabled:opacity-40"
                          >
                            {eliminandoId === d.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!destinatarioId && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Selecciona un destinatario para continuar
                  </p>
                )}

                {/* ── CC ── */}
                {destinatarioId && (
                  <div className="pt-3 border-t border-teal-200 space-y-2">
                    <label className="text-xs font-semibold text-teal-800 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Copia (CC) — opcional
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCc(); } }}
                        disabled={liberando}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleAddCc}
                        disabled={liberando || !ccInput.trim()}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {ccEmails.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ccEmails.map((email) => (
                          <span
                            key={email}
                            className="flex items-center gap-1 px-2 py-1 bg-teal-100 border border-teal-200 text-teal-700 rounded-full text-xs font-medium"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveCc(email)}
                              disabled={liberando}
                              className="hover:text-red-500 transition disabled:opacity-40"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Una vez liberada, la OT cambiará a estado <strong>LIBERADO</strong> y no podrá revertirse.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            disabled={liberando}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition text-slate-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(destinatarioId || null, ccEmails)}
            disabled={liberando || !puedeLiberar}
            className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {liberando ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Liberando...</>
            ) : (
              <><Zap className="w-4 h-4" />Confirmar Liberación</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
