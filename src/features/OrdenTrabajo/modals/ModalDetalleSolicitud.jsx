import { X, ShoppingCart, Boxes, CheckCheck, Package } from "lucide-react";

const ESTADO_COLOR = {
  DRAFT:     "bg-amber-50 border-amber-300 text-amber-700",
  PENDIENTE: "bg-sky-50 border-sky-200 text-sky-700",
  SENT:      "bg-emerald-50 border-emerald-300 text-emerald-700",
  ENVIADO:   "bg-emerald-50 border-emerald-300 text-emerald-700",
  APROBADO:  "bg-emerald-100 border-emerald-400 text-emerald-800",
  RECHAZADO: "bg-red-50 border-red-200 text-red-700",
  ERROR:     "bg-red-50 border-red-300 text-red-700",
  GENERADA:  "bg-blue-50 border-blue-200 text-blue-700",
};

const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : v);

export default function ModalDetalleSolicitud({ isOpen, onClose, solicitud, tipo }) {
  if (!isOpen || !solicitud) return null;

  const lineas      = Array.isArray(solicitud.lineas) ? solicitud.lineas : [];
  const estadoKey   = solicitud.estado?.toUpperCase();
  const estadoCls   = ESTADO_COLOR[estadoKey] || "bg-slate-50 border-slate-200 text-slate-700";
  const enviada     = estadoKey === "SENT" || estadoKey === "ENVIADO" || estadoKey === "APROBADO";
  const esCompra    = tipo === "compra";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 rounded-t-2xl shrink-0 ${esCompra ? "bg-blue-700" : "bg-teal-700"}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {esCompra
                ? <ShoppingCart className="w-5 h-5 text-white" />
                : <Boxes className="w-5 h-5 text-white" />
              }
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {esCompra ? "Solicitud de Compra" : "Solicitud de Almacén"}
              </h3>
              <p className="text-xs text-white/70">
                {solicitud.numeroSolicitud || `ID: ${solicitud.id?.slice(0, 8)}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Badges de estado */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${estadoCls}`}>
              {enviada && <CheckCheck className="w-3.5 h-3.5" />}
              {solicitud.estado || "—"}
            </span>
            {solicitud.esConsolidada && (
              <span className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-violet-50 border-violet-200 text-violet-700">
                Consolidada
              </span>
            )}
            {solicitud.esGeneral && (
              <span className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-100 border-slate-200 text-slate-600">
                General
              </span>
            )}
            {solicitud.esCopia && (
              <span className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-orange-50 border-orange-200 text-orange-600">
                Copia
              </span>
            )}
          </div>

          {/* Datos principales */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">N° Solicitud</p>
              <p className="font-semibold text-slate-900">{fmt(solicitud.numeroSolicitud)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Fecha Documento</p>
              <p>{solicitud.docDate ? new Date(solicitud.docDate).toLocaleDateString("es-PE") : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Fecha Requerida</p>
              <p>{solicitud.requiredDate ? new Date(solicitud.requiredDate).toLocaleDateString("es-PE") : "—"}</p>
            </div>
            {esCompra && (
              <>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Doc SAP</p>
                  <p className="font-semibold text-emerald-700">{fmt(solicitud.sapDocNum)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Departamento</p>
                  <p>{fmt(solicitud.department)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Solicitante</p>
                  <p>{fmt(solicitud.requester)}</p>
                </div>
              </>
            )}
            {!esCompra && solicitud.destinatario && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Destinatario correo</p>
                <p className="font-semibold text-teal-700">
                  {solicitud.destinatario?.nombre} · {solicitud.destinatario?.correo}
                </p>
              </div>
            )}
            {solicitud.comments && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Comentarios</p>
                <p>{solicitud.comments}</p>
              </div>
            )}
          </div>

          {/* Líneas */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              Líneas ({lineas.length})
            </h4>
            {lineas.length === 0 ? (
              <p className="text-sm text-slate-400 border border-slate-200 rounded-xl bg-slate-50 p-4 text-center">
                Sin líneas registradas.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className={`text-white text-left ${esCompra ? "bg-blue-700" : "bg-teal-700"}`}>
                      <th className="px-3 py-2.5 font-semibold">#</th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Código</th>
                      <th className="px-3 py-2.5 font-semibold min-w-[180px]">Descripción</th>
                      <th className="px-3 py-2.5 font-semibold text-center">Cant.</th>
                      <th className="px-3 py-2.5 font-semibold">Almacén</th>
                      <th className="px-3 py-2.5 font-semibold">C. Costo</th>
                      <th className="px-3 py-2.5 font-semibold">Proyecto</th>
                      <th className="px-3 py-2.5 font-semibold">Rubro</th>
                      <th className="px-3 py-2.5 font-semibold">Paquete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, i) => (
                      <tr key={l.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 border-b border-slate-100 text-slate-400 font-medium">{i + 1}</td>
                        <td className="px-3 py-2 border-b border-slate-100 font-semibold text-slate-900 whitespace-nowrap">{l.itemCode || "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100">{l.description || "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100 text-center font-semibold">{l.quantity ?? "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100 whitespace-nowrap">{l.warehouseCode || "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100 whitespace-nowrap">{l.costingCode || "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100 whitespace-nowrap">{l.projectCode || "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100 whitespace-nowrap">{l.rubroId || "—"}</td>
                        <td className="px-3 py-2 border-b border-slate-100 whitespace-nowrap">{l.paqueteTrabajoId || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100">
                      <td colSpan={3} className="px-3 py-2 text-xs font-bold text-slate-700">Total ítems: {lineas.length}</td>
                      <td className="px-3 py-2 text-center text-xs font-bold text-slate-700">
                        {lineas.reduce((s, l) => s + (Number(l.quantity) || 0), 0)}
                      </td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition text-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
