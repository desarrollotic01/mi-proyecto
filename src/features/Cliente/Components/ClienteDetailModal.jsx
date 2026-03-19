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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between p-4 md:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                {cliente?.razonSocial || "S/N"}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">
                Ficha Técnica
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Identificación Fiscal */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Hash size={20} />
                <h4 className="font-black text-slate-700">Identificación Fiscal</h4>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">RUC</p>
                    <p className="text-sm font-black text-slate-800 break-all">{cliente?.ruc || "-"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Código SAP</p>
                    <p className="text-sm font-black text-blue-600 break-all">{cliente?.sapCode || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Cliente</p>
                  <span className="inline-flex px-3 py-1 rounded-lg text-xs sm:text-sm font-black bg-blue-100 text-blue-700 border border-blue-200">
                    {cliente?.tipoCliente || "General"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacto Directo */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <Phone size={20} />
                <h4 className="font-black text-slate-700">Contacto Directo</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <Mail className="text-slate-400 flex-shrink-0" size={18} />
                  <p className="text-xs sm:text-sm font-bold text-slate-700 break-all">
                    {cliente?.correo || "Sin correo registrado"}
                  </p>
                </div>

                {cliente?.telefono && (
                  <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <Phone className="text-emerald-500 flex-shrink-0" size={18} />
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      {cliente.telefono} <span className="text-xs text-slate-400 font-normal ml-1">(Principal)</span>
                    </p>
                  </div>
                )}

                {cliente?.contactos && cliente.contactos.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Otros números</p>
                    {cliente.contactos.map((contacto, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <Phone className="text-slate-400 flex-shrink-0" size={16} />
                        <p className="text-xs sm:text-sm font-bold text-slate-700">
                          {typeof contacto === 'object' 
                            ? <>{contacto.telefono} <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-1">({contacto.nombre || 'Contacto'})</span></> 
                            : contacto
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-orange-600">
                <MapPin size={20} />
                <h4 className="font-black text-slate-700">Ubicación</h4>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Dirección Fiscal</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">{cliente?.direccion || "-"}</p>
                <div className="flex items-center gap-2 pt-2 text-slate-500">
                   <Globe size={14} />
                   <p className="text-[10px] sm:text-xs font-bold uppercase">Sedes registradas: {cliente?.sedes?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Estado del Sistema */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-purple-600">
                <ShieldCheck size={20} />
                <h4 className="font-black text-slate-700">Registro</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border ${
                    cliente.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {cliente.estado}
                  </span>
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Activo en SAP</p>
                    <p className="text-xs sm:text-sm font-black text-slate-700">{cliente.activoSAP ? "SÍ" : "NO"}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                   <div>
                     <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Creado el</p>
                     <p className="text-[10px] sm:text-[11px] font-bold text-slate-600">{formatDate(cliente.createdAt)}</p>
                   </div>
                   <div>
                     <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Últ. Cambio</p>
                     <p className="text-[10px] sm:text-[11px] font-bold text-slate-600">{formatDate(cliente.updatedAt)}</p>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors">
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}