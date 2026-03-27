// ModalEquipo.jsx
export default function ModalEquipo({ isOpen, onClose, formData, setFormData, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded w-96 space-y-2">
        <h3 className="text-lg font-bold">{formData.id ? "Editar Equipo" : "Nuevo Equipo"}</h3>

        <input
          type="text"
          placeholder="Código"
          value={formData.codigo}
          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          className="input w-full"
        />

        <input
          type="text"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="input w-full"
        />

        <input
          type="text"
          placeholder="Tipo"
          value={formData.tipo}
          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
          className="input w-full"
        />

        <input
          type="text"
          placeholder="Marca"
          value={formData.marca}
          onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
          className="input w-full"
        />

        <input
          type="date"
          placeholder="Fecha de Compra"
          value={formData.fechaCompra}
          onChange={(e) => setFormData({ ...formData, fechaCompra: e.target.value })}
          className="input w-full"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn border">Cancelar</button>
          <button onClick={onSave} className="btn bg-slate-900 text-white hover:bg-slate-800 transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  );
}
