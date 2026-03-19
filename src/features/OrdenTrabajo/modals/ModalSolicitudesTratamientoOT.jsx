import { useEffect, useMemo, useState } from "react";
import {
  X,
  ShoppingCart,
  Boxes,
  Layers3,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { getSolicitudesTratamientoPorOrdenTrabajo } from "../../mantenimiento/services/ordenTrabajoService";

export default function ModalSolicitudesTratamientoOT({
  isOpen,
  onClose,
  ordenId,
}) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      if (!isOpen || !ordenId) return;

      try {
        setLoading(true);
        setError("");
        const response = await getSolicitudesTratamientoPorOrdenTrabajo(ordenId);
        setDetalle(response?.data || null);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la vista de solicitudes del tratamiento.");
        setDetalle(null);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [isOpen, ordenId]);

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTexto = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "—";
    return valor;
  };

  const solicitudesCompra = detalle?.solicitudesCompra || {
    generales: [],
    especificas: [],
  };

  const solicitudesAlmacen = detalle?.solicitudesAlmacen || {
    generales: [],
    especificas: [],
    lineasAgrupadasSap: [],
  };

  const resumen = detalle?.resumen || {
    tratamientoId: null,
    equipoIds: [],
    ubicacionTecnicaIds: [],
    totalSolicitudesCompra: 0,
    totalSolicitudesAlmacen: 0,
  };

  const ordenTrabajo = detalle?.ordenTrabajo || null;
  const tratamiento = detalle?.tratamiento || null;

  const lineasCompra = useMemo(() => {
    const todas = [
      ...(solicitudesCompra.generales || []),
      ...(solicitudesCompra.especificas || []),
    ];

    return todas.flatMap((sol) =>
      (sol.lineas || []).map((linea, index) => ({
        rowId: `${sol.id}-${linea.id || index}-compra`,
        origenVista: sol.origenVista || "—",
        solicitudId: sol.id,
        documento: sol.docNum || sol.numeroDocumento || sol.id,
        fecha: sol.docDate || sol.createdAt || null,
        tratamientoId: sol.tratamiento_id || sol.tratamientoId,
        ordenTrabajoId: sol.ordenTrabajoId,
        equipoId: sol.equipo_id || sol.equipoId,
        ubicacionTecnicaId:
          sol.ubicacion_tecnica_id || sol.ubicacionTecnicaId,
        itemCode: linea.itemCode,
        description: linea.description,
        quantity: linea.quantity,
        warehouseCode: linea.warehouseCode,
        costingCode: linea.costingCode,
        projectCode: linea.projectCode,
        rubroSapCode: linea.rubroSapCode || linea.rubro,
        paqueteTrabajo: linea.paqueteTrabajo,
      }))
    );
  }, [solicitudesCompra]);

  const lineasAlmacen = useMemo(() => {
    const todas = [
      ...(solicitudesAlmacen.generales || []),
      ...(solicitudesAlmacen.especificas || []),
    ];

    return todas.flatMap((sol) =>
      (sol.lineas || []).map((linea, index) => ({
        rowId: `${sol.id}-${linea.id || index}-almacen`,
        origenVista: sol.origenVista || "—",
        solicitudId: sol.id,
        documento: sol.docNum || sol.numeroDocumento || sol.id,
        fecha: sol.docDate || sol.createdAt || null,
        tratamientoId: sol.tratamiento_id || sol.tratamientoId,
        ordenTrabajoId: sol.ordenTrabajoId,
        equipoId: sol.equipo_id || sol.equipoId,
        ubicacionTecnicaId:
          sol.ubicacion_tecnica_id || sol.ubicacionTecnicaId,
        itemCode: linea.itemCode,
        description: linea.description,
        quantity: linea.quantity,
        warehouseCode: linea.warehouseCode,
        costingCode: linea.costingCode,
        projectCode: linea.projectCode,
        rubroSapCode: linea.rubroSapCode || linea.rubro,
        paqueteTrabajo: linea.paqueteTrabajo,
      }))
    );
  }, [solicitudesAlmacen]);

  const lineasAgrupadasSap = useMemo(() => {
    return (solicitudesAlmacen.lineasAgrupadasSap || []).map((linea, index) => ({
      rowId: `sap-${index}`,
      origenVista: "SAP",
      solicitudId: "AGRUPADO",
      documento: "AGRUPADO",
      fecha: null,
      tratamientoId: resumen.tratamientoId,
      ordenTrabajoId: ordenTrabajo?.id || "—",
      equipoId: "—",
      ubicacionTecnicaId: "—",
      itemCode: linea.itemCode,
      description: linea.description,
      quantity: linea.quantity,
      warehouseCode: linea.warehouseCode,
      costingCode: linea.costingCode,
      projectCode: linea.projectCode,
      rubroSapCode: linea.rubroSapCode,
      paqueteTrabajo: linea.paqueteTrabajo,
    }));
  }, [solicitudesAlmacen, resumen, ordenTrabajo]);

  const renderTable = (rows = [], tipo = "") => {
    if (!rows.length) {
      return (
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-sm text-slate-500">
          No hay ítems de {tipo}.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr className="text-slate-700">
              <th className="text-left p-2 border-b whitespace-nowrap">Origen</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Documento</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Fecha</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Solicitud ID</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Tratamiento ID</th>
              <th className="text-left p-2 border-b whitespace-nowrap">OT ID</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Equipo ID</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Ubicación Técnica ID</th>
              <th className="text-left p-2 border-b whitespace-nowrap">ItemCode</th>
              <th className="text-left p-2 border-b min-w-[220px]">Descripción</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Cantidad</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Warehouse</th>
              <th className="text-left p-2 border-b whitespace-nowrap">CostingCode</th>
              <th className="text-left p-2 border-b whitespace-nowrap">ProjectCode</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Rubro SAP</th>
              <th className="text-left p-2 border-b whitespace-nowrap">Paquete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.rowId || index}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.origenVista)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.documento)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatFecha(row.fecha)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.solicitudId)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.tratamientoId)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.ordenTrabajoId)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.equipoId)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.ubicacionTecnicaId)}
                </td>
                <td className="p-2 border-b whitespace-nowrap font-medium">
                  {formatTexto(row.itemCode)}
                </td>
                <td className="p-2 border-b">
                  {formatTexto(row.description)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.quantity)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.warehouseCode)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.costingCode)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.projectCode)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.rubroSapCode)}
                </td>
                <td className="p-2 border-b whitespace-nowrap">
                  {formatTexto(row.paqueteTrabajo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[96vw] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6" />
              Solicitudes del Tratamiento
            </h2>
            <p className="text-slate-200 mt-1 font-medium">
              OT: {formatTexto(ordenTrabajo?.numeroOT || ordenTrabajo?.id)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando solicitudes del tratamiento...
            </div>
          )}

          {error && (
            <div className="bg-white rounded-2xl border border-red-200 p-6 flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Resumen</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold">
                      Tratamiento ID
                    </p>
                    <p className="font-bold text-slate-900 mt-1 break-all">
                      {formatTexto(resumen.tratamientoId)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold">
                      Total Solicitudes Compra
                    </p>
                    <p className="font-bold text-slate-900 mt-1">
                      {formatTexto(resumen.totalSolicitudesCompra)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold">
                      Total Solicitudes Almacén
                    </p>
                    <p className="font-bold text-slate-900 mt-1">
                      {formatTexto(resumen.totalSolicitudesAlmacen)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold">
                      Tratamiento
                    </p>
                    <p className="font-bold text-slate-900 mt-1">
                      {formatTexto(tratamiento?.nombre)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  Solicitudes de Compra - Ítems
                </h3>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Generales
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {solicitudesCompra.generales.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Específicas OT
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {solicitudesCompra.especificas.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Total Ítems
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {lineasCompra.length}
                    </p>
                  </div>
                </div>

                {renderTable(lineasCompra, "compra")}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-indigo-600" />
                  Solicitudes de Almacén - Ítems
                </h3>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Generales
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {solicitudesAlmacen.generales.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Específicas OT
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {solicitudesAlmacen.especificas.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Total Ítems
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {lineasAlmacen.length}
                    </p>
                  </div>
                </div>

                {renderTable(lineasAlmacen, "almacén")}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Layers3 className="w-5 h-5 text-indigo-600" />
                  Almacén - Líneas Agrupadas para SAP
                </h3>

                {renderTable(lineasAgrupadasSap, "almacén agrupado")}
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}