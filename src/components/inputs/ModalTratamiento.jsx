import { useState } from "react";
import { personalRegistrado } from "../data";
import ModalSolicitudCompra from "./ModalSolicitudCompra";
import ModalConfiguracionCampos from "./ModalConfiguracionTratamiento";
import { CAMPOS_AVISO } from "./camposAviso";

/* =========================
   CONFIGURACIÓN POR DEFECTO
========================= */
const defaultOrder = Object.keys(CAMPOS_AVISO);

const defaultVisibility = {
  cliente: true,
  descripcion: true,
  ubicacionTecnica: true,
};

export default function ModalTratamiento({
  isOpen,
  aviso,
  onClose,
  onGuardar,
}) {
  if (!isOpen || !aviso) return null;

  /* ===== MODALES ===== */
  const [showSolicitud, setShowSolicitud] = useState(false);
  const [showConfigCampos, setShowConfigCampos] = useState(false);
  const [solicitudCompra, setSolicitudCompra] = useState(null);

  /* ===== CONFIGURACIÓN DE VISTA ===== */
  const [fieldsOrder, setFieldsOrder] = useState(defaultOrder);

  const [fieldsVisibility, setFieldsVisibility] = useState(() =>
    defaultOrder.reduce(
      (acc, key) => ({ ...acc, [key]: defaultVisibility[key] || false }),
      {}
    )
  );

  /* ===== TRATAMIENTO ===== */
  const [data, setData] = useState({
    contratista: "",
    requerimientos: [
      {
        rol: "electrico",
        label: "Técnico Eléctrico",
        cantidad: 0,
        personas: [],
        search: "",
      },
      {
        rol: "mantenimiento",
        label: "Operario Mantenimiento",
        cantidad: 0,
        personas: [],
        search: "",
      },
      {
        rol: "mecanico",
        label: "Técnico Mecánico",
        cantidad: 0,
        personas: [],
        search: "",
      },
    ],
  });

  /* ===== TRATAMIENTO HELPERS ===== */
  const updateReq = (i, changes) => {
    const copy = [...data.requerimientos];
    copy[i] = { ...copy[i], ...changes };
    setData({ ...data, requerimientos: copy });
  };

  const togglePersona = (i, persona) => {
    const r = data.requerimientos[i];
    const exists = r.personas.some((p) => p.id === persona.id);

    updateReq(i, {
      personas: exists
        ? r.personas.filter((p) => p.id !== persona.id)
        : [...r.personas, persona],
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-white w-[1000px] h-[650px] rounded-xl flex flex-col">

          {/* ===== HEADER ===== */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Tratamiento del Aviso</h2>
            <p className="text-sm text-gray-500">
              Aviso #{aviso.numeroAviso}
            </p>
          </div>

          {/* ===== BODY ===== */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-6">

            {/* ===== INFO AVISO ===== */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Información del Aviso</span>
                <button
                  onClick={() => setShowConfigCampos(true)}
                  className="text-xs text-blue-600 underline"
                >
                  Personalizar vista
                </button>
              </div>

              <div className="space-y-2">
                {fieldsOrder.map((key) => {
                  if (!fieldsVisibility[key]) return null;
                  if (!aviso[key]) return null;

                  return (
                    <Info
                      key={key}
                      label={CAMPOS_AVISO[key]}
                      value={aviso[key]}
                    />
                  );
                })}
              </div>
            </div>

            {/* ===== TRATAMIENTO ===== */}
            <div className="space-y-4">

              {/* CONTRATISTA */}
              <div>
                <label className="text-xs text-gray-500">Contratista</label>
                <input
                  className="border rounded px-3 py-2 text-sm w-full"
                  value={data.contratista}
                  onChange={(e) =>
                    setData({ ...data, contratista: e.target.value })
                  }
                />
              </div>

              {/* REQUERIMIENTOS */}
              {data.requerimientos.map((r, i) => {
                const lista = personalRegistrado[r.rol]
                  .filter((p) =>
                    p.nombre.toLowerCase().includes(r.search.toLowerCase())
                  )
                  .slice(0, 5);

                return (
                  <div key={r.rol} className="border rounded-lg p-3 space-y-2">

                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{r.label}</span>
                      <input
                        type="number"
                        min="0"
                        className="w-20 border rounded px-2 py-1 text-sm"
                        value={r.cantidad}
                        onChange={(e) =>
                          updateReq(i, {
                            cantidad: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    {r.cantidad > 0 && (
                      <>
                        <input
                          placeholder="Buscar persona..."
                          className="border rounded px-2 py-1 text-xs w-full"
                          value={r.search}
                          onChange={(e) =>
                            updateReq(i, { search: e.target.value })
                          }
                        />

                        <div className="flex flex-wrap gap-2">
                          {lista.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => togglePersona(i, p)}
                              className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                            >
                              {p.nombre}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="p-4 border-t flex justify-between items-center">

            <div className="flex items-center gap-3">
              {!solicitudCompra ? (
                <button
                  onClick={() => setShowSolicitud(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Crear Solicitud de Compra
                </button>
              ) : (
                <>
                  <span className="text-sm text-green-600 font-medium">
                    ✔ Solicitud creada
                  </span>
                  <button
                    onClick={() => setShowSolicitud(true)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={() =>
                  onGuardar({
                    tratamiento: data,
                    solicitudCompra,
                  })
                }
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Guardar Tratamiento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALES ===== */}
      <ModalSolicitudCompra
        isOpen={showSolicitud}
        onClose={() => setShowSolicitud(false)}
        onConfirm={(data) => {
          setSolicitudCompra(data);
          setShowSolicitud(false);
        }}
      />

      <ModalConfiguracionCampos
        isOpen={showConfigCampos}
        onClose={() => setShowConfigCampos(false)}
        fields={fieldsVisibility}
        setFields={setFieldsVisibility}
        order={fieldsOrder}
        setOrder={setFieldsOrder}
      />
    </>
  );
}

/* =========================
   INFO COMPONENT
========================= */
function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}
