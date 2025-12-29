import { useState } from "react";

export default function ModalLookup({
  isOpen,
  onClose,
  title,
  data,
  onSelect,
}) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = data.filter(
    (i) =>
      i.codigo.toLowerCase().includes(search.toLowerCase()) ||
      i.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-[800px] max-h-[600px] flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>

        {/* SEARCH */}
        <div className="p-4">
          <input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* TABLE */}
        <div className="flex-1 overflow-y-auto px-4">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Código</th>
                <th className="border p-2">Nombre</th>
                <th className="border p-2">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.codigo}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    onSelect(i);
                    onClose();
                  }}
                >
                  <td className="border p-2">{i.codigo}</td>
                  <td className="border p-2">{i.nombre}</td>
                  <td className="border p-2">{i.tipo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
