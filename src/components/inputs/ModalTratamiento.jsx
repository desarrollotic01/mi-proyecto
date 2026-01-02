import { useState } from "react";
import { personalRegistrado } from "../data";

export default function ModalTratamiento({
  isOpen,
  aviso,
  onClose,
  onGuardar,
}) {
  const [data, setData] = useState({
    contratista: "",
    requerimientos: [
      { rol: "electrico", label: "Técnico Eléctrico", cantidad: 0, personas: [], search: "" },
      { rol: "mantenimiento", label: "Operario Mantenimiento", cantidad: 0, personas: [], search: "" },
      { rol: "mecanico", label: "Técnico Mecánico", cantidad: 0, personas: [], search: "" },
    ],
  });

  if (!isOpen || !aviso) return null;

  const update = (i, changes) => {
    const copy = [...data.requerimientos];
    copy[i] = { ...copy[i], ...changes };
    setData({ ...data, requerimientos: copy });
  };

  const togglePersona = (i, persona) => {
    const r = data.requerimientos[i];
    const exists = r.personas.find(p => p.id === persona.id);

    update(i, {
      personas: exists
        ? r.personas.filter(p => p.id !== persona.id)
        : [...r.personas, persona],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[1000px] h-[650px] rounded-xl flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tratamiento del Aviso</h2>
          <p className="text-sm text-gray-500">Aviso #{aviso.numeroAviso}</p>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-6">

          {/* DATOS AVISO */}
          <div className="space-y-2 text-sm">
<Info label="Cliente" value={aviso.cliente} />
<Info label="Cliente" value={aviso.cliente} />
            <Info label="Cliente" value={aviso.cliente} />
            <Info label="Descripción" value={aviso.descripcion} />
            <Info label="Ubicación Técnica" value={aviso.ubicacionTecnica} />
          </div>

          {/* TRATAMIENTO */}
          <div className="space-y-4">

            {/* CONTRATISTA */}
            <input
              placeholder="Contratista"
              className="border rounded px-3 py-2 text-sm w-full"
              value={data.contratista}
              onChange={(e) =>
                setData({ ...data, contratista: e.target.value })
              }
            />

            {data.requerimientos.map((r, i) => {
              const lista = personalRegistrado[r.rol]
                .filter(p =>
                  p.nombre.toLowerCase().includes(r.search.toLowerCase())
                )
                .slice(0, 5); // 🔥 solo 5 sugerencias

              return (
                <div key={r.rol} className="border rounded p-3 space-y-2">

                  {/* HEADER */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{r.label}</span>
                    <input
                      type="number"
                      min="0"
                      className="w-16 border rounded px-2 py-1 text-sm"
                      value={r.cantidad}
                      onChange={(e) =>
                        update(i, { cantidad: Number(e.target.value) })
                      }
                    />
                  </div>

                  {/* BUSCADOR */}
                  {r.cantidad > 0 && (
                    <>
                      <input
                        placeholder="Buscar persona..."
                        className="border rounded px-2 py-1 text-xs w-full"
                        value={r.search}
                        onChange={(e) =>
                          update(i, { search: e.target.value })
                        }
                      />

                      {/* SUGERENCIAS */}
                      <div className="flex flex-wrap gap-2">
                        {lista.map(p => (
                          <button
                            key={p.id}
                            onClick={() => togglePersona(i, p)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                          >
                            {p.nombre}
                          </button>
                        ))}
                      </div>

                      {/* SELECCIONADOS */}
                      {r.personas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {r.personas.map(p => (
                            <span
                              key={p.id}
                              className="text-xs bg-green-100 border border-green-400 px-2 py-1 rounded flex items-center gap-1"
                            >
                              {p.nombre}
                              <button
                                onClick={() => togglePersona(i, p)}
                                className="text-red-500"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancelar
          </button>
          <button
            onClick={() => onGuardar(data)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Guardar Tratamiento
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}
