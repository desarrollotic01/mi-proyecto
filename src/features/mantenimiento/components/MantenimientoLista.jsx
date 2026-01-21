// src/features/mantenimiento/components/MantenimientoLista.jsx
import { ESTADOS_AV } from "../config/camposMantenimiento";

export default function MantenimientoLista({
  avisos = [],               // 👈 IMPORTANTE: default []
  cardFields,
  columnOrder,
  getEstadoBadge,
  abrirTratamiento,
  cambiarEstado,
  setViewData,
  setViewStep,
  setViewOpen,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columnOrder.map((key) => {
              if (!cardFields[key]) return null;

              const labels = {
                numeroAviso: "Código Aviso",
                descripcion: "Descripción",
                cliente: "Cliente",
                equipo: "Equipo",
                estado: "Estado",
                fecha: "Fecha",
                prioridad: "Prioridad",
                solicitante: "Solicitante",
                tipoMantenimiento: "Tipo Mant.",
              };

              return (
                <th key={key} className="border px-3 py-2 text-left">
                  {labels[key]}
                </th>
              );
            })}

            <th className="border px-3 py-2 text-left">
              Siguiente Proceso
            </th>
          </tr>
        </thead>

        <tbody>
          {avisos.length === 0 && (
            <tr>
              <td
                colSpan={columnOrder.length + 1}
                className="text-center text-gray-400 py-6"
              >
                No hay avisos para mostrar
              </td>
            </tr>
          )}

          {avisos.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setViewData(item);
                setViewStep(1);
                setViewOpen(true);
              }}
            >
              {columnOrder.map((key) => {
                if (!cardFields[key]) return null;

                return (
                  <td key={key} className="border px-2 py-1">
                    {key === "numeroAviso" && (
                      <span
                        className={`px-2 py-[2px] rounded-sm text-xs border ${getEstadoBadge(
                          item.estado
                        )}`}
                      >
                        {item.numeroAviso}
                      </span>
                    )}

                    {key === "descripcion" && (item.descripcion || "—")}

                    {key === "cliente" && (item.cliente || "—")}

                    {key === "equipo" &&
                      (item.equipos?.[0]?.nombre ||
                        item.producto ||
                        "—")}

                    {key === "estado" &&
                      ESTADOS_AV[item.estado]?.label}

                    {key === "fecha" &&
                      (item.fechaAtencion
                        ? new Date(item.fechaAtencion).toLocaleDateString(
                            "es-PE"
                          )
                        : "—")}

                    {key === "prioridad" && (item.prioridad || "—")}

                    {key === "solicitante" &&
                      (item.solicitante || "—")}

                    {key === "tipoMantenimiento" &&
                      (item.tipoMantenimiento || "—")}
                  </td>
                );
              })}

              {/* ================= ACCIONES ================= */}
              <td
                className="border px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                {item.estado === "creado" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirTratamiento(item)}
                      className="bg-yellow-300 text-xs px-2 py-1 rounded"
                    >
                      Tratar AV
                    </button>

                    <button
                      onClick={() =>
                        cambiarEstado(item, "rechazado")
                      }
                      className="bg-red-300 text-xs px-2 py-1 rounded"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                {item.estado === "tratado" && (
                  <button
                    onClick={() =>
                      cambiarEstado(item, "con OT")
                    }
                    className="bg-blue-300 text-xs px-2 py-1 rounded"
                  >
                    Generar OT
                  </button>
                )}

                {item.estado === "con OT" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        cambiarEstado(item, "finalizado")
                      }
                      className="bg-green-300 text-xs px-2 py-1 rounded"
                    >
                      Finalizar
                    </button>

                    <button
                      onClick={() =>
                        cambiarEstado(
                          item,
                          "finalizado sin facturacion"
                        )
                      }
                      className="bg-gray-300 text-xs px-2 py-1 rounded"
                    >
                      Sin Fact.
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
