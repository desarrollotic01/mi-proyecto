import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Download, MapPin, AlertCircle, X, Loader2 } from "lucide-react";

import { UbicacionTecnicaService } from "../features/mantenimiento/services/UbicacionService";

/* ================= MODAL ================= */
function UbicacionModal({ isOpen, onClose, onSave, initialData, ubicaciones }) {
  const [form, setForm] = useState(
    initialData || {
      codigo: "",
      nombre: "",
      descripcion: "",
      nivel: "",
      ubicacionPadre: "",
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        codigo: "",
        nombre: "",
        descripcion: "",
        nivel: "",
        ubicacionPadre: "",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.codigo || !form.nombre) {
      setError("Código y Nombre son campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar la ubicación");
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
              {initialData ? "Editar Ubicación Técnica" : "Nueva Ubicación Técnica"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {initialData ? "Actualiza la información de la ubicación" : "Completa los datos de la nueva ubicación"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: PL-LIM"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Planta Lima"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Descripción de la ubicación"
                value={form.descripcion || ""}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nivel
              </label>
              <input
                type="text"
                placeholder="Ej: Planta, Piso, Área"
                value={form.nivel || ""}
                onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ubicación Padre
              </label>
              <select
                value={form.ubicacionPadre || ""}
                onChange={(e) => setForm({ ...form, ubicacionPadre: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={loading}
              >
                <option value="">Sin ubicación padre</option>
                {ubicaciones
                  .filter(u => initialData ? u.id !== initialData.id : true)
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.codigo})
                    </option>
                  ))}
              </select>
            </div>
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
              disabled={loading || !form.codigo || !form.nombre}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? "Actualizar" : "Crear Ubicación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function UbicacionesTecnicasPage() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNivel, setFilterNivel] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUbicaciones();
  }, []);

  const loadUbicaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await UbicacionTecnicaService.getUbicacionTecnicas();
      setUbicaciones(data);
    } catch (err) {
      setError("Error al cargar las ubicaciones. Verifica que el backend esté corriendo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
     const payload = {
    ...data,
    ubicacionPadre: data.ubicacionPadre === "" ? null : data.ubicacionPadre,
  };

  if (editing) {
    await UbicacionTecnicaService.updateUbicacionTecnica(editing.id, payload);
  } else {
    await UbicacionTecnicaService.createUbicacionTecnica(payload);
  }

  await loadUbicaciones();
  setModalOpen(false);
  setEditing(null);
};

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar esta ubicación?")) {
      try {
        await UbicacionTecnicaService.deleteUbicacion(id);
        await loadUbicaciones();
      } catch (err) {
        alert("Error al eliminar la ubicación: " + err.message);
        console.error(err);
      }
    }
  };

  const filteredUbicaciones = ubicaciones.filter((u) => {
    const matchesSearch = 
      u.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNivel = filterNivel === "Todos" || u.nivel === filterNivel;

    return matchesSearch && matchesNivel;
  });

  const getNombreUbicacionPadre = (ubicacionPadreId) => {
    if (!ubicacionPadreId) return "-";
    const padre = ubicaciones.find(u => u.id === ubicacionPadreId);
    return padre ? `${padre.nombre} (${padre.codigo})` : "-";
  };

  if (loading && ubicaciones.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando ubicaciones...</p>
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
              Ubicaciones Técnicas
            </h1>
            <p className="text-gray-600">
              Gestión de ubicaciones jerárquicas del sistema
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 font-medium"
          >
            <Plus className="w-5 h-5" />
            Nueva Ubicación
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
              onClick={loadUbicaciones}
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
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Ubicaciones</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{ubicaciones.length}</p>
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
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterNivel}
                onChange={(e) => setFilterNivel(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
                <option value="Todos">Todos los niveles</option>
                {Array.from(new Set(ubicaciones.map(u => u.nivel).filter(Boolean))).map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>

              <button 
                onClick={loadUbicaciones}
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
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Código</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Nivel</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ubicación Padre</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUbicaciones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No se encontraron ubicaciones</p>
                      <p className="text-sm mt-1">
                        {ubicaciones.length === 0 
                          ? "Agrega tu primera ubicación para comenzar" 
                          : "Intenta con otros filtros"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUbicaciones.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-semibold text-gray-900">{u.codigo}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">{u.nombre}</td>
                      <td className="py-4 px-6 text-gray-600">{u.descripcion || "-"}</td>
                      <td className="py-4 px-6 text-gray-600">{u.nivel || "-"}</td>
                      <td className="py-4 px-6 text-gray-600">{getNombreUbicacionPadre(u.ubicacionPadre)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditing(u);
                              setModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredUbicaciones.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{filteredUbicaciones.length}</span> de{" "}
                <span className="font-semibold text-gray-900">{ubicaciones.length}</span> ubicaciones
              </p>
            </div>
          )}
        </div>
      </div>

      <UbicacionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialData={editing}
        ubicaciones={ubicaciones}
      />
    </div>
  );
}