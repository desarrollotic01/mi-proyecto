import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { X, Settings, RotateCcw, Save, GripVertical, Eye, EyeOff } from "lucide-react";

export default function ModalConfiguracionCampos({
  isOpen,
  onClose,
  fields,
  setFields,
  order,
  setOrder,
  onSave,
  onReset,
}) {
  if (!isOpen) return null;

  const fieldLabels = {
  numeroAviso: "N° Aviso",
  tipoAviso: "Tipo de Aviso",
  cliente: "Cliente",
  estado: "Estado",
  fecha: "Fecha Atención",
  prioridad: "Prioridad",
  equipo: "Equipo",
  tipoMantenimiento: "Tipo de Mantenimiento",
  descripcionResumida: "Descripción Resumida",
  descripcion: "Descripción Completa",
  solicitante: "Solicitante",
  ordenVenta: "Orden de Venta",
  centroCosto: "Centro de Costo",
  producto: "Producto",
  ordenCliente: "Orden del Cliente",
  almacen: "Almacén",
  sede: "Sede",
  nombreContacto: "Nombre de Contacto",
  correoContacto: "Correo de Contacto",
  numeroContacto: "Número de Contacto",
  ubicacionTecnica: "Ubicación Técnica",
  direccionAtencion: "Dirección de Atención",
  supervisorAsignado: "Supervisor Asignado",
  estadoAviso: "Estado del Aviso",
  documentos: "Documentos Adjuntos",
  documentoFinal: "Documento Final",
};

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);

    setOrder(newOrder);
  };

  const visibleCount = Object.values(fields).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Configurar Vista
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {visibleCount} de {order.length} campos visibles
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <GripVertical className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Personaliza tu vista</p>
              <p className="text-blue-600">
                Arrastra para reordenar y marca/desmarca para mostrar u ocultar campos
              </p>
            </div>
          </div>
        </div>

        {/* LISTA DE CAMPOS */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="fields">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-purple-50/50 rounded-xl' : ''}`}
                >
                  {order.map((key, i) => (
                    <Draggable key={key} draggableId={key} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-3 p-4 bg-white border-2 rounded-xl transition-all ${
                            snapshot.isDragging
                              ? 'border-purple-400 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />

                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={fields[key] === true}
                                onChange={(e) =>
                                  setFields({
                                    ...fields,
                                    [key]: e.target.checked,
                                  })
                                }
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                              />
                            </div>

                            <div className="flex-1">
                              <span className={`font-medium ${fields[key] ? 'text-gray-900' : 'text-gray-400'}`}>
                                {fieldLabels[key] || key}
                              </span>
                            </div>

                            {fields[key] ? (
                              <Eye className="w-4 h-4 text-purple-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </label>
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

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onReset}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-white transition-colors font-medium"
              >
                Cancelar
              </button>

              <button
                onClick={onSave}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}