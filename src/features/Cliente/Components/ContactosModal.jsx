import { X, Users, User, Mail, Phone } from "lucide-react";

export default function ContactosModal({ isOpen, onClose, cliente }) {
  if (!isOpen || !cliente) return null;

  const contactos = Array.isArray(cliente.contactos) ? cliente.contactos : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" />
              Contactos del Cliente
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              <b>{cliente?.razonSocial}</b>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {contactos.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              Este cliente no tiene contactos registrados.
            </div>
          ) : (
            <div className="space-y-4">
              {contactos.map((contacto, index) => (
                <div
                  key={contacto.id || index}
                  className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        {contacto.nombre || "Sin nombre"}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {contacto.cargo || "Sin cargo"}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        contacto.activo
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {contacto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{contacto.correo || "-"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{contacto.telefono || "-"}</span>
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