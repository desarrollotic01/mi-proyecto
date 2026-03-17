import { Package, X, MapPin, Globe, Truck, FileText } from "lucide-react";




//Modal de info Equipos
export default function EquipoDetailModal({ isOpen, onClose, equipo }) {
  if (!isOpen || !equipo) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">{equipo?.codigo || "S/C"}</h3>
              <p className="text-sm font-bold text-slate-500">{equipo?.nombre || "Sin nombre"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={24} strokeWidth={2.5} /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600"><MapPin size={20} /><h4 className="font-black text-slate-700">Cliente y Ubicación</h4></div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Cliente</p>
                <p className="font-black text-slate-800">{equipo?.cliente?.razonSocial || "Sin Cliente"}</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] font-bold text-slate-500 uppercase">Sede</p><p className="text-sm font-bold text-slate-800">{equipo?.sede || "-"}</p></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] font-bold text-slate-500 uppercase">Almacén</p><p className="text-sm font-bold text-slate-800">{equipo?.almacen || "-"}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-amber-600"><Globe size={20} /><h4 className="font-black text-slate-700">Propiedad</h4></div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Propiedad</p>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-black bg-slate-100 text-slate-700 border border-slate-200">{equipo?.tipoEquipoPropiedad || "-"}</span>
                </div>
                <div><p className="text-xs font-bold text-slate-500 uppercase mb-1">País</p><p className="font-bold text-slate-800">{equipo?.pais?.nombre || "-"}</p></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-orange-600"><Truck size={20} /><h4 className="font-black text-slate-700">Estado Logístico</h4></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status</p>
                    <span className="inline-block px-3 py-1 rounded-lg text-sm font-black bg-orange-100 text-orange-700">{equipo?.status || "-"}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Operatividad</p>
                    <span className="inline-block px-3 py-1 rounded-lg text-sm font-black bg-emerald-100 text-emerald-700">{equipo?.estado || "-"}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ID Placa (Matrícula)</p>
                  <p className="font-mono font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg inline-block border border-slate-200">{equipo?.idPlaca || "SIN PLACA"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-purple-600"><FileText size={20} /><h4 className="font-black text-slate-700">Orden de Venta</h4></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold text-slate-500 uppercase">N° OV</p><p className="font-black text-slate-800">{equipo?.numeroOV || "-"}</p></div>
                <div><p className="text-xs font-bold text-slate-500 uppercase">Fecha OV</p><p className="font-bold text-slate-700">{formatDate(equipo?.fechaOV)}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors">
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}