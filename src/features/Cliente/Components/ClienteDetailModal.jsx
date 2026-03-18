import { Building2, X, MapPin, Globe, ShieldCheck, Mail, Phone, Hash } from "lucide-react";

export default function ClienteDetailModal({ isOpen, onClose, cliente }) {
  if (!isOpen || !cliente) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building2 size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">{cliente?.razonSocial || "S/N"}</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ficha Técnica del Cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Identificación Fiscal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600"><Hash size={20} /><h4 className="font-black text-slate-700">Identificación Fiscal</h4></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">RUC</p>
                    <p className="text-sm font-black text-slate-800">{cliente?.ruc || "-"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Código SAP</p>
                    <p className="text-sm font-black text-blue-600">{cliente?.sapCode || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Cliente</p>
                  <span className="inline-flex px-3 py-1 rounded-lg text-sm font-black bg-blue-100 text-blue-700 border border-blue-200">
                    {cliente?.tipoCliente || "General"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacto Principal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-emerald-600"><Phone size={20} /><h4 className="font-black text-slate-700">Contacto Directo</h4></div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <Mail className="text-slate-400" size={18} />
                  <p className="text-sm font-bold text-slate-700">{cliente?.correo || "Sin correo registrado"}</p>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <Phone className="text-slate-400" size={18} />
                  <p className="text-sm font-bold text-slate-700">{cliente?.telefono || "Sin teléfono"}</p>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-orange-600"><MapPin size={20} /><h4 className="font-black text-slate-700">Ubicación Sede Central</h4></div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Dirección Fiscal</p>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">{cliente?.direccion || "-"}</p>
                <div className="flex items-center gap-2 pt-2 text-slate-500">
                   <Globe size={14} />
                   <p className="text-xs font-bold uppercase">Sedes registradas: {cliente?.sedes?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Estado del Sistema */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-purple-600"><ShieldCheck size={20} /><h4 className="font-black text-slate-700">Status & Registro</h4></div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border ${
                    cliente.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {cliente.estado}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Activo en SAP</p>
                    <p className="text-xs font-black text-slate-700">{cliente.activoSAP ? "SÍ" : "NO"}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Creado el</p>
                     <p className="text-[11px] font-bold text-slate-600">{formatDate(cliente.createdAt)}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Últ. Cambio</p>
                     <p className="text-[11px] font-bold text-slate-600">{formatDate(cliente.updatedAt)}</p>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors">
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}