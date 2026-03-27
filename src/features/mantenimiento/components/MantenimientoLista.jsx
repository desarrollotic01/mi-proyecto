import { 
  FileText, User, Calendar, AlertCircle, Wrench, Package, 
  CheckCircle, XCircle, FileCheck, Inbox, MapPin, Mail, Phone,
  Building, Box, Hash, DollarSign
} from "lucide-react";
import { ESTADOS_AV } from "../config/camposMantenimiento";

export default function MantenimientoLista({
  filteredColumns,
  cardFields,
  columnOrder,
  cambiarEstado,
  abrirTratamiento,
  setViewData,
  setViewStep,
  setViewOpen,
  equiposData = [], // 🆕 Recibir equiposData
}) {
  const avisos = Object.values(filteredColumns).flatMap(
    (col) => col.items
  );

  // 🆕 Helper para obtener datos del equipo por ID
  const getEquipoData = (equipoId) => {
    return equiposData.find(e => e.id === equipoId);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Alta: "bg-red-100 text-red-700 border-red-300",
      Media: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Baja: "bg-green-100 text-green-700 border-green-300",
    };
    return colors[priority] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const fieldIcons = {
    numeroAviso: FileText,
    tipoAviso: Package,
    cliente: User,
    fecha: Calendar,
    prioridad: AlertCircle,
    tipoMantenimiento: Wrench,
    equipo: Package,
    ordenVenta: Hash,
    centroCosto: DollarSign,
    producto: Box,
    ubicacionTecnica: MapPin,
    nombreContacto: User,
    correoContacto: Mail,
    numeroContacto: Phone,
    sede: Building,
  };

  const labels = {
    numeroAviso: "N° Aviso",
    tipoAviso: "Tipo",
    descripcion: "Descripción",
    descripcionResumida: "Resumen",
    cliente: "Cliente",
    equipo: "Equipo",
    estado: "Estado",
    fecha: "Fecha",
    prioridad: "Prioridad",
    solicitante: "Solicitante",
    tipoMantenimiento: "Tipo Mant.",
    ordenVenta: "O. Venta",
    centroCosto: "C. Costo",
    producto: "Producto",
    ordenCliente: "O. Cliente",
    almacen: "Almacén",
    sede: "Sede",
    nombreContacto: "Contacto",
    correoContacto: "Email",
    numeroContacto: "Teléfono",
    ubicacionTecnica: "Ubicación",
    direccionAtencion: "Dirección",
    supervisorAsignado: "Supervisor",
    estadoAviso: "Estado Aviso",
    documentos: "Docs",
    documentoFinal: "Doc Final",
  };

  // Función para obtener el ancho de cada columna
  const getColumnWidth = (key) => {
    const widths = {
      numeroAviso: "min-w-[160px]",
      tipoAviso: "min-w-[140px]",
      estado: "min-w-[160px]",
      prioridad: "min-w-[140px]",
      cliente: "min-w-[200px]",
      fecha: "min-w-[140px]",
      equipo: "min-w-[180px]",
      descripcion: "min-w-[250px]",
      descripcionResumida: "min-w-[220px]",
      solicitante: "min-w-[140px]",
      tipoMantenimiento: "min-w-[150px]",
      ordenVenta: "min-w-[120px]",
      centroCosto: "min-w-[120px]",
      producto: "min-w-[140px]",
      ordenCliente: "min-w-[120px]",
      almacen: "min-w-[120px]",
      sede: "min-w-[140px]",
      nombreContacto: "min-w-[160px]",
      correoContacto: "min-w-[180px]",
      numeroContacto: "min-w-[140px]",
      ubicacionTecnica: "min-w-[180px]",
      direccionAtencion: "min-w-[180px]",
      supervisorAsignado: "min-w-[160px]",
      documentos: "min-w-[100px]",
      documentoFinal: "min-w-[100px]",
    };
    return widths[key] || "min-w-[120px]";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* HEADER */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              {columnOrder.map((key) => {
                if (!cardFields[key]) return null;
                const Icon = fieldIcons[key];

                return (
                  <th
                    key={key}
                    className={`px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm lg:text-base font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap ${getColumnWidth(key)}`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      <span className="truncate">{labels[key] || key}</span>
                    </div>
                  </th>
                );
              })}
              <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm lg:text-base font-bold text-gray-700 uppercase tracking-wider sticky right-0 z-30 bg-white min-w-[140px] md:min-w-[160px] border-l-2 border-gray-200 shadow-l">
                Acciones
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100">
            {avisos.length === 0 ? (
              <tr>
                <td
                  colSpan={columnOrder.filter(key => cardFields[key]).length + 1}
                  className="px-6 py-12"
                >
                  <div className="flex flex-col items-center justify-center text-gray-400 p-4 md:p-6">
                    <Inbox className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-30" />
                    <p className="text-base md:text-lg font-semibold text-gray-500 text-center">
                      No hay avisos para mostrar
                    </p>
                    <p className="text-xs md:text-sm text-gray-400 mt-1 text-center">
                      Los avisos aparecerán aquí cuando se creen
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              avisos.map((item, idx) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    setViewData(item);
                    setViewStep(1);
                    setViewOpen(true);
                  }}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  {/* CAMPOS DINÁMICOS */}
                  {columnOrder.map((key) => {
                    if (!cardFields[key]) return null;

                    return (
                      <td
                        key={key}
                        className={`px-3 py-2 md:px-4 md:py-3 text-sm md:text-base lg:text-lg ${getColumnWidth(key)}`}
                      >
                        {/* Número de Aviso */}
                        {key === "numeroAviso" && (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-bold text-gray-900 truncate">
                              #{item.numeroAviso}
                            </span>
                          </div>
                        )}

                        {/* Tipo de Aviso */}
                        {key === "tipoAviso" && item.tipoAviso && (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-lg whitespace-nowrap ${
                              item.tipoAviso === "mantenimiento"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            {item.tipoAviso === "mantenimiento" ? "🔧 Mantenimiento" : "📦 Instalación"}
                          </span>
                        )}

                        {/* Descripción */}
                        {key === "descripcion" && (
                          <span className="text-gray-700 line-clamp-2">
                            {item.descripcion || "Sin descripción"}
                          </span>
                        )}

                        {/* Descripción Resumida */}
                        {key === "descripcionResumida" && (
                          <span className="text-gray-700 line-clamp-2">
                            {item.descripcionResumida || "Sin resumen"}
                          </span>
                        )}

                        {/* Cliente */}
                        {key === "cliente" && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 font-medium truncate">
                              {item.cliente || "Sin cliente"}
                            </span>
                          </div>
                        )}

                        {/* 🔄 EQUIPO - Actualizado para usar IDs */}
                        {key === "equipo" && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            {item.equipos && item.equipos.length > 0 ? (
                              <>
                                {(() => {
                                  const primerEquipoId = item.equipos[0];
                                  const primerEquipo = getEquipoData(primerEquipoId);
                                  
                                  return primerEquipo ? (
                                    <span className="text-gray-700 truncate">
                                      {primerEquipo.nombre}
                                      {item.equipos.length > 1 && (
                                        <span className="text-xs text-gray-500 ml-1">
                                          +{item.equipos.length - 1}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 truncate">ID no encontrado</span>
                                  );
                                })()}
                              </>
                            ) : (
                              <span className="text-gray-400 truncate">Sin equipo</span>
                            )}
                          </div>
                        )}

                        {/* Estado */}
                        {key === "estado" && (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold border rounded-lg whitespace-nowrap ${
                              ESTADOS_AV[item.estado]?.badge
                            }`}
                          >
                            {ESTADOS_AV[item.estado]?.label}
                          </span>
                        )}

                        {/* Fecha */}
                        {key === "fecha" && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {item.fechaAtencion
                                ? new Date(
                                    item.fechaAtencion
                                  ).toLocaleDateString("es-PE", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Sin fecha"}
                            </span>
                          </div>
                        )}

                        {/* Prioridad */}
                        {key === "prioridad" && (
                          <div className="flex items-center gap-2">
                            {item.prioridad ? (
                              <span
                                className={`inline-flex items-center px-3 py-1 text-xs font-semibold border rounded-lg whitespace-nowrap ${getPriorityColor(
                                  item.prioridad
                                )}`}
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {item.prioridad}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        )}

                        {/* Solicitante */}
                        {key === "solicitante" && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{item.solicitante || "-"}</span>
                          </div>
                        )}

                        {/* Tipo de Mantenimiento */}
                        {key === "tipoMantenimiento" && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {item.tipoMantenimiento || "-"}
                            </span>
                          </div>
                        )}

                        {/* Orden de Venta */}
                        {key === "ordenVenta" && (
                          <span className="text-gray-700 truncate">
                            {item.ordenVenta || "-"}
                          </span>
                        )}

                        {/* Centro de Costo */}
                        {key === "centroCosto" && (
                          <span className="text-gray-700 truncate">
                            {item.centroCosto || "-"}
                          </span>
                        )}

                        {/* Producto */}
                        {key === "producto" && (
                          <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {item.producto || "-"}
                            </span>
                          </div>
                        )}

                        {/* Orden Cliente */}
                        {key === "ordenCliente" && (
                          <span className="text-gray-700 truncate">
                            {item.ordenCliente || "-"}
                          </span>
                        )}

                        {/* Almacén */}
                        {key === "almacen" && (
                          <span className="text-gray-700 truncate">
                            {item.almacen || "-"}
                          </span>
                        )}

                        {/* Sede */}
                        {key === "sede" && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {item.sede || "-"}
                            </span>
                          </div>
                        )}

                        {/* Nombre Contacto */}
                        {key === "nombreContacto" && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {item.nombreContacto || "-"}
                            </span>
                          </div>
                        )}

                        {/* Correo Contacto */}
                        {key === "correoContacto" && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {item.correoContacto || "-"}
                            </span>
                          </div>
                        )}

                        {/* Número Contacto */}
                        {key === "numeroContacto" && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {item.numeroContacto || "-"}
                            </span>
                          </div>
                        )}

                        {/* Ubicación Técnica */}
                        {key === "ubicacionTecnica" && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {item.ubicacionTecnica || "-"}
                            </span>
                          </div>
                        )}

                        {/* Dirección Atención */}
                        {key === "direccionAtencion" && (
                          <span className="text-gray-700 truncate">
                            {item.direccionAtencion || "-"}
                          </span>
                        )}

                        {/* Supervisor Asignado */}
                        {key === "supervisorAsignado" && (
                          <span className="text-gray-700 truncate">
                            {item.supervisorAsignado || "-"}
                          </span>
                        )}

                        {/* Estado Aviso (del backend) */}
                        {key === "estadoAviso" && (
                          <span className="text-gray-700 truncate">
                            {item.estadoAviso || "-"}
                          </span>
                        )}

                        {/* Documentos */}
                        {key === "documentos" && (
                          <span className="text-gray-700">
                            {item.documentos?.length || 0}
                          </span>
                        )}

                        {/* Documento Final */}
                        {key === "documentoFinal" && (
                          <span className="text-gray-700 truncate">
                            {item.documentoFinal ? "✓" : "-"}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* ACCIONES - Sticky en el lado derecho */}
                  <td
                    className={`px-3 py-2 md:px-4 md:py-3 sticky right-0 z-30 bg-white border-l border-slate-200 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                      {item.estado === "CREADO" && (
                        <>
                          <button
                            onClick={() => abrirTratamiento(item)}
                            className="px-2 py-1.5 md:px-3 md:py-2 bg-transparent border border-amber-300 text-amber-700 hover:bg-amber-50 active:bg-amber-100 text-[10px] md:text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <Wrench className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            Tratar
                          </button>

                          <button
                            onClick={() =>
                              cambiarEstado(item, "RECHAZADO")
                            }
                            className="p-1.5 md:p-2 bg-transparent border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 active:bg-rose-100 transition-colors"
                            title="Rechazar"
                          >
                            <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </>
                      )}

                      {item.estado === "TRATADO" && (
                        <button
                          onClick={() =>
                            cambiarEstado(item, "CON_OT")
                          }
                          className="px-2 py-1.5 md:px-3 md:py-2 bg-transparent border border-violet-300 text-violet-700 hover:bg-violet-50 active:bg-violet-100 text-[10px] md:text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          <FileText className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Generar OT
                        </button>
                      )}

                      {item.estado === "CON_OT" && (
                        <>
                          <button
                            onClick={() =>
                              cambiarEstado(item, "FINALIZADO")
                            }
                            className="px-2 py-1.5 md:px-3 md:py-2 bg-transparent border border-emerald-300 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 text-[10px] md:text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            Finalizar
                          </button>

                          <button
                            onClick={() =>
                              cambiarEstado(
                                item,
                                "FINALIZADO_SIN_FACTURACION"
                              )
                            }
                            className="p-1.5 md:p-2 bg-transparent border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
                            title="Finalizar sin facturación"
                          >
                            <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}