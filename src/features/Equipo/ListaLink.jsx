import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Building2,
  MapPin,
  Package,
  AlertCircle,
  Paperclip,
} from "lucide-react";

import { portalClienteService } from "../mantenimiento/services/portalClienteService";
import AdjuntosEquipoModal from "./Components/AdjuntosEquipoModal";

export default function ListaLink() {
  const { token } = useParams();

  const [cliente, setCliente] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [equiposSinSede, setEquiposSinSede] = useState([]);
  const [ubicacionesTecnicasSinSede, setUbicacionesTecnicasSinSede] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [tabActiva, setTabActiva] = useState("");

  const [modalAdjuntosOpen, setModalAdjuntosOpen] = useState(false);
  const [equipoAdjuntosSeleccionado, setEquipoAdjuntosSeleccionado] = useState(null);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        setCargando(true);
        setError("");

        const data = await portalClienteService.obtenerAcceso(token);

        const sedesData = Array.isArray(data?.sedes) ? data.sedes : [];

        setCliente(data?.cliente || null);
        setSedes(sedesData);
        setEquiposSinSede(Array.isArray(data?.equiposSinSede) ? data.equiposSinSede : []);
        setUbicacionesTecnicasSinSede(
          Array.isArray(data?.ubicacionesTecnicasSinSede)
            ? data.ubicacionesTecnicasSinSede
            : []
        );

        if (sedesData.length > 0) {
          setTabActiva(`SEDE_${sedesData[0].id}`);
        } else {
          setTabActiva("EQUIPOS_SIN_SEDE");
        }
      } catch (err) {
        console.error("Fallo la conexión:", err);
        setError(
          err?.response?.data?.error || err?.response?.data?.message || "No se pudo cargar el portal del cliente."
        );
        setCliente(null);
        setSedes([]);
        setEquiposSinSede([]);
        setUbicacionesTecnicasSinSede([]);
      } finally {
        setCargando(false);
      }
    };

    if (token) {
      fetchPortal();
    }
  }, [token]);

  const abrirModalAdjuntos = (equipo) => {
    setEquipoAdjuntosSeleccionado(equipo);
    setModalAdjuntosOpen(true);
  };

  const cerrarModalAdjuntos = () => {
    setModalAdjuntosOpen(false);
    setEquipoAdjuntosSeleccionado(null);
  };

  const normalizarTexto = (valor) => String(valor || "").toLowerCase().trim();

  const coincideBusquedaEquipo = (equipo, texto) => {
    const clienteNombre =
      typeof equipo?.cliente === "object"
        ? equipo?.cliente?.razonSocial
        : equipo?.cliente || "";

    return [
      equipo?.codigo,
      equipo?.nombre,
      equipo?.serie,
      equipo?.marca,
      equipo?.modelo,
      equipo?.descripcion,
      clienteNombre,
      equipo?.estado,
    ].some((campo) => normalizarTexto(campo).includes(texto));
  };

  const coincideBusquedaUbicacion = (ubicacion, texto) => {
    const clienteNombre =
      typeof ubicacion?.cliente === "object"
        ? ubicacion?.cliente?.razonSocial
        : ubicacion?.cliente || "";

    return [
      ubicacion?.codigo,
      ubicacion?.nombre,
      ubicacion?.descripcion,
      ubicacion?.especialidad,
      ubicacion?.numeroOV,
      clienteNombre,
    ].some((campo) => normalizarTexto(campo).includes(texto));
  };

  const cumpleFiltroEstado = (equipo) => {
    if (filtroEstado === "TODOS") return true;
    return normalizarTexto(equipo?.estado) === normalizarTexto(filtroEstado);
  };

  const sedesProcesadas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return sedes.map((sede) => ({
      ...sede,
      equipos: (Array.isArray(sede?.equipos) ? sede.equipos : [])
        .filter((equipo) => coincideBusquedaEquipo(equipo, texto))
        .filter(cumpleFiltroEstado),
      ubicacionesTecnicas: (
        Array.isArray(sede?.ubicacionesTecnicas) ? sede.ubicacionesTecnicas : []
      ).filter((ubicacion) => coincideBusquedaUbicacion(ubicacion, texto)),
    }));
  }, [sedes, busqueda, filtroEstado]);

  const equiposSinSedeProcesados = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    return equiposSinSede
      .filter((equipo) => coincideBusquedaEquipo(equipo, texto))
      .filter(cumpleFiltroEstado);
  }, [equiposSinSede, busqueda, filtroEstado]);

  const ubicacionesSinSedeProcesadas = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    return ubicacionesTecnicasSinSede.filter((ubicacion) =>
      coincideBusquedaUbicacion(ubicacion, texto)
    );
  }, [ubicacionesTecnicasSinSede, busqueda]);

  const totalEquipos = useMemo(() => {
    const totalEnSedes = sedesProcesadas.reduce(
      (acc, sede) => acc + (sede.equipos?.length || 0),
      0
    );
    return totalEnSedes + equiposSinSedeProcesados.length;
  }, [sedesProcesadas, equiposSinSedeProcesados]);

  const totalUbicaciones = useMemo(() => {
    const totalEnSedes = sedesProcesadas.reduce(
      (acc, sede) => acc + (sede.ubicacionesTecnicas?.length || 0),
      0
    );
    return totalEnSedes + ubicacionesSinSedeProcesadas.length;
  }, [sedesProcesadas, ubicacionesSinSedeProcesadas]);

  const tabs = useMemo(() => {
    const tabsSedes = sedesProcesadas.map((sede) => ({
      id: `SEDE_${sede.id}`,
      label: sede.nombre || "Sede",
      tipo: "SEDE",
      data: sede,
      contador: (sede.equipos?.length || 0) + (sede.ubicacionesTecnicas?.length || 0),
    }));

    return [
      ...tabsSedes,
      {
        id: "EQUIPOS_SIN_SEDE",
        label: "Equipos sin sede",
        tipo: "EQUIPOS_SIN_SEDE",
        data: equiposSinSedeProcesados,
        contador: equiposSinSedeProcesados.length,
      },
      {
        id: "UBICACIONES_SIN_SEDE",
        label: "Ubicaciones sin sede",
        tipo: "UBICACIONES_SIN_SEDE",
        data: ubicacionesSinSedeProcesadas,
        contador: ubicacionesSinSedeProcesadas.length,
      },
    ];
  }, [sedesProcesadas, equiposSinSedeProcesados, ubicacionesSinSedeProcesadas]);

  const tabSeleccionada = tabs.find((tab) => tab.id === tabActiva) || tabs[0];

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 border-solid mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Cargando portal del cliente...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" />
            <h2 className="text-xl font-bold text-red-600">Acceso no disponible</h2>
          </div>
          <p className="text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  const renderTablaEquipos = (equipos = []) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-left min-w-[1150px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <th className="px-4 py-4">Foto</th>
            <th className="px-4 py-4">Código</th>
            <th className="px-4 py-4">Equipo</th>
            <th className="px-4 py-4">Estado</th>
            <th className="px-4 py-4">Serie</th>
            <th className="px-4 py-4">Marca</th>
            <th className="px-4 py-4">Modelo</th>
            <th className="px-4 py-4">País</th>
            <th className="px-4 py-4">Adjuntos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {equipos.length ? (
            equipos.map((item) => {
              const cantidadAdjuntos = Array.isArray(item?.adjuntos)
                ? item.adjuntos.length
                : 0;

              return (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-all">
                  <td className="px-4 py-3">
                    <img
                      src={item.foto || "https://via.placeholder.com/100"}
                      className="w-10 h-10 rounded-lg border border-slate-200 object-cover"
                      alt={item.nombre || "Equipo"}
                    />
                  </td>
                  <td className="px-4 py-3 font-black text-[11px] text-blue-600">
                    {item.codigo || "-"}
                  </td>
                  <td className="px-4 py-3 font-black text-slate-700 text-sm uppercase">
                    {item.nombre || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                        item.estado?.toUpperCase() === "OPERATIVO"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : item.estado?.toUpperCase() === "INOPERATIVO"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      }`}
                    >
                      {item.estado || "SIN ESTADO"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-400">
                    {item.serie || "-"}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold uppercase">
                    {item.marca || "-"}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold uppercase">
                    {item.modelo || "-"}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold uppercase">
                    {item.pais?.nombre || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => abrirModalAdjuntos(item)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase text-slate-700 transition-all"
                    >
                      <Paperclip size={14} />
                      {cantidadAdjuntos > 0
                        ? `Ver adjuntos (${cantidadAdjuntos})`
                        : "Sin adjuntos"}
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-semibold">
                No hay equipos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderUbicaciones = (ubicaciones = []) => {
    if (!ubicaciones.length) {
      return (
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 text-slate-500 font-semibold">
          No hay ubicaciones técnicas para mostrar.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ubicaciones.map((ut) => (
          <div
            key={ut.id}
            className="border border-slate-200 rounded-2xl p-4 bg-slate-50"
          >
            <p className="font-black text-slate-800 uppercase">
              {ut.nombre || ut.descripcion || "Ubicación técnica"}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              <span className="font-bold">Código:</span> {ut.codigo || "-"}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-bold">Especialidad:</span> {ut.especialidad || "-"}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-bold">OV:</span> {ut.numeroOV || "-"}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-bold">País:</span> {ut.pais?.nombre || "-"}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-600">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-md font-black text-slate-800 uppercase tracking-tighter">
                Portal del Cliente
              </h1>
              <p className="text-sm text-slate-500 font-semibold">
                {cliente?.razonSocial || "Cliente"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
              {sedesProcesadas.length} Sedes
            </div>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
              {totalEquipos} Equipos
            </div>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
              {totalUbicaciones} Ubicaciones Técnicas
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 mt-8 space-y-6">
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 uppercase mb-4">
            Información del Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Razón Social</p>
              <p className="text-slate-800 font-semibold">{cliente?.razonSocial || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">RUC</p>
              <p className="text-slate-800 font-semibold">{cliente?.ruc || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Teléfono</p>
              <p className="text-slate-800 font-semibold">{cliente?.telefono || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Correo</p>
              <p className="text-slate-800 font-semibold">{cliente?.correo || "-"}</p>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Dirección</p>
              <p className="text-slate-800 font-semibold">{cliente?.direccion || "-"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por sede, equipo, código, serie o ubicación técnica..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-transparent rounded-2xl shadow-sm focus:border-gray-500 outline-none transition-all font-semibold"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            {["TODOS", "OPERATIVO", "INOPERATIVO", "NO INSTALADO"].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                  filtroEstado === estado
                    ? "bg-gray-600 text-white shadow-md shadow-gray-100"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 overflow-x-auto">
            <div className="flex min-w-max p-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`px-4 py-3 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${
                    tabActiva === tab.id
                      ? "bg-gray-600 text-white shadow-md shadow-gray-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab.label} ({tab.contador})
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {tabSeleccionada?.tipo === "SEDE" && (
              <div className="space-y-6">
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 size={18} className="text-blue-600" />
                    <h2 className="text-lg font-black text-slate-800 uppercase">
                      {tabSeleccionada.data?.nombre || "Sede"}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Dirección</p>
                      <p className="text-slate-800 font-semibold">
                        {tabSeleccionada.data?.direccion || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Teléfono</p>
                      <p className="text-slate-800 font-semibold">
                        {tabSeleccionada.data?.telefono || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Correo</p>
                      <p className="text-slate-800 font-semibold">
                        {tabSeleccionada.data?.correo || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Contacto</p>
                      <p className="text-slate-800 font-semibold">
                        {tabSeleccionada.data?.contacto || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Package size={16} />
                    Equipos ({tabSeleccionada.data?.equipos?.length || 0})
                  </h3>
                  {renderTablaEquipos(tabSeleccionada.data?.equipos || [])}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <MapPin size={16} />
                    Ubicaciones Técnicas ({tabSeleccionada.data?.ubicacionesTecnicas?.length || 0})
                  </h3>
                  {renderUbicaciones(tabSeleccionada.data?.ubicacionesTecnicas || [])}
                </div>
              </div>
            )}

            {tabSeleccionada?.tipo === "EQUIPOS_SIN_SEDE" && (
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase mb-4">
                  Equipos sin sede ({equiposSinSedeProcesados.length})
                </h2>
                {renderTablaEquipos(equiposSinSedeProcesados)}
              </div>
            )}

            {tabSeleccionada?.tipo === "UBICACIONES_SIN_SEDE" && (
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase mb-4">
                  Ubicaciones técnicas sin sede ({ubicacionesSinSedeProcesadas.length})
                </h2>
                {renderUbicaciones(ubicacionesSinSedeProcesadas)}
              </div>
            )}
          </div>
        </div>
      </main>

      <AdjuntosEquipoModal
        isOpen={modalAdjuntosOpen}
        onClose={cerrarModalAdjuntos}
        equipo={equipoAdjuntosSeleccionado}
        adjuntos={equipoAdjuntosSeleccionado?.adjuntos || []}
      />
    </div>
  );
}