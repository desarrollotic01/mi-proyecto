// components/OTActividadCorrectivaItem.jsx
import { Trash2 } from "lucide-react";
import { ROLES_TECNICOS, TIPOS_TRABAJO_CORRECTIVO } from "../helpers/otHelpers";

// ─── Constantes de columnas ───────────────────────────────────────────────────
const GRID = "28px 1fr 1fr 1fr 1.5fr 1.1fr 1.1fr 58px 58px 62px 58px 58px 32px";

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const cellStyle = {
  borderRight: "0.5px solid var(--color-border-tertiary)",
  padding: "3px 4px",
  height: 36,
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
};

const inputStyle = {
  width: "100%",
  height: 26,
  border: "none",
  background: "transparent",
  fontSize: 12,
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-sans)",
  padding: "0 4px",
  outline: "none",
};

function ExcelInput({ value, onChange, type = "text", placeholder, min }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      style={inputStyle}
      onFocus={(e) => (e.target.style.background = "var(--color-background-info)")}
      onBlur={(e) => (e.target.style.background = "transparent")}
    />
  );
}

function ExcelSelect({ value, onChange, children }) {
  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      style={{ ...inputStyle, cursor: "pointer" }}
      onFocus={(e) => (e.target.style.background = "var(--color-background-info)")}
      onBlur={(e) => (e.target.style.background = "transparent")}
    >
      {children}
    </select>
  );
}

function ObsButton({ filled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 4,
        cursor: "pointer",
        whiteSpace: "nowrap",
        border: filled
          ? "0.5px solid #639922"
          : "0.5px solid var(--color-border-secondary)",
        background: filled ? "#EAF3DE" : "var(--color-background-primary)",
        color: filled ? "#27500A" : "var(--color-text-secondary)",
      }}
    >
      Obs.
    </button>
  );
}

function DescButton({ filled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 4,
        cursor: "pointer",
        whiteSpace: "nowrap",
        border: filled
          ? "0.5px solid #378ADD"
          : "0.5px solid var(--color-border-secondary)",
        background: filled ? "#E6F1FB" : "var(--color-background-primary)",
        color: filled ? "#0C447C" : "var(--color-text-secondary)",
      }}
    >
      Desc.
    </button>
  );
}

// ─── Fila de encabezados ─────────────────────────────────────────────────────
export function OTActividadesCorrectivasHeader() {
  const cols = [
    "#", "Sistema", "Subsistema", "Componente", "Tarea",
    "Tipo trabajo", "Rol técnico", "Tec.", "Dur.", "Unidad",
    "Desc.", "Obs.", "",
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

// ─── Fila de actividad correctiva ────────────────────────────────────────────
export default function OTActividadCorrectivaItem({
  act,
  index,
  onChange,
  onDelete,
  onOpenObservacion,
  onOpenDescripcion,
}) {
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
          placeholder="Sistema"
          onChange={(e) => onChange("sistema", e.target.value)}
        />
      </div>

      {/* Subsistema */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.subsistema}
          placeholder="Subsistema"
          onChange={(e) => onChange("subsistema", e.target.value)}
        />
      </div>

      {/* Componente */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.componente}
          placeholder="Componente"
          onChange={(e) => onChange("componente", e.target.value)}
        />
      </div>

      {/* Tarea */}
      <div style={cellStyle}>
        <ExcelInput
          value={act.tarea}
          placeholder="Tarea"
          onChange={(e) => onChange("tarea", e.target.value)}
        />
      </div>

      {/* Tipo de trabajo */}
      <div style={cellStyle}>
        <ExcelSelect
          value={act.tipoTrabajo ?? "REPARACION"}
          onChange={(e) => onChange("tipoTrabajo", e.target.value)}
        >
          {TIPOS_TRABAJO_CORRECTIVO.map((t) => (
            <option key={t} value={t}>
              {t === "REPARACION" ? "Reparación" : "Cambio"}
            </option>
          ))}
        </ExcelSelect>
      </div>

      {/* Rol técnico */}
      <div style={cellStyle}>
        <ExcelSelect
          value={act.rolTecnico ?? "tecnico_mecanico"}
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
          onChange={(e) => onChange("cantidadTecnicos", Number(e.target.value))}
        />
      </div>

      {/* Duración */}
      <div style={cellStyle}>
        <ExcelInput
          type="number"
          value={act.duracionEstimadaValor}
          min={1}
          onChange={(e) => onChange("duracionEstimadaValor", Number(e.target.value))}
        />
      </div>

      {/* Unidad */}
      <div style={cellStyle}>
        <ExcelSelect
          value={act.unidadDuracion ?? "min"}
          onChange={(e) => onChange("unidadDuracion", e.target.value)}
        >
          <option value="min">Min</option>
          <option value="h">Hrs</option>
        </ExcelSelect>
      </div>

      {/* Descripción */}
      <div style={{ ...cellStyle, justifyContent: "center" }}>
        <DescButton filled={tieneDesc} onClick={onOpenDescripcion} />
      </div>

      {/* Observación */}
      <div style={{ ...cellStyle, justifyContent: "center" }}>
        <ObsButton filled={tieneObs} onClick={onOpenObservacion} />
      </div>

      {/* Eliminar */}
      <div style={{ ...cellStyle, borderRight: "none", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onDelete}
          title="Eliminar actividad"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#A32D2D",
            padding: "2px 4px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FCEBEB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}