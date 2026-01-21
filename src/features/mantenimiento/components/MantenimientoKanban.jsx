// src/features/mantenimiento/components/MantenimientoKanban.jsx
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ESTADOS_AV } from "../config/camposMantenimiento";

export default function MantenimientoKanban({
  filteredColumns,
  cardFields,
  getEstadoBadge,
  setViewData,
  setViewStep,
  setViewOpen,
  onDragEnd,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-7 gap-3">
        {Object.entries(filteredColumns).map(([colId, col]) => (
          <Droppable droppableId={colId} key={colId}>
            {(p) => (
              <div
                ref={p.innerRef}
                {...p.droppableProps}
                className="p-3 rounded-lg border bg-gray-50"
              >
                <h3 className="font-semibold mb-2">
                  {ESTADOS_AV[colId]?.label || col.name}
                </h3>

                {col.items.map((item, i) => (
                  <Draggable
                    draggableId={item.id}
                    index={i}
                    key={item.id}
                  >
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        onClick={() => {
                          setViewData(item);
                          setViewStep(1);
                          setViewOpen(true);
                        }}
                        className="p-2 mb-2 border rounded-sm bg-white shadow-sm cursor-pointer hover:bg-gray-50 text-xs space-y-2"
                      >
                        {cardFields.numeroAviso && (
                          <div className="font-semibold">
                            #{item.numeroAviso}
                          </div>
                        )}

                        {cardFields.cliente && (
                          <div>{item.cliente || "—"}</div>
                        )}

                        {cardFields.estado && (
                          <span
                            className={`inline-block px-2 py-[2px] text-[11px] border rounded-sm ${
                              ESTADOS_AV[item.estadoAviso]?.badge
                            }`}
                          >
                            {ESTADOS_AV[item.estadoAviso]?.label}
                          </span>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}

                {p.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}