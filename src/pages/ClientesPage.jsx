import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Download, Package, AlertCircle, X, Loader2 } from "lucide-react";


import { clienteService } from '../features/mantenimiento/services/clienteService.js';

/* ================= MODAL ================= */
function ClienteModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
  razonSocial: "",
  ruc: "",
  direccion: "",
  contacto: "",
  telefono: "",
  correo: "",
  tipoCliente: "",
  estado: "Activo",
});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

useEffect(() => {
  if (initialData) {
    setForm(initialData);
  } else {
    setForm({
      razonSocial: "",
      ruc: "",
      direccion: "",
      contacto: "",
      telefono: "",
      correo: "",
      tipoCliente: "",
      estado: "Activo",
    });
  }
  setError(null);
}, [initialData, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.razonSocial || !form.ruc) {
  setError("Razón Social y RUC son obligatorios");
  return;
}
    setLoading(true);
    setError(null);

    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {initialData ? "Editar cliente" : "Nuevo cliente"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {initialData ? "Actualiza la información del cliente" : "Completa los datos del nuevo cliente"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Razón Social <span className="text-red-500">*</span>
  </label>
  <input
    value={form.razonSocial}
    onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    RUC <span className="text-red-500">*</span>
  </label>
  <input
    value={form.ruc}
    onChange={(e) => setForm({ ...form, ruc: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Dirección
  </label>
  <input
    value={form.direccion || ""}
    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Contacto
  </label>
  <input
    value={form.contacto || ""}
    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Teléfono
  </label>
  <input
    value={form.telefono || ""}
    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Correo
  </label>
  <input
    value={form.correo || ""}
    onChange={(e) => setForm({ ...form, correo: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Tipo de Cliente
  </label>
  <input
    value={form.tipoCliente || ""}
    onChange={(e) => setForm({ ...form, tipoCliente: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Estado
  </label>
  <select
    value={form.estado}
    onChange={(e) => setForm({ ...form, estado: e.target.value })}
    className="w-full px-4 py-3 border rounded-xl"
  >
    <option value="Activo">Activo</option>
    <option value="Inactivo">Inactivo</option>
  </select>
</div>


          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !form.razonSocial || !form.ruc}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? "Actualizar" : "Crear cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function clientesPage() {
  const [clientes, setclientes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadclientes();
  }, []);

  const loadclientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteService.getClientes();
      setclientes(data);
    } catch (err) {
      setError("Error al cargar los clientes. Verifica que el backend esté corriendo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editing) {
        await clienteService.updateCliente(editing.id, data);
      } else {
        await clienteService.createCliente(data);
      }
      
      await loadclientes();
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await clienteService.deleteCliente(id);
        await loadclientes();
      } catch (err) {
        alert("Error al eliminar el cliente: " + err.message);
        console.error(err);
      }
    }
  };

const filteredclientes = clientes.filter((c) => {
  const matchesSearch =
    c.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacto?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesEstado =
    filterEstado === "Todos" || c.estado === filterEstado;

  return matchesSearch && matchesEstado;
});

  const getEstadoBadge = (estado) => {
    const styles = {
      Activo: "bg-green-100 text-green-700 border-green-200",
      Inactivo: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[estado] || styles.Activo;
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando clientes...</p>
          <p className="text-sm text-gray-500 mt-2">Conectando con el servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Gestión de clientes
            </h1>
            <p className="text-gray-600">
              Sistema de inventario y control de clientes industriales
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar cliente
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-1">Asegúrate de que tu backend esté en: <code className="bg-red-100 px-2 py-1 rounded">http://localhost:3000/api</code></p>
            </div>
            <button
              onClick={loadclientes}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reintentar"}
            </button>
          </div>
        )}

        {/* Total Stats Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-50">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total de clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{clientes.length}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>

  

              <button 
                onClick={loadclientes}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={loading}
                title="Actualizar lista"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Razon Social</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">RUC</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Contacto</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Teléfono</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
  {filteredclientes.length === 0 ? (
    <tr>
      <td colSpan="6" className="text-center py-12 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No se encontraron clientes</p>
        <p className="text-sm mt-1">
          {clientes.length === 0
            ? "Agrega tu primer cliente para comenzar"
            : "Intenta con otros filtros"}
        </p>
      </td>
    </tr>
  ) : (
    filteredclientes.map((c) => (
      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-6">{c.razonSocial}</td>
        <td className="py-4 px-6">{c.ruc}</td>
        <td className="py-4 px-6">{c.contacto || "-"}</td>
        <td className="py-4 px-6">{c.telefono || "-"}</td>
        <td className="py-4 px-6">
          <span className={`px-3 py-1 rounded-full text-xs ${getEstadoBadge(c.estado)}`}>
            {c.estado}
          </span>
        </td>
        <td className="py-4 px-6">
          <button
            onClick={() => {
              setEditing(c);
              setModalOpen(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={16} />
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>

            </table>
          </div>

          {/* Footer */}
          {filteredclientes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{filteredclientes.length}</span> de{" "}
                <span className="font-semibold text-gray-900">{clientes.length}</span> clientes
              </p>
            </div>
          )}
        </div>
      </div>



      <ClienteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialData={editing}
      />
    </div>
  );
}