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
                    className={`px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap ${getColumnWidth(key)}`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      <span className="truncate">{labels[key] || key}</span>
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky right-0 bg-gradient-to-r from-gray-50 to-gray-100 min-w-[160px] border-l-2 border-gray-200">
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
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Inbox className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-semibold text-gray-500">
                      No hay avisos para mostrar
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
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
                        className={`px-4 py-3 text-sm ${getColumnWidth(key)}`}
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
                    className={`px-4 py-3 sticky right-0 border-l border-gray-200 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      {item.estado === "CREADO" && (
                        <>
                          <button
                            onClick={() => abrirTratamiento(item)}
                            className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Tratar
                          </button>

                          <button
                            onClick={() =>
                              cambiarEstado(item, "RECHAZADO")
                            }
                            className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            title="Rechazar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {item.estado === "TRATADO" && (
                        <button
                          onClick={() =>
                            cambiarEstado(item, "CON_OT")
                          }
                          className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generar OT
                        </button>
                      )}

                      {item.estado === "CON_OT" && (
                        <>
                          <button
                            onClick={() =>
                              cambiarEstado(item, "FINALIZADO")
                            }
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Finalizar
                          </button>

                          <button
                            onClick={() =>
                              cambiarEstado(
                                item,
                                "FINALIZADO_SIN_FACTURACION"
                              )
                            }
                            className="p-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                            title="Finalizar sin facturación"
                          >
                            <FileCheck className="w-4 h-4" />
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