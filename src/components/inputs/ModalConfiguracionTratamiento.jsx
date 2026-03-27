import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { CAMPOS_AVISO } from "./camposAviso";

export default function ModalConfiguracionCampos({
  isOpen,
  onClose,
  fields,
  setFields,
  order,
  setOrder,
}) {
  if (!isOpen) return null;

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newOrder = Array.from(order);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    setOrder(newOrder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Configurar vista</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Arrastra para ordenar y marca para mostrar u ocultar.
        </p>

        <div className="flex-1 overflow-y-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="config-fields">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {order.map((key, index) => (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center gap-3 p-2 mb-2 bg-gray-50 border rounded"
                        >
                          <span className="cursor-grab text-gray-400">☰</span>

                          <input
                            type="checkbox"
                            checked={fields[key]}
                            onChange={() =>
                              setFields({
                                ...fields,
                                [key]: !fields[key],
                              })
                            }
                          />

                          <span className="text-sm flex-1">
                            {CAMPOS_AVISO[key]}
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

        <div className="mt-4 flex justify-end border-t pt-3">
          <button
            onClick={onClose}
            className="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
