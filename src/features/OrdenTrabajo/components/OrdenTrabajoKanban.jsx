import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

/* ================= HELPERS ================= */

const getCardColor = (estado) => {
  const colors = {
    creado: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:shadow-blue-200",
    liberado: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 hover:shadow-purple-200",
    cierre_tecnico: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 hover:shadow-amber-200",
    cerrado: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 hover:shadow-emerald-200",
    cancelado: "bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:shadow-red-200"
  };
  return colors[estado] || colors.creado;
};

const getColumnColor = (estado) => {
  const colors = {
    creado: "from-blue-500 to-blue-600",
    liberado: "from-purple-500 to-purple-600",
    cierre_tecnico: "from-amber-500 to-amber-600",
    cerrado: "from-emerald-500 to-emerald-600",
    cancelado: "from-red-500 to-red-600"
  };
  return colors[estado] || colors.creado;
};

const getColumnBg = (estado) => {
  const colors = {
    creado: "bg-blue-50/50",
    liberado: "bg-purple-50/50",
    cierre_tecnico: "bg-amber-50/50",
    cerrado: "bg-emerald-50/50",
    cancelado: "bg-red-50/50"
  };
  return colors[estado] || colors.creado;
};

const formatDate = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const mapKanbanToEstado = (kanbanState) => {
  const mapping = {
    "creado": "CREADO",
    "liberado": "LIBERADO",
    "cierre_tecnico": "CIERRE_TECNICO",
    "cerrado": "CERRADO",
    "cancelado": "CANCELADO"
  };
  return mapping[kanbanState] || "CREADO";
};

/* ================= COMPONENT ================= */

export default function KanbanView({ 
  data, 
  onUpdateEstado, 
  onViewOrden, 
  onLiberar, 
  onAbrirCierreTecnico 
}) {
  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;

    const sourceColumn = data[source.droppableId];
    const destColumn = data[destination.droppableId];

    // Si es la misma columna, no hacemos nada (solo reordenar)
    if (source.droppableId === destination.droppableId) return;

    // Obtener la orden que se movió
    const movedOrden = sourceColumn.items[source.index];
    
    // Actualizar el estado de la orden
    const nuevoEstado = mapKanbanToEstado(destination.droppableId);
    onUpdateEstado(movedOrden.id, nuevoEstado);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-12rem)]">
        {Object.entries(data).map(([colId, col]) => (
          <Droppable droppableId={colId} key={colId}>
            {(provided, snapshot) => (
              <div
                className={`
                  rounded-2xl border-2 transition-all duration-300 flex flex-col
                  ${snapshot.isDraggingOver 
                    ? 'border-dashed border-slate-400 bg-slate-100 scale-[1.02]' 
                    : 'border-transparent'
                  }
                  ${getColumnBg(colId)}
                `}
              >
                {/* COLUMN HEADER */}
                <div className={`
                  bg-gradient-to-r ${getColumnColor(colId)}
                  text-white p-4 rounded-t-2xl
                  shadow-lg flex-shrink-0
                `}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg tracking-wide">
                      {col.name}
                    </h3>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                      {col.items?.length || 0}
                    </span>
                  </div>
                </div>

                {/* CARDS CONTAINER - SCROLLABLE */}
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-3 space-y-3 overflow-y-auto flex-1"
                  style={{ minHeight: '200px' }}
                >
                  {col.items?.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            relative p-4 rounded-xl border-2 
                            shadow-md hover:shadow-xl
                            transition-all duration-300 cursor-move
                            ${getCardColor(colId)}
                            ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : 'hover:-translate-y-1'}
                          `}
                        >
                          {/* VIEW BUTTON */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewOrden(item);
                            }}
                            className="
                              absolute top-3 right-3 
                              w-8 h-8 rounded-lg
                              bg-white/80 backdrop-blur-sm
                              text-slate-600 hover:text-slate-900
                              hover:bg-white
                              shadow-sm hover:shadow-md
                              transition-all duration-200
                              flex items-center justify-center
                              font-bold text-lg
                            "
                          >
                            ⋮
                          </button>

                          {/* CARD CONTENT */}
                          <div className="space-y-3 pr-8">
                            {/* N° OT */}
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                N° Orden
                              </p>
                              <p className="text-sm font-black text-slate-900 bg-white/60 px-2 py-1 rounded-lg inline-block">
                                {item.numeroOT || "—"}
                              </p>
                            </div>

                            {/* DESCRIPCIÓN */}
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Descripción
                              </p>
                              <p className="text-sm text-slate-800 line-clamp-2">
                                {item.descripcionGeneral || "Sin descripción"}
                              </p>
                            </div>

                            {/* SUPERVISOR */}
                            {item.supervisorId && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  👤 Supervisor
                                </p>
                                <p className="text-sm text-slate-800">
                                  {item.supervisorId}
                                </p>
                              </div>
                            )}

                            {/* FECHAS */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  📅 Inicio
                                </p>
                                <p className="text-xs text-slate-800 font-semibold">
                                  {formatDate(item.fechaProgramadaInicio)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  🏁 Fin
                                </p>
                                <p className="text-xs text-slate-800 font-semibold">
                                  {formatDate(item.fechaProgramadaFin)}
                                </p>
                              </div>
                            </div>

                            {/* EQUIPOS */}
                            {item.equipos && item.equipos.length > 0 && (
                              <div className="pt-2 border-t border-slate-200">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                  🔧 Equipos ({item.equipos.length})
                                </p>
                                <div className="space-y-1">
                                  {item.equipos.slice(0, 2).map((equipo, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                      <span className="text-slate-700 truncate">
                                        {equipo.descripcionEquipo || `Equipo ${idx + 1}`}
                                      </span>
                                    </div>
                                  ))}
                                  {item.equipos.length > 2 && (
                                    <p className="text-[10px] text-slate-500 italic ml-3.5">
                                      +{item.equipos.length - 2} más...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* BOTONES DE ACCIÓN */}
                            <div className="pt-3 border-t border-slate-200">
                              {/* BOTÓN LIBERAR - Solo en estado CREADO */}
                              {colId === 'creado' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLiberar(item.id);
                                  }}
                                  className="
                                    w-full py-2 px-4 rounded-lg
                                    bg-gradient-to-r from-purple-500 to-purple-600
                                    hover:from-purple-600 hover:to-purple-700
                                    text-white font-bold text-sm
                                    shadow-md hover:shadow-lg
                                    transition-all duration-200
                                    transform hover:scale-[1.02]
                                    flex items-center justify-center gap-2
                                  "
                                >
                                  <span>🚀</span>
                                  <span>Liberar</span>
                                </button>
                              )}

                              {/* BOTÓN CIERRE TÉCNICO - Solo en estado LIBERADO */}
                              {colId === 'liberado' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAbrirCierreTecnico(item);
                                  }}
                                  className="
                                    w-full py-2 px-4 rounded-lg
                                    bg-gradient-to-r from-amber-500 to-amber-600
                                    hover:from-amber-600 hover:to-amber-700
                                    text-white font-bold text-sm
                                    shadow-md hover:shadow-lg
                                    transition-all duration-200
                                    transform hover:scale-[1.02]
                                    flex items-center justify-center gap-2
                                  "
                                >
                                  <span>✅</span>
                                  <span>Cierre Técnico</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {/* EMPTY STATE */}
                  {(!col.items || col.items.length === 0) && (
                    <div className="text-center py-12 text-slate-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-sm font-medium">No hay órdenes</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}