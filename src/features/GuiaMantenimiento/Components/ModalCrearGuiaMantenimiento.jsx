import { useEffect, useState } from "react";
import { guiaMantenimientoService } from "../services/guiaMantenimientoService";
import { equipoService } from "../../mantenimiento/services/equipoService";
import { planMantenimientoService } from "../../PlanMantenimiento/services/planMantenimientoService";
import { useAuth } from "../../../auth/context/AuthContext";

const PERIODOS = [
  { value: "DIARIO", label: "Diario" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "BIMESTRAL", label: "Bimestral" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEIS_MESES", label: "6 Meses" },
  { value: "ANUAL", label: "Anual" },
  { value: "CINCO_ANIOS", label: "5 Años" },
  { value: "DIEZ_ANIOS", label: "10 Años" },
];

const TIPOS_ANTICIPACION = [
  { value: "MINUTOS", label: "Minutos" },
  { value: "HORAS", label: "Horas" },
  { value: "DIAS", label: "Días" },
  { value: "SEMANAS", label: "Semanas" },
];

const INITIAL_FORM = {
  tipoReferencia: "equipo",
  equipoId: "",
  ubicacionTecnicaId: "",
  planMantenimientoId: "",
  periodo: "MENSUAL",
  periodoActivo: true,
  ordenVenta: "",
  fechaInicioAlerta: "",
  solicitanteId: "",
  paisId: "",
  producto: "",
  creticidad: "A",
  descripcion: "",
  descripcionDetallada: "",
  alertaActiva: true,
  tipoAnticipacionAlerta: "DIAS",
  valorAnticipacionAlerta: 1,
};

function FieldGroup({ label, required, hint, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#475569",
          letterSpacing: "0.02em",
        }}
      >
        {label}
        {required && <span style={{ color: "#dc2626", marginLeft: 4 }}>*</span>}
      </label>

      {children}

      {hint && !error && (
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{hint}</p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: "#dc2626" }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle = (hasError) => ({
  padding: "11px 13px",
  border: `1px solid ${hasError ? "#ef4444" : "#dbe2ea"}`,
  borderRadius: 10,
  fontSize: 14,
  color: "#0f172a",
  background: "#ffffff",
  outline: "none",
  width: "100%",
  transition: "all 0.15s ease",
  fontFamily: "inherit",
  boxSizing: "border-box",
});

const selectStyle = (hasError) => ({
  ...inputStyle(hasError),
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23647569' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 34,
  cursor: "pointer",
});

function Section({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #eef2f7",
          background: "#f8fafc",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#334155",
          }}
        >
          {title}
        </p>
      </div>

      <div
        style={{
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ModalCrearGuiaMantenimiento({
  isOpen,
  onClose,
  onCreated,
}) {
  const [equipos, setEquipos] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(INITIAL_FORM);

  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...INITIAL_FORM, solicitanteId: user?.id || "" });
    setErrors({});
    equipoService.getEquipos().then(setEquipos).catch(console.error);
  }, [isOpen, user]);

  useEffect(() => {
    if (!form.equipoId) {
      setPlanes([]);
      return;
    }

    planMantenimientoService
      .getPlanesByEquipo(form.equipoId)
      .then(setPlanes)
      .catch(console.error);

    const eq = equipos.find((e) => e.id === form.equipoId);
    if (eq) {
      setForm((f) => ({
        ...f,
        ordenVenta: eq.numeroOV || "",
        producto: eq.nombre || "",
        creticidad: eq.creticidad || "A",
        paisId: eq.paisId || f.paisId,
      }));
    }
  }, [form.equipoId, equipos]);

  if (!isOpen) return null;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };

  const validate = () => {
    const e = {};

    if (form.tipoReferencia === "equipo" && !form.equipoId) {
      e.equipoId = "Selecciona un equipo";
    }

    if (form.tipoReferencia === "ubicacion" && !form.ubicacionTecnicaId) {
      e.ubicacionTecnicaId = "Indica la ubicación técnica";
    }

    if (!form.planMantenimientoId) e.planMantenimientoId = "Selecciona un plan";
    if (!form.periodo) e.periodo = "Selecciona un periodo";
    if (!form.ordenVenta.trim()) e.ordenVenta = "La orden de venta es obligatoria";
    if (!form.fechaInicioAlerta) e.fechaInicioAlerta = "La fecha de inicio es obligatoria";
    if (!form.solicitanteId.trim()) e.solicitanteId = "El ID del solicitante es obligatorio";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria";

    if (form.alertaActiva) {
      if (!form.tipoAnticipacionAlerta) {
        e.tipoAnticipacionAlerta = "Selecciona el tipo de anticipación";
      }

      const valor = Number(form.valorAnticipacionAlerta);
      if (!Number.isFinite(valor) || valor <= 0) {
        e.valorAnticipacionAlerta = "Ingresa un valor mayor a 0";
      }
    }

    if (form.tipoReferencia === "ubicacion") {
      if (!form.producto.trim()) e.producto = "El producto es obligatorio";
      if (!form.paisId.trim()) e.paisId = "El país es obligatorio";
    }

    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        planMantenimientoId: form.planMantenimientoId,
        periodo: form.periodo,
        periodoActivo: form.periodoActivo,
        ordenVenta: form.ordenVenta.trim(),
        fechaInicioAlerta: new Date(form.fechaInicioAlerta).toISOString(),
        solicitanteId: form.solicitanteId.trim(),
        descripcion: form.descripcion.trim(),
        descripcionDetallada: form.descripcionDetallada.trim() || null,
        alertaActiva: form.alertaActiva,
        tipoAnticipacionAlerta: form.alertaActiva
          ? form.tipoAnticipacionAlerta
          : null,
        valorAnticipacionAlerta: form.alertaActiva
          ? Number(form.valorAnticipacionAlerta)
          : null,
      };

      if (form.tipoReferencia === "equipo") {
        payload.equipoId = form.equipoId;
      } else {
        payload.ubicacionTecnicaId = form.ubicacionTecnicaId.trim();
        payload.creticidad = form.creticidad;
        payload.producto = form.producto.trim();
        payload.paisId = form.paisId.trim();
      }

      await guiaMantenimientoService.createGuia(payload);
      onCreated();
      onClose();
    } catch (err) {
      setErrors({
        global: err.response?.data?.error || err.message || "Error al crear",
      });
    } finally {
      setLoading(false);
    }
  };

  const isUbicacion = form.tipoReferencia === "ubicacion";
  const numeroAlertaPreview = form.ordenVenta
    ? `${form.ordenVenta}AL###`
    : "OV-XXXXAL001";

  return (
    <>
      <style>{`
        .gmm-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.10);
        }

        @keyframes gmmIn {
          from { opacity: 0; transform: translateY(16px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(15,23,42,0.58)",
          backdropFilter: "blur(3px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#f8fafc",
            borderRadius: 18,
            width: "100%",
            maxWidth: 860,
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
            animation: "gmmIn 0.22s ease",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              padding: "22px 26px 18px",
              background: "#ffffff",
              borderBottom: "1px solid #e5e7eb",
              borderRadius: "18px 18px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.04em",
                }}
              >
                MANTENIMIENTO PREVENTIVO
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Nueva Guía de Mantenimiento
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Completa los datos principales para registrar una nueva guía.
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "#f8fafc",
                border: "1px solid #dbe2ea",
                color: "#475569",
                width: 34,
                height: 34,
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              padding: "24px 26px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {errors.global && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#b91c1c",
                }}
              >
                {errors.global}
              </div>
            )}

            <Section title="Referencia del mantenimiento">
              <FieldGroup label="Tipo de referencia" required>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    ["equipo", "Equipo"],
                    ["ubicacion", "Ubicación Técnica"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("tipoReferencia", v)}
                      style={{
                        flex: 1,
                        padding: "11px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        border:
                          form.tipoReferencia === v
                            ? "1px solid #2563eb"
                            : "1px solid #dbe2ea",
                        background:
                          form.tipoReferencia === v ? "#eff6ff" : "#ffffff",
                        color:
                          form.tipoReferencia === v ? "#1d4ed8" : "#475569",
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </FieldGroup>

              {!isUbicacion && (
                <FieldGroup label="Equipo" required error={errors.equipoId}>
                  <select
                    name="equipoId"
                    value={form.equipoId}
                    onChange={handleChange}
                    className="gmm-input"
                    style={selectStyle(!!errors.equipoId)}
                  >
                    <option value="">— Selecciona un equipo —</option>
                    {equipos.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre} ({e.codigo})
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              )}

              {isUbicacion && (
                <FieldGroup
                  label="Ubicación Técnica (UUID)"
                  required
                  error={errors.ubicacionTecnicaId}
                >
                  <input
                    name="ubicacionTecnicaId"
                    value={form.ubicacionTecnicaId}
                    onChange={handleChange}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="gmm-input"
                    style={inputStyle(!!errors.ubicacionTecnicaId)}
                  />
                </FieldGroup>
              )}

              <FieldGroup
                label="Plan de mantenimiento"
                required
                error={errors.planMantenimientoId}
                hint={!form.equipoId && !isUbicacion ? "Selecciona primero un equipo" : undefined}
              >
                <select
                  name="planMantenimientoId"
                  value={form.planMantenimientoId}
                  onChange={handleChange}
                  disabled={!form.equipoId && !isUbicacion}
                  className="gmm-input"
                  style={{
                    ...selectStyle(!!errors.planMantenimientoId),
                    opacity: !form.equipoId && !isUbicacion ? 0.6 : 1,
                    background: !form.equipoId && !isUbicacion ? "#f8fafc" : "#fff",
                  }}
                >
                  <option value="">— Selecciona un plan —</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · {p.frecuencia}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </Section>

            <Section title="Identificación">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <FieldGroup label="Orden de venta" required error={errors.ordenVenta}>
                  <input
                    name="ordenVenta"
                    value={form.ordenVenta}
                    onChange={handleChange}
                    placeholder="OV-XXXX"
                    className="gmm-input"
                    style={inputStyle(!!errors.ordenVenta)}
                  />
                </FieldGroup>

                <FieldGroup label="N° Alerta" hint="Se genera automáticamente">
                  <div
                    style={{
                      ...inputStyle(false),
                      background: "#f8fafc",
                      color: "#64748b",
                      fontFamily: "monospace",
                      display: "flex",
                      alignItems: "center",
                      minHeight: 44,
                    }}
                  >
                    <span>{numeroAlertaPreview}</span>
                  </div>
                </FieldGroup>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: 16,
                }}
              >
                <FieldGroup
                  label="Producto"
                  required={isUbicacion}
                  error={errors.producto}
                  hint={!isUbicacion ? "Cargado desde el equipo seleccionado" : undefined}
                >
                  <input
                    name="producto"
                    value={form.producto}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    className="gmm-input"
                    style={{
                      ...inputStyle(!!errors.producto),
                      background: !isUbicacion ? "#f8fafc" : "#fff",
                      color: !isUbicacion ? "#64748b" : "#0f172a",
                    }}
                    readOnly={!isUbicacion}
                  />
                </FieldGroup>

                <FieldGroup
                  label="Criticidad"
                  hint={!isUbicacion ? "Tomada del equipo" : undefined}
                >
                  <select
                    name="creticidad"
                    value={form.creticidad}
                    onChange={handleChange}
                    disabled={!isUbicacion}
                    className="gmm-input"
                    style={{
                      ...selectStyle(false),
                      background: !isUbicacion ? "#f8fafc" : "#fff",
                      opacity: !isUbicacion ? 0.7 : 1,
                    }}
                  >
                    <option value="A">A — Crítica</option>
                    <option value="B">B — Media</option>
                    <option value="C">C — Baja</option>
                  </select>
                </FieldGroup>
              </div>

              {isUbicacion && (
                <FieldGroup label="País (UUID)" required error={errors.paisId}>
                  <input
                    name="paisId"
                    value={form.paisId}
                    onChange={handleChange}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="gmm-input"
                    style={inputStyle(!!errors.paisId)}
                  />
                </FieldGroup>
              )}
            </Section>

            <Section title="Periodo y fechas">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <FieldGroup label="Periodo de la guía" required error={errors.periodo}>
                  <select
                    name="periodo"
                    value={form.periodo}
                    onChange={handleChange}
                    className="gmm-input"
                    style={selectStyle(!!errors.periodo)}
                  >
                    {PERIODOS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </FieldGroup>

                <FieldGroup
                  label="Fecha inicio de alerta"
                  required
                  error={errors.fechaInicioAlerta}
                >
                  <input
                    type="datetime-local"
                    name="fechaInicioAlerta"
                    value={form.fechaInicioAlerta}
                    onChange={handleChange}
                    className="gmm-input"
                    style={inputStyle(!!errors.fechaInicioAlerta)}
                  />
                </FieldGroup>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    Periodo activo
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    Define si el periodo de mantenimiento está vigente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => set("periodoActivo", !form.periodoActivo)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    background: form.periodoActivo ? "#22c55e" : "#cbd5e1",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: form.periodoActivo ? 25 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                    }}
                  />
                </button>
              </div>
            </Section>

            <Section title="Configuración de alerta">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    Alerta activa
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    Permite calcular la anticipación antes de la fecha programada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => set("alertaActiva", !form.alertaActiva)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    background: form.alertaActiva ? "#22c55e" : "#cbd5e1",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: form.alertaActiva ? 25 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                    }}
                  />
                </button>
              </div>

              {form.alertaActiva && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <FieldGroup
                    label="Tipo de anticipación"
                    required
                    error={errors.tipoAnticipacionAlerta}
                  >
                    <select
                      name="tipoAnticipacionAlerta"
                      value={form.tipoAnticipacionAlerta}
                      onChange={handleChange}
                      className="gmm-input"
                      style={selectStyle(!!errors.tipoAnticipacionAlerta)}
                    >
                      {TIPOS_ANTICIPACION.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </FieldGroup>

                  <FieldGroup
                    label="Valor de anticipación"
                    required
                    error={errors.valorAnticipacionAlerta}
                  >
                    <input
                      type="number"
                      min="1"
                      name="valorAnticipacionAlerta"
                      value={form.valorAnticipacionAlerta}
                      onChange={handleChange}
                      className="gmm-input"
                      style={inputStyle(!!errors.valorAnticipacionAlerta)}
                      placeholder="Ej: 1"
                    />
                  </FieldGroup>
                </div>
              )}
            </Section>

            <Section title="Solicitante">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: "#475569",
                    flexShrink: 0,
                  }}
                >
                  👤
                </div>

                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {user?.nombre || user?.name || "Usuario actual"}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "#64748b",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {user?.id || "—"}
                  </p>
                </div>

                <span
                  style={{
                    marginLeft: "auto",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  AUTO
                </span>
              </div>
            </Section>

            <Section title="Descripción">
              <FieldGroup label="Descripción" required error={errors.descripcion}>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción breve de la guía"
                  className="gmm-input"
                  style={inputStyle(!!errors.descripcion)}
                />
              </FieldGroup>

              <FieldGroup label="Descripción detallada" hint="Opcional">
                <textarea
                  name="descripcionDetallada"
                  value={form.descripcionDetallada}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Instrucciones adicionales, observaciones..."
                  className="gmm-input"
                  style={{
                    ...inputStyle(false),
                    resize: "vertical",
                    minHeight: 96,
                    fontFamily: "inherit",
                  }}
                />
              </FieldGroup>
            </Section>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                paddingTop: 4,
              }}
            >
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  background: "#ffffff",
                  color: "#475569",
                  border: "1px solid #dbe2ea",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  minWidth: 230,
                  padding: "12px 20px",
                  background: loading ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creando guía..." : "Crear guía de mantenimiento"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}