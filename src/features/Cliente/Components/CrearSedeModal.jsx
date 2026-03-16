import { useState } from "react";
import { X, Building2, Loader2, AlertCircle } from "lucide-react";
import { sedeService } from "../../Cliente/Services/SedeServices";

const INITIAL_FORM = {
  nombre: "",
  direccion: "",
  telefono: "",
  contacto: "",
  correo: "",
  estado: "Activo",
};

export default function CrearSedeModal({ isOpen, onClose, cliente, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !cliente) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const cerrarTodo = () => {
    setForm(INITIAL_FORM);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        clienteId: cliente.id,
        nombre: form.nombre,
        direccion: form.direccion,
        telefono: form.telefono,
        contacto: form.contacto,
        correo: form.correo,
        estado: form.estado,
      };

      const nuevaSede = await sedeService.crearSede(payload);
      if (onCreated) await onCreated(nuevaSede);
      cerrarTodo();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo crear la sede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-emerald-600" />
              Crear Sede
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Cliente: <b>{cliente.razonSocial}</b>
            </p>
          </div>

          <button
            onClick={cerrarTodo}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre de sede"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />

            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              name="contacto"
              value={form.contacto}
              onChange={handleChange}
              placeholder="Contacto"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="Correo"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            placeholder="Dirección"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={cerrarTodo}
              className="px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear sede
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}