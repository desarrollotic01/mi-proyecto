import { useEffect, useState } from "react";
import { guiaMantenimientoService } from "../services/guiaMantenimientoService";
import { equipoService } from "../../mantenimiento/services/equipoService";
import { planMantenimientoService } from "../../PlanMantenimiento/services/planMantenimientoService";
import { useAuth } from "../../../auth/context/AuthContext";

const PERIODOS = [
  { value: "DIARIO",      label: "Diario" },
  { value: "SEMANAL",     label: "Semanal" },
  { value: "MENSUAL",     label: "Mensual" },
  { value: "BIMESTRAL",   label: "Bimestral" },
  { value: "TRIMESTRAL",  label: "Trimestral" },
  { value: "SEIS_MESES",  label: "6 Meses" },
  { value: "ANUAL",       label: "Anual" },
  { value: "CINCO_ANIOS", label: "5 Años" },
  { value: "DIEZ_ANIOS",  label: "10 Años" },
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
};

function FieldGroup({ label, required, hint, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.07em" }}>
        {label.toUpperCase()}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{hint}</p>}
      {error && <p style={{ margin: 0, fontSize: 11, color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError) => ({
  padding: "9px 12px",
  border: `1.5px solid ${hasError ? "#ef4444" : "#e2e8f0"}`,
  borderRadius: 8, fontSize: 13, color: "#1e293b",
  background: "#fff", outline: "none", width: "100%",
  transition: "border-color 0.15s", fontFamily: "inherit",
  boxSizing: "border-box",
});

const selectStyle = (hasError) => ({
  ...inputStyle(hasError),
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32, cursor: "pointer",
});

function Section({ title, icon, children }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.05em" }}>
          {title.toUpperCase()}
        </p>
      </div>
      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

export default function ModalCrearGuiaMantenimiento({ isOpen, onClose, onCreated }) {
  const [equipos, setEquipos] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(INITIAL_FORM);

  const { user } = useAuth();


  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setErrors({});
    equipoService.getEquipos().then(setEquipos).catch(console.error);
  }, [isOpen]);

  useEffect(() => {
  if (!isOpen) return;
  setForm({ ...INITIAL_FORM, solicitanteId: user?.id || "" }); // ← auto-fill
  setErrors({});
  equipoService.getEquipos().then(setEquipos).catch(console.error);
}, [isOpen, user]);

  useEffect(() => {
    if (!form.equipoId) { setPlanes([]); return; }
    planMantenimientoService.getPlanesByEquipo(form.equipoId).then(setPlanes).catch(console.error);
    const eq = equipos.find(e => e.id === form.equipoId);
    if (eq) {
      setForm(f => ({
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
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: undefined }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };

  const validate = () => {
    const e = {};
    if (form.tipoReferencia === "equipo" && !form.equipoId)
      e.equipoId = "Selecciona un equipo";
    if (form.tipoReferencia === "ubicacion" && !form.ubicacionTecnicaId)
      e.ubicacionTecnicaId = "Indica la ubicación técnica (UUID)";
    if (!form.planMantenimientoId) e.planMantenimientoId = "Selecciona un plan";
    if (!form.periodo) e.periodo = "Selecciona un periodo";
    if (!form.ordenVenta.trim()) e.ordenVenta = "La orden de venta es obligatoria";
    if (!form.fechaInicioAlerta) e.fechaInicioAlerta = "La fecha de inicio es obligatoria";
    if (!form.solicitanteId.trim()) e.solicitanteId = "El ID del solicitante es obligatorio";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
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
      setErrors({ global: err.response?.data?.error || err.message || "Error al crear" });
    } finally {
      setLoading(false);
    }
  };

  const isUbicacion = form.tipoReferencia === "ubicacion";
  const numeroAlertaPreview = form.ordenVenta ? `${form.ordenVenta}AL###` : "OV-XXXXAL001";

  return (
    <>
      <style>{`
        .gmm-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        @keyframes gmmIn { from { opacity:0; transform:translateY(16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(15,23,42,0.72)", backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:620, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.28)", animation:"gmmIn 0.22s ease" }}>

          {/* Header */}
          <div style={{ padding:"22px 26px 18px", background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:"0.14em", margin:"0 0 4px" }}>MANTENIMIENTO PREVENTIVO</p>
              <h2 style={{ color:"#fff", margin:0, fontSize:19, fontWeight:700 }}>Nueva Guía de Mantenimiento</h2>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", width:30, height:30, borderRadius:7, cursor:"pointer", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>

          <div style={{ padding:"22px 26px", display:"flex", flexDirection:"column", gap:18 }}>

            {errors.global && (
              <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
                ⚠ {errors.global}
              </div>
            )}

            {/* SECCIÓN 1: REFERENCIA */}
            <Section title="Referencia del Mantenimiento" icon="🔧">
              <FieldGroup label="Tipo de referencia" required>
                <div style={{ display:"flex", gap:8 }}>
                  {[["equipo","🖥 Equipo"],["ubicacion","📍 Ubicación Técnica"]].map(([v,l]) => (
                    <button key={v} onClick={() => set("tipoReferencia", v)} style={{
                      flex:1, padding:"9px 0", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                      border: form.tipoReferencia===v ? "none" : "1.5px solid #e2e8f0",
                      background: form.tipoReferencia===v ? "#0f172a" : "#f8fafc",
                      color: form.tipoReferencia===v ? "#fff" : "#64748b",
                      transition:"all 0.18s",
                    }}>{l}</button>
                  ))}
                </div>
              </FieldGroup>

              {!isUbicacion && (
                <FieldGroup label="Equipo" required error={errors.equipoId}>
                  <select name="equipoId" value={form.equipoId} onChange={handleChange} className="gmm-input" style={selectStyle(!!errors.equipoId)}>
                    <option value="">— Selecciona un equipo —</option>
                    {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.codigo})</option>)}
                  </select>
                </FieldGroup>
              )}

              {isUbicacion && (
                <FieldGroup label="Ubicación Técnica (UUID)" required error={errors.ubicacionTecnicaId}>
                  <input name="ubicacionTecnicaId" value={form.ubicacionTecnicaId} onChange={handleChange} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="gmm-input" style={inputStyle(!!errors.ubicacionTecnicaId)} />
                </FieldGroup>
              )}

              <FieldGroup label="Plan de Mantenimiento" required error={errors.planMantenimientoId} hint={!form.equipoId && !isUbicacion ? "Selecciona primero un equipo" : undefined}>
                <select name="planMantenimientoId" value={form.planMantenimientoId} onChange={handleChange} disabled={!form.equipoId && !isUbicacion} className="gmm-input"
                  style={{ ...selectStyle(!!errors.planMantenimientoId), opacity:(!form.equipoId && !isUbicacion) ? 0.5 : 1 }}>
                  <option value="">— Selecciona un plan —</option>
                  {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.frecuencia}</option>)}
                </select>
              </FieldGroup>
            </Section>

            {/* SECCIÓN 2: IDENTIFICACIÓN */}
            <Section title="Identificación" icon="🏷">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <FieldGroup label="Orden de Venta" required error={errors.ordenVenta} hint="Ej: OV-1002">
                  <input name="ordenVenta" value={form.ordenVenta} onChange={handleChange} placeholder="OV-XXXX" className="gmm-input" style={inputStyle(!!errors.ordenVenta)} />
                </FieldGroup>

                <FieldGroup label="N° Alerta" hint="Correlativo generado automáticamente">
                  <div style={{ ...inputStyle(false), background:"#f8fafc", color:"#64748b", fontFamily:"monospace", display:"flex", alignItems:"center", gap:6 }}>
                    <span>{numeroAlertaPreview}</span>
                    <span style={{ marginLeft:"auto", fontSize:10, background:"#e2e8f0", padding:"2px 6px", borderRadius:4, fontFamily:"inherit", letterSpacing:0, color:"#64748b" }}>AUTO</span>
                  </div>
                </FieldGroup>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
                <FieldGroup label="Producto" hint={!isUbicacion ? "Cargado desde el equipo seleccionado" : undefined}>
                  <input name="producto" value={form.producto} onChange={handleChange} placeholder="Nombre del producto" className="gmm-input"
                    style={{ ...inputStyle(false), background:!isUbicacion ? "#f8fafc" : "#fff", color:!isUbicacion ? "#94a3b8" : "#1e293b" }}
                    readOnly={!isUbicacion} />
                </FieldGroup>

                <FieldGroup label="Criticidad" hint={!isUbicacion ? "Del equipo" : undefined}>
                  <select name="creticidad" value={form.creticidad} onChange={handleChange} disabled={!isUbicacion} className="gmm-input"
                    style={{ ...selectStyle(false), background:!isUbicacion ? "#f8fafc" : "#fff", opacity:!isUbicacion ? 0.65 : 1 }}>
                    <option value="A">A — Crítica</option>
                    <option value="B">B — Media</option>
                    <option value="C">C — Baja</option>
                  </select>
                </FieldGroup>
              </div>

              {isUbicacion && (
                <FieldGroup label="País (UUID)" required>
                  <input name="paisId" value={form.paisId} onChange={handleChange} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="gmm-input" style={inputStyle(false)} />
                </FieldGroup>
              )}
            </Section>

            {/* SECCIÓN 3: PERIODO Y FECHAS */}
            <Section title="Periodo y Fechas" icon="📅">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <FieldGroup label="Periodo de la Guía" required error={errors.periodo}>
                  <select name="periodo" value={form.periodo} onChange={handleChange} className="gmm-input" style={selectStyle(!!errors.periodo)}>
                    {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </FieldGroup>

                <FieldGroup label="Fecha Inicio de Alerta" required error={errors.fechaInicioAlerta}>
                  <input type="datetime-local" name="fechaInicioAlerta" value={form.fechaInicioAlerta} onChange={handleChange} className="gmm-input" style={inputStyle(!!errors.fechaInicioAlerta)} />
                </FieldGroup>
              </div>

              {/* Toggle periodoActivo */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#f8fafc", borderRadius:9, border:"1px solid #e2e8f0" }}>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1e293b" }}>Periodo Activo</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8" }}>Define si el periodo de mantenimiento está vigente</p>
                </div>
                <button onClick={() => set("periodoActivo", !form.periodoActivo)} style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", position:"relative", background:form.periodoActivo ? "#22c55e" : "#cbd5e1", transition:"background 0.2s" }}>
                  <span style={{ position:"absolute", top:3, left:form.periodoActivo ? 23 : 3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              </div>
            </Section>

            {/* SECCIÓN 4: SOLICITANTE */}
            <Section title="Solicitante" icon="👤">
  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#f8fafc", borderRadius:9, border:"1px solid #e2e8f0" }}>
    <div style={{ width:36, height:36, borderRadius:"50%", background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>👤</div>
    <div>
      <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1e293b" }}>{user?.nombre || user?.name || "Usuario actual"}</p>
      <p style={{ margin:"2px 0 0", fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{user?.id || "—"}</p>
    </div>
    <span style={{ marginLeft:"auto", background:"#dbeafe", color:"#1d4ed8", padding:"3px 8px", borderRadius:5, fontSize:11, fontWeight:700 }}>AUTO</span>
  </div>
</Section>
            {/* SECCIÓN 5: DESCRIPCIÓN */}
            <Section title="Descripción" icon="📝">
              <FieldGroup label="Descripción" required error={errors.descripcion}>
                <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción breve de la guía" className="gmm-input" style={inputStyle(!!errors.descripcion)} />
              </FieldGroup>
              <FieldGroup label="Descripción Detallada" hint="Opcional">
                <textarea name="descripcionDetallada" value={form.descripcionDetallada} onChange={handleChange} rows={3}
                  placeholder="Instrucciones adicionales, observaciones…" className="gmm-input"
                  style={{ ...inputStyle(false), resize:"vertical", minHeight:72, fontFamily:"inherit" }} />
              </FieldGroup>
            </Section>

            {/* ACTIONS */}
            <div style={{ display:"flex", gap:10, paddingTop:4 }}>
              <button onClick={handleSubmit} disabled={loading} style={{ flex:1, padding:"12px 0", background: loading ? "#93c5fd" : "#2563eb", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:loading ? "not-allowed" : "pointer", transition:"background 0.15s" }}>
                {loading ? "⏳ Creando guía…" : "✓ Crear Guía de Mantenimiento"}
              </button>
              <button onClick={onClose} disabled={loading} style={{ padding:"12px 20px", background:"#f8fafc", color:"#64748b", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}