// components/OTActividadPreventivaItem.jsx
import { ROLES_TECNICOS, getRolLabel } from "../helpers/otHelpers";


const TIPOS_TRABAJO_PREVENTIVO = [
  { value: "REVISION", label: "Revisión" },
  { value: "LUBRICACION", label: "Lubricación" },
  { value: "AJUSTE", label: "Ajuste" },
  { value: "LIMPIEZA", label: "Limpieza" },
  { value: "CALIBRACION", label: "Calibración" },
  { value: "INSPECCION", label: "Inspección" },
  { value: "CAMBIO", label: "Cambio" },
];
// ─── Constantes de columnas ───────────────────────────────────────────────────
const GRID = "28px 1fr 1fr 1fr 1.5fr 1.1fr 1.1fr 58px 58px 62px 58px 58px";

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const cellStyle = {
  borderRight: "0.5px solid var(--color-border-tertiary)",
  padding: "3px 4px",
  height: 36,
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
};

function makeInputStyle(disabled) {
  return {
    width: "100%",
    height: 26,
    border: "none",
    background: "transparent",
    fontSize: 12,
    color: disabled ? "var(--color-text-secondary)" : "var(--color-text-primary)",
    fontFamily: "var(--font-sans)",
    padding: "0 4px",
    outline: "none",
    cursor: disabled ? "default" : "text",
  };
}

function ExcelInput({ value, onChange, type = "text", placeholder, disabled, min }) {
  const style = makeInputStyle(disabled);
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      style={style}
      onFocus={(e) => {
        if (!disabled) e.target.style.background = "var(--color-background-info)";
      }}
      onBlur={(e) => (e.target.style.background = "transparent")}
    />
  );
}

function ExcelSelect({ value, onChange, disabled, children }) {
  const style = makeInputStyle(disabled);
  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      style={{ ...style, cursor: disabled ? "default" : "pointer" }}
      onFocus={(e) => {
        if (!disabled) e.target.style.background = "var(--color-background-info)";
      }}
      onBlur={(e) => (e.target.style.background = "transparent")}
    >
      {children}
    </select>
  );
}

function ObsButton({ filled, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        border: filled
          ? "0.5px solid #639922"
          : "0.5px solid var(--color-border-secondary)",
        background: filled ? "#EAF3DE" : "var(--color-background-primary)",
        color: filled ? "#27500A" : "var(--color-text-secondary)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      Obs.
    </button>
  );
}

function DescButton({ filled, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        border: filled
          ? "0.5px solid #378ADD"
          : "0.5px solid var(--color-border-secondary)",
        background: filled ? "#E6F1FB" : "var(--color-background-primary)",
        color: filled ? "#0C447C" : "var(--color-text-secondary)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      Desc.
    </button>
  );
}

// ─── Fila de encabezados ─────────────────────────────────────────────────────
export function OTActividadesPreventivasHeader() {
  const cols = [
    "#", "Sistema", "Subsistema", "Componente", "Tarea",
    "Tipo trabajo", "Rol técnico", "Tec.", "Dur.", "Unidad",
    "Desc.", "Obs.",
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID,
        background: "var(--color-background-secondary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}
    >
      {cols.map((c, i) => (
        <div
          key={i}
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            padding: "5px 6px",
            borderRight:
              i < cols.length - 1
                ? "0.5px solid var(--color-border-tertiary)"
                : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: i === 0 ? "center" : "left",
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

// ─── Fila de actividad preventiva ────────────────────────────────────────────
export default function OTActividadPreventivaItem({ act, index, onChange, onOpenObservacion, onOpenDescripcion }) {
  const esPlan = !!act.planMantenimientoActividadId;

  const puedeEditar = (campo) => {
    if (!esPlan) return true;
    return ["cantidadTecnicos", "duracionEstimadaValor", "unidadDuracion", "observaciones"].includes(campo);
  };

  const tieneObs = !!String(act.observaciones || "").trim();
  const tieneDesc = !!String(act.descripcion || "").trim();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID,
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        alignItems: "center",
        background: "var(--color-background-primary)",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--color-background-secondary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--color-background-primary)")
      }
    >
      {/* # */}
      <div style={{ ...cellStyle, justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>
          {index + 1}
        </span>
      </div>

      {/* Sistema */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.sistema}
          disabled={!puedeEditar("sistema")}
          onChange={(e) => onChange("sistema", e.target.value)}
        />
      </div>

      {/* Subsistema */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.subsistema}
          disabled={!puedeEditar("subsistema")}
          onChange={(e) => onChange("subsistema", e.target.value)}
        />
      </div>

      {/* Componente */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.componente}
          disabled={!puedeEditar("componente")}
          onChange={(e) => onChange("componente", e.target.value)}
        />
      </div>

      {/* Tarea */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.tarea}
          disabled={!puedeEditar("tarea")}
          onChange={(e) => onChange("tarea", e.target.value)}
        />
      </div>

      {/* Tipo de trabajo */}
      <div style={cellStyle}>
        <ExcelSelect
          value={act.tipoTrabajo ?? "REVISION"}
          disabled={!puedeEditar("tipoTrabajo")}
          onChange={(e) => onChange("tipoTrabajo", e.target.value)}
        >
          {TIPOS_TRABAJO_PREVENTIVO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </ExcelSelect>
      </div>

      {/* Rol técnico */}
      <div style={cellStyle}>
        <ExcelSelect
          value={act.rolTecnico ?? "tecnico_mecanico"}
          disabled={!puedeEditar("rolTecnico")}
          onChange={(e) => onChange("rolTecnico", e.target.value)}
        >
          {ROLES_TECNICOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </ExcelSelect>
      </div>

      {/* Cantidad técnicos */}
      <div style={cellStyle}>
        <ExcelInput
          type="number"
          value={act.cantidadTecnicos}
          min={1}
          disabled={!puedeEditar("cantidadTecnicos")}
          onChange={(e) => onChange("cantidadTecnicos", Number(e.target.value))}
        />
      </div>

      {/* Duración */}
      <div style={cellStyle}>
        <ExcelInput
          type="number"
          value={act.duracionEstimadaValor}
          min={1}
          disabled={!puedeEditar("duracionEstimadaValor")}
          onChange={(e) => onChange("duracionEstimadaValor", Number(e.target.value))}
        />
      </div>

      {/* Unidad */}
      <div style={cellStyle}>
        <ExcelSelect
          value={act.unidadDuracion ?? "min"}
          disabled={!puedeEditar("unidadDuracion")}
          onChange={(e) => onChange("unidadDuracion", e.target.value)}
        >
          <option value="min">Min</option>
          <option value="h">Hrs</option>
        </ExcelSelect>
      </div>

      {/* Descripción */}
      <div style={{ ...cellStyle, justifyContent: "center" }}>
        <DescButton
          filled={tieneDesc}
          disabled={esPlan}
          onClick={onOpenDescripcion}
        />
      </div>

      {/* Observación */}
      <div style={{ ...cellStyle, borderRight: "none", justifyContent: "center" }}>
        <ObsButton filled={tieneObs} onClick={onOpenObservacion} />
      </div>
    </div>
  );
}