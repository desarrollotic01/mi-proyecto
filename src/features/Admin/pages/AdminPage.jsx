import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Users, Shield, Key, Wifi, Plus, Pencil, Trash2, X, Check, RefreshCw, FileSpreadsheet } from "lucide-react";
import {
  getUsuarios, createUsuario, updateUsuario, deleteUsuario, getConectados,
  getRoles, createRol, updateRol, deleteRol,
  getPermisos, createPermiso, deletePermiso,
} from "../services/adminService";

// ─── TABS ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "permisos", label: "Permisos", icon: Key },
  { id: "conectados", label: "Conectados", icon: Wifi },
];

// ─── MODAL GENÉRICO ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── TAB: USUARIOS ──────────────────────────────────────────────────────────
function TabUsuarios({ roles }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | { id, data }
  const [form, setForm] = useState({ usuario: "", contraseña: "", correo: "", id_rol: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsuarios(1, 50, search);
      setUsuarios(res.data?.data || []);
    } catch { setUsuarios([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ usuario: "", contraseña: "", correo: "", id_rol: roles[0]?.id || "" });
    setError("");
    setModal("create");
  };

  const openEdit = (u) => {
    setForm({ correo: u.correo, id_rol: u.id_rol || "" });
    setError("");
    setModal({ id: u.id, data: u });
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      if (modal === "create") {
        await createUsuario(form);
      } else {
        await updateUsuario(modal.id, { correo: form.correo, id_rol: form.id_rol });
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e.response?.data?.data?.[0] || e.response?.data?.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try { await deleteUsuario(id); load(); } catch { alert("Error al eliminar"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="text" placeholder="Buscar usuario o correo..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => {
            const data = usuarios.map(u => ({
              Usuario: u.usuario || "",
              Correo: u.correo || "",
              "Nombre y Apellido": u.nombreApellido || "",
              Rol: u.rol?.nombre || "Sin rol",
              Estado: u.state ? "Activo" : "Inactivo",
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
            XLSX.writeFile(wb, `Usuarios_${new Date().toISOString().slice(0,10)}.xlsx`);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <FileSpreadsheet size={16} /> Exportar Excel
        </button>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {loading ? <p className="text-slate-500 text-sm text-center py-8">Cargando...</p> : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{u.usuario}</td>
                  <td className="px-4 py-3 text-slate-600">{u.correo}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {u.rol?.nombre || "Sin rol"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.state ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.state ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Sin usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Nuevo usuario" : "Editar usuario"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {modal === "create" && (
              <>
                <Field label="Usuario" value={form.usuario} onChange={v => setForm(p => ({ ...p, usuario: v }))} placeholder="min 4 caracteres" />
                <Field label="Contraseña" value={form.contraseña} onChange={v => setForm(p => ({ ...p, contraseña: v }))} type="password" placeholder="min 6 caracteres con letras y números" />
              </>
            )}
            <Field label="Correo" value={form.correo} onChange={v => setForm(p => ({ ...p, correo: v }))} type="email" placeholder="correo@empresa.com" />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol</label>
              <select value={form.id_rol} onChange={e => setForm(p => ({ ...p, id_rol: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Sin rol</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: ROLES ─────────────────────────────────────────────────────────────
function TabRoles({ permisos, onRolesChange }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", permisos: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRoles();
      setRoles(res.data || []);
      onRolesChange?.(res.data || []);
    } catch { setRoles([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ nombre: "", descripcion: "", permisos: [] });
    setError(""); setModal("create");
  };

  const openEdit = (r) => {
    setForm({ nombre: r.nombre, descripcion: r.descripcion || "", permisos: r.permisos?.map(p => p.id) || [] });
    setError(""); setModal({ id: r.id });
  };

  const togglePermiso = (id) => {
    setForm(p => ({
      ...p,
      permisos: p.permisos.includes(id) ? p.permisos.filter(x => x !== id) : [...p.permisos, id]
    }));
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      if (modal === "create") {
        await createRol({ nombre: form.nombre, descripcion: form.descripcion, permisos: form.permisos });
      } else {
        await updateRol(modal.id, { nombre: form.nombre, descripcion: form.descripcion, permisos: form.permisos });
      }
      setModal(null); load();
    } catch (e) {
      setError(e.response?.data?.errors?.[0] || e.response?.data?.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este rol?")) return;
    try { await deleteRol(id); load(); } catch { alert("Error al eliminar"); }
  };

  // Agrupar permisos por recurso
  const permisosAgrupados = permisos.reduce((acc, p) => {
    const [accion, ...recurso] = p.nombre.split("_");
    const key = recurso.join("_") || accion;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Nuevo rol
        </button>
      </div>

      {loading ? <p className="text-slate-500 text-sm text-center py-8">Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(r => (
            <div key={r.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{r.nombre}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{r.descripcion || "Sin descripción"}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.permisos?.slice(0, 6).map(p => (
                  <span key={p.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{p.nombre}</span>
                ))}
                {r.permisos?.length > 6 && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">+{r.permisos.length - 6} más</span>
                )}
                {(!r.permisos || r.permisos.length === 0) && (
                  <span className="text-xs text-slate-400 italic">Sin permisos</span>
                )}
              </div>
            </div>
          ))}
          {roles.length === 0 && <p className="text-slate-400 text-center py-8 col-span-2">Sin roles creados</p>}
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Nuevo rol" : "Editar rol"} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <Field label="Nombre del rol" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Ej: Operador" />
            <Field label="Descripción" value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} placeholder="Describe el rol..." />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Permisos asignados</label>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {Object.entries(permisosAgrupados).map(([recurso, perms]) => (
                  <div key={recurso}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{recurso.replace(/_/g, " ")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={form.permisos.includes(p.id)}
                            onChange={() => togglePermiso(p.id)}
                            className="w-4 h-4 rounded accent-blue-600"
                          />
                          <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                            {p.nombre.split("_")[0]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {permisos.length === 0 && <p className="text-slate-400 text-sm italic">No hay permisos disponibles</p>}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-500">{form.permisos.length} permisos seleccionados</span>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: PERMISOS ──────────────────────────────────────────────────────────
function TabPermisos({ onPermisosChange }) {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPermisos();
      setPermisos(res.data || []);
      onPermisosChange?.(res.data || []);
    } catch { setPermisos([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await createPermiso(form);
      setModal(false); load();
    } catch (e) {
      setError(e.response?.data?.errors?.[0] || "Error al crear permiso");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este permiso?")) return;
    try { await deletePermiso(id); load(); } catch { alert("Error al eliminar"); }
  };

  // Agrupar por recurso
  const grupos = permisos.reduce((acc, p) => {
    const partes = p.nombre.split("_");
    const recurso = partes.slice(1).join("_") || partes[0];
    if (!acc[recurso]) acc[recurso] = [];
    acc[recurso].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setForm({ nombre: "", descripcion: "" }); setError(""); setModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Nuevo permiso
        </button>
      </div>

      {loading ? <p className="text-slate-500 text-sm text-center py-8">Cargando...</p> : (
        <div className="space-y-6">
          {Object.entries(grupos).map(([recurso, perms]) => (
            <div key={recurso}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {recurso.replace(/_/g, " ")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map(p => (
                  <div key={p.id} className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-500">{p.descripcion}</p>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="ml-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {permisos.length === 0 && <p className="text-slate-400 text-center py-8">Sin permisos. Ejecuta el seed primero.</p>}
        </div>
      )}

      {modal && (
        <Modal title="Nuevo permiso" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Nombre del permiso" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Ej: read_reportes" />
            <Field label="Descripción" value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} placeholder="Describe para qué sirve..." />
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Crear
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: CONECTADOS ────────────────────────────────────────────────────────
function TabConectados() {
  const [conectados, setConectados] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConectados();
      setConectados(res.data || []);
    } catch { setConectados([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-600">
            {conectados.length} usuario{conectados.length !== 1 ? "s" : ""} en línea
          </span>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      {loading && conectados.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {conectados.map((c, i) => (
            <div key={i} className="border border-green-200 bg-green-50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-700 text-sm">
                  {c.alias?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{c.alias}</p>
                  <p className="text-xs text-slate-500">
                    Conectado {new Date(c.connectedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {conectados.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <Wifi size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">Nadie conectado actualmente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── INPUT FIELD ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
      />
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Panel de Administración</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona usuarios, roles y permisos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600 bg-blue-50"
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === "conectados" && (
                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">LIVE</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === "usuarios" && <TabUsuarios roles={roles} />}
        {activeTab === "roles" && <TabRoles permisos={permisos} onRolesChange={setRoles} />}
        {activeTab === "permisos" && <TabPermisos onPermisosChange={setPermisos} />}
        {activeTab === "conectados" && <TabConectados />}
      </div>
    </div>
  );
}
