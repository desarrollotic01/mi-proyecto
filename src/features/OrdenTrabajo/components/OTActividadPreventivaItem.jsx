// components/OTActividadPreventivaItem.jsx
import { getRolLabel } from "../helpers/otHelpers";

export default function OTActividadPreventivaItem({ act, index, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-900">
          Actividad #{index + 1}
          {act.codigoActividad ? (
            <span className="text-slate-500 font-normal"> · {act.codigoActividad}</span>
          ) : null}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {act.sistema || "—"} · {act.subsistema || "—"} · {act.componente || "—"}
        </p>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <FilaDetalle label="Sistema" value={act.sistema || "—"} />
                <FilaDetalle label="Subsistema" value={act.subsistema || "—"} />
                <FilaDetalle label="Componente" value={act.componente || "—"} />
                <FilaDetalle label="Tarea" value={act.tarea || "—"} />
                <FilaDetalle label="Descripción" value={act.descripcion || "—"} />
                <FilaDetalle label="Tipo de trabajo" value={act.tipoTrabajo || "—"} />
                <FilaDetalle label="Rol técnico" value={getRolLabel(act.rolTecnico)} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Duración</Label>
                <input
                  type="number"
                  value={act.duracionEstimadaValor}
                  onChange={(e) => onChange("duracionEstimadaValor", e.target.value)}
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>Unidad</Label>
                <select
                  value={act.unidadDuracion}
                  onChange={(e) => onChange("unidadDuracion", e.target.value)}
                  className={inputClass()}
                >
                  <option value="min">min</option>
                  <option value="h">h</option>
                </select>
              </div>

              <div>
                <Label>Técnicos</Label>
                <input
                  type="number"
                  min="1"
                  value={act.cantidadTecnicos}
                  onChange={(e) => onChange("cantidadTecnicos", e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <textarea
                rows={3}
                value={act.observaciones || ""}
                onChange={(e) => onChange("observaciones", e.target.value)}
                className={textareaClass()}
              />
            </div>

            <p className="text-xs text-slate-500">
              Normalizado:{" "}
              <span className="font-semibold text-slate-700">
                {act.duracionEstimadaMin ?? 0} min
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilaDetalle({ label, value }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="w-[180px] px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
        {label}
      </td>
      <td className="px-3 py-2 text-sm text-slate-800">{String(value ?? "—")}</td>
    </tr>
  );
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-slate-700 mb-2">{children}</label>;
}

function inputClass() {
  return "w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-slate-800 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200";
}

function textareaClass() {
  return "w-full px-4 py-3 border rounded-xl bg-white text-sm text-slate-800 border-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200";
}