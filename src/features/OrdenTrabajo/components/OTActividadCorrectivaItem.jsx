// components/OTActividadCorrectivaItem.jsx
import {
  ROLES_TECNICOS,
  TIPOS_TRABAJO_CORRECTIVO,
  TIPOS_TRABAJO_ENUM,
} from "../helpers/otHelpers";
import { Trash2 } from "lucide-react";

export default function OTActividadCorrectivaItem({
  act,
  index,
  esCorrectivo,
  onChange,
  onDelete,
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Actividad #{index + 1}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Rol: {act.rolTecnico || "—"} · {act.cantidadTecnicos} técnico
            {Number(act.cantidadTecnicos) !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg text-xs font-medium transition flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Eliminar
        </button>
      </div>

      <div className="p-4">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-4">
          <input
            type="checkbox"
            checked={!!act.selected}
            onChange={(e) => onChange("selected", e.target.checked)}
            className="w-4 h-4"
          />
          Incluir en la OT
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Sistema</Label>
            <input
              value={act.sistema}
              onChange={(e) => onChange("sistema", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div>
            <Label>Subsistema</Label>
            <input
              value={act.subsistema}
              onChange={(e) => onChange("subsistema", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div>
            <Label>Componente</Label>
            <input
              value={act.componente}
              onChange={(e) => onChange("componente", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div>
            <Label>Tarea *</Label>
            <input
              value={act.tarea}
              onChange={(e) => onChange("tarea", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <input
              value={act.descripcion}
              onChange={(e) => onChange("descripcion", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div>
            <Label>Tipo de Trabajo</Label>
            <select
              value={act.tipoTrabajo}
              onChange={(e) => onChange("tipoTrabajo", e.target.value)}
              className={inputClass()}
            >
              {(esCorrectivo ? TIPOS_TRABAJO_CORRECTIVO : TIPOS_TRABAJO_ENUM).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Duración</Label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={act.duracionEstimadaValor}
                onChange={(e) => onChange("duracionEstimadaValor", e.target.value)}
                className={inputClass()}
              />
              <select
                value={act.unidadDuracion}
                onChange={(e) => onChange("unidadDuracion", e.target.value)}
                className={inputClass()}
              >
                <option value="min">min</option>
                <option value="h">h</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Normalizado: {act.duracionEstimadaMin ?? 0} min
            </p>
          </div>

          <div>
            <Label>Rol técnico</Label>
            <select
              value={act.rolTecnico || "tecnico_mecanico"}
              onChange={(e) => onChange("rolTecnico", e.target.value)}
              className={inputClass()}
            >
              {ROLES_TECNICOS.map((rol) => (
                <option key={rol.value} value={rol.value}>
                  {rol.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Cantidad técnicos</Label>
            <input
              type="number"
              min="1"
              value={act.cantidadTecnicos}
              onChange={(e) => onChange("cantidadTecnicos", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Observaciones</Label>
            <input
              value={act.observaciones}
              onChange={(e) => onChange("observaciones", e.target.value)}
              className={inputClass()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-slate-700 mb-2">{children}</label>;
}

function inputClass() {
  return "w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-slate-800 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200";
}