import { X, User, Users, Layers } from "lucide-react";

export default function ModalSeleccionTipoOT({
  isOpen,
  onClose,
  onSeleccionar,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Seleccionar tipo de OT
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Elige cómo deseas crear la Orden de Trabajo
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/70 transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">

          {/* OT INDIVIDUAL */}
          <TipoCard
            icon={User}
            title="OT Individual"
            description="Una orden de trabajo para un solo equipo o actividad específica."
            color="blue"
            onClick={() => onSeleccionar("individual")}
          />

          {/* OT MIXTA */}
          <TipoCard
            icon={Layers}
            title="OT Mixta"
            description="Combina múltiples equipos o actividades dentro de una misma OT."
            color="purple"
            onClick={() => onSeleccionar("mixto")}
          />

          {/* OT GRUPAL */}
          <TipoCard
            icon={Users}
            title="OT Grupal"
            description="Crea órdenes de trabajo para varios equipos de forma masiva."
            color="green"
            onClick={() => onSeleccionar("grupal")}
          />
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 font-medium transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= UI COMPONENT ================= */

function TipoCard({ icon: Icon, title, description, onClick, color }) {
  const colors = {
    blue: {
      bg: "hover:bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
    purple: {
      bg: "hover:bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      badge: "bg-purple-100 text-purple-700",
    },
    green: {
      bg: "hover:bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
      badge: "bg-green-100 text-green-700",
    },
  };

  const c = colors[color];

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left border-2 ${c.border}
        rounded-xl p-5 transition-all
        hover:shadow-lg hover:-translate-y-0.5
        ${c.bg}
        focus:outline-none focus:ring-2 focus:ring-indigo-500
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${c.badge}`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
