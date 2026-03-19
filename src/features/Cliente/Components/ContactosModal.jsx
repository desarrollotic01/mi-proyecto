import { X, Users, User, Mail, Phone } from "lucide-react";

export default function ContactosModal({ isOpen, onClose, cliente }) {
  if (!isOpen || !cliente) return null;

  const contactos = Array.isArray(cliente.contactos) ? cliente.contactos : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        
        {/* Header Responsive */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="pr-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hidden sm:block">
                <Users size={20} />
              </div>
              Directorio de Contactos
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
              Empresa: <b className="text-gray-700">{cliente?.razonSocial || "Sin Razón Social"}</b>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body (Lista de Contactos) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {contactos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">No hay contactos registrados</p>
              <p className="text-xs text-gray-400 mt-1">Este cliente aún no tiene un directorio asignado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contactos.map((contacto, index) => (
                <div
                  key={contacto.id || index}
                  className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 flex-wrap">
                    
                    {/* Info principal del contacto */}
                    <div className="flex-1 min-w-[200px]">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="break-words">{contacto.nombre || "Sin nombre registrado"}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium ml-6">
                        {contacto.cargo || "Cargo no especificado"}
                      </p>
                    </div>

                    {/* Badge de estado (se mueve arriba a la derecha en PC, abajo del título en móvil) */}
                    <span
                      className={`self-start inline-flex px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black tracking-wider uppercase border ${
                        contacto.activo !== false // Asumimos true por defecto a menos que sea explícitamente false
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {contacto.activo !== false ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Datos de contacto con soporte para múltiples teléfonos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-50 ml-0 sm:ml-6">
                    
                    <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="break-all font-medium">{contacto.correo || "Sin correo"}</span>
                    </div>

                    <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      
                      <div className="flex flex-col space-y-1">
                        {contacto.telefono ? (
                          contacto.telefono.split(',').map((num, i) => {
                            const numLimpio = num.trim();
                            if (!numLimpio) return null;
                            return (
                              <span key={i} className="font-medium break-all">
                                {numLimpio} {i === 0 && contacto.telefono.includes(',') && <span className="text-[10px] font-normal text-gray-400 ml-1">(Principal)</span>}
                              </span>
                            );
                          })
                        ) : (
                          <span className="italic text-gray-400">Sin teléfono</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}