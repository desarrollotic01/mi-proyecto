import { useEffect, useState } from "react";
import {
  X, Save, ShoppingCart, Settings, Users, Search,
  CheckCircle, User, Briefcase, Wrench, AlertCircle, FileText, Package
} from "lucide-react";

import { createTratamiento } from "../../features/mantenimiento/services/tratamientoService";
import { getTrabajadores } from "../../features/mantenimiento/services/trabajadoresService";
import { equipoService } from "../../features/mantenimiento/services/equipoService";
import ModalSolicitudCompra from "./ModalSolicitudCompra";
import ModalConfiguracionCampos from "./ModalConfiguracionTratamiento";
import { CAMPOS_AVISO } from "./camposAviso";

export default function ModalTratamiento({ isOpen, aviso, onClose, onSuccess }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSolicitud, setShowSolicitud] = useState(false);
  const [showConfigCampos, setShowConfigCampos] = useState(false);
  const [solicitudCompra, setSolicitudCompra] = useState(null);

  const [data, setData] = useState({
    contratista: "",
    requerimientos: [
      { rol: "tecnico_electrico", label: "Técnico Eléctrico", cantidad: 0, personas: [], search: "", icon: Wrench, color: "blue" },
      { rol: "operario_de_mantenimiento", label: "Operario Mantenimiento", cantidad: 0, personas: [], search: "", icon: Settings, color: "green" },
      { rol: "tecnico_mecanico", label: "Técnico Mecánico", cantidad: 0, personas: [], search: "", icon: Briefcase, color: "purple" },
    ],
  });

  useEffect(() => {
    if (!isOpen) return;
    
    // Cargar trabajadores y equipos
    Promise.all([
      getTrabajadores({ activo: true }),
      equipoService.getEquipos()
    ]).then(([trabajadoresData, equiposData]) => {
      setTrabajadores(trabajadoresData);
      setEquipos(equiposData);
    });
  }, [isOpen]);

  const updateReq = (i, changes) => {
    const reqs = [...data.requerimientos];
    reqs[i] = { ...reqs[i], ...changes };
    if (changes.cantidad !== undefined) {
      reqs[i].personas = reqs[i].personas.slice(0, changes.cantidad);
    }
    setData({ ...data, requerimientos: reqs });
  };

  const togglePersona = (i, persona) => {
    const r = data.requerimientos[i];
    const exists = r.personas.some(p => p.id === persona.id);
    if (!exists && r.personas.length >= r.cantidad) return;
    updateReq(i, {
      personas: exists
        ? r.personas.filter(p => p.id !== persona.id)
        : [...r.personas, persona],
    });
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
      await createTratamiento(aviso.id, {
        tratamiento: {
          contratista: data.contratista,
          requerimientos: data.requerimientos
            .filter(r => r.cantidad > 0)
            .map(r => ({
              rol: r.rol,
              label: r.label,
              cantidad: r.cantidad,
              personas: r.personas.map(p => p.id),
            })),
        },
        solicitudCompra,
      });
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Función helper para obtener el equipo completo por ID
  const getEquipoInfo = (equipoId) => {
    const equipo = equipos.find(e => e.id === equipoId);
    return equipo || { nombre: equipoId, tag: equipoId };
  };

  if (!isOpen || !aviso) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-7xl h-[94vh] rounded-3xl shadow-2xl flex flex-col">

          {/* HEADER */}
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-indigo-600 rounded-xl">
                <FileText className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Tratamiento del Aviso</h2>
                <p className="text-sm text-gray-600">Aviso #{aviso.numeroAviso}</p>
              </div>
            </div>
            <button onClick={onClose}><X /></button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">

            {/* AVISO PREMIUM */}
            <Section title="🧾 Información del Aviso">
              <Grid>
                {Object.entries(CAMPOS_AVISO).map(([key, label]) => (
                  aviso[key] && <Info key={key} label={label} value={aviso[key]} />
                ))}
              </Grid>

              {aviso.descripcion && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Descripción</p>
                  <p className="text-sm text-gray-800">{aviso.descripcion}</p>
                </div>
              )}

              {aviso.equiposRelacion?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Equipos Asociados</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aviso.equiposRelacion.map(e => {
                      const equipoInfo = getEquipoInfo(e.equipoId);
                      return (
                        <div 
                          key={e.id} 
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl hover:shadow-md transition-all"
                        >
                          <div className="p-2 bg-indigo-600 rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {equipoInfo.nombre || equipoInfo.tag || 'Sin nombre'}
                            </p>
                            {equipoInfo.tag && equipoInfo.nombre && (
                              <p className="text-xs text-indigo-600 font-medium">
                                TAG: {equipoInfo.tag}
                              </p>
                            )}
                            {equipoInfo.ubicacion && (
                              <p className="text-xs text-gray-500">
                                📍 {equipoInfo.ubicacion}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* CONTRATISTA */}
            <Section title="👷 Contratista">
              <input
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="Nombre del contratista"
                value={data.contratista}
                onChange={(e) => setData({ ...data, contratista: e.target.value })}
              />
            </Section>

            {/* REQUERIMIENTOS */}
            <Section title="👥 Requerimientos de Personal">
              {data.requerimientos.map((r, i) => {
                const lista = trabajadores.filter(t =>
                  t.rol === r.rol && t.nombre.toLowerCase().includes(r.search.toLowerCase())
                );
                const Icon = r.icon;

                return (
                  <div key={r.rol} className="border rounded-xl p-5 bg-slate-50 mb-4">
                    <div className="flex justify-between mb-3">
                      <div className="flex gap-2 items-center">
                        <Icon />
                        <strong>{r.label}</strong>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={r.cantidad}
                        onChange={e => updateReq(i, { cantidad: +e.target.value })}
                        className="w-20 border rounded-lg px-2"
                      />
                    </div>

                    {r.cantidad > 0 && (
                      <>
                        <input
                          className="w-full mb-3 border rounded-lg px-3 py-2"
                          placeholder="Buscar trabajador..."
                          value={r.search}
                          onChange={e => updateReq(i, { search: e.target.value })}
                        />

                        <div className="flex flex-wrap gap-2">
                          {lista.map(t => {
                            const selected = r.personas.some(p => p.id === t.id);
                            return (
                              <button
                                key={t.id}
                                onClick={() => togglePersona(i, t)}
                                className={`px-3 py-2 rounded-lg border text-sm ${
                                  selected ? "bg-indigo-100 border-indigo-300" : "bg-white"
                                }`}
                              >
                                {selected && <CheckCircle className="inline w-4 mr-1" />}
                                {t.nombre}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </Section>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <button onClick={onClose} className="px-6 py-3 border rounded-xl">Cancelar</button>
            <div className="flex gap-3">
              <button onClick={() => setShowSolicitud(true)} className="px-6 py-3 border rounded-xl">
                <ShoppingCart className="inline w-4 mr-1" /> Solicitud de Compra
              </button>
              <button onClick={handleGuardar} disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl">
                <Save className="inline w-4 mr-1" />
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalSolicitudCompra
        isOpen={showSolicitud}
        onClose={() => setShowSolicitud(false)}
        onConfirm={(d) => { setSolicitudCompra(d); setShowSolicitud(false); }}
      />

      <ModalConfiguracionCampos
        isOpen={showConfigCampos}
        onClose={() => setShowConfigCampos(false)}
      />
    </>
  );
}

/* ===== UI helpers ===== */

function Section({ title, children }) {
  return (
    <div className="bg-white border rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 border rounded-xl p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}