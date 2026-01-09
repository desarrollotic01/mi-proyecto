import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ModalConfiguracionCampos({
  isOpen,
  onClose,
  fields,
  setFields,
  order,
  setOrder,
}) {
  if (!isOpen) return null;

  // Mapeo de nombres amigables
  const fieldLabels = {
    cliente: "Cliente",
  descripcion: "Descripción",
  ubicacionTecnica: "Ubicación Técnica",
  numeroAviso: "N° Aviso",
  ordenVenta: "Orden de Venta",
  centroCosto: "Centro de Costo",
  prioridad: "Prioridad",
  fechaAtencion: "Fecha Atención",
  tipoMantenimiento: "Tipo de Mantenimiento",
  producto: "Producto",
  direccionAtencion: "Dirección de Atención",
  solicitante: "Solicitante",
  supervisorAsignado: "Supervisor Asignado",
  estadoAviso: "Estado del Aviso",
  nombreContacto: "Nombre de Contacto",
  correoContacto: "Correo de Contacto",
  numeroContacto: "Número de Contacto",
  descripcionResumida: "Descripción Resumida",
  documentos: "Documentos Adjuntos",
  documentoFinal: "Documento Final",
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newOrder = Array.from(order);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    setOrder(newOrder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Configurar Vistas</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Arrastra para reordenar y marca para mostrar/ocultar en Tabla y Kanban.
        </p>

        <div className="flex-1 overflow-y-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="config-fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {order.map((key, index) => (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
                        >
                          {/* Icono de arrastre */}
                          <span className="text-gray-400 cursor-grab">☰</span>

                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            checked={fields[key]}
                            onChange={(e) =>
                              setFields({ ...fields, [key]: e.target.checked })
                            }
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {fieldLabels[key] || key}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
