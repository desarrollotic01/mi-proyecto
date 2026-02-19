import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid3x3, Columns } from "lucide-react";
import { ESTADOS_AV } from "../config/camposMantenimiento";
import { useState } from "react";

export default function MantenimientoCalendario({
  calendarRef,
  calendarView,
  setCalendarView,
  filteredColumns,
  cardFields,
  setViewData,
  setViewStep,
  setViewOpen,
  equiposData = [], // 🆕 Agregado por consistencia (aunque el calendario no muestra equipos)
}) {
  const events = Object.values(filteredColumns)
    .flatMap((col) => col.items)
    .map((item) => {
      let title = "Aviso";
      
      // Agregar tipo de aviso al título
      const tipoIcon = item.tipoAviso === "mantenimiento" ? "🔧" : "📦";
      
      if (cardFields.numeroAviso) {
        title = `${tipoIcon} #${item.numeroAviso}`;
      } else if (cardFields.cliente) {
        title = `${tipoIcon} ${item.cliente || "Aviso"}`;
      }

      // Agregar más info al título si hay espacio
      if (cardFields.cliente && item.cliente && cardFields.numeroAviso) {
        title += ` - ${item.cliente.substring(0, 15)}${item.cliente.length > 15 ? '...' : ''}`;
      }

      return {
        id: item.id,
        title,
        date: item.fechaAtencion || new Date().toISOString().slice(0, 10),
        backgroundColor: ESTADOS_AV[item.estado]?.color || "#6B7280",
        borderColor: ESTADOS_AV[item.estado]?.color || "#6B7280",
        textColor: "#FFFFFF",
        extendedProps: item,
        classNames: ["cursor-pointer", "transition-all", "hover:opacity-90"],
      };
    });

  const [currentTitle, setCurrentTitle] = useState("");

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) calendarApi.prev();
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) calendarApi.next();
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) calendarApi.today();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER CON CONTROLES */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calendario de Avisos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {events.length} aviso{events.length !== 1 ? 's' : ''} programado{events.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Controles de Vista */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setCalendarView("dayGridMonth")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  calendarView === "dayGridMonth"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Mes
              </button>

              <button
                onClick={() => setCalendarView("dayGridWeek")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  calendarView === "dayGridWeek"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Columns className="w-4 h-4" />
                Semana
              </button>
            </div>
          </div>
        </div>

        {/* Navegación del Calendario */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={handleToday}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Hoy
            </button>

            <button
              onClick={handleNext}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 capitalize">
            {currentTitle}
          </h3>

          {/* Leyenda de Estados */}
          <div className="flex items-center gap-2">
            {Object.entries(ESTADOS_AV).slice(0, 4).map(([key, estado]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: estado.color }}
                />
                <span className="text-xs text-gray-600 font-medium">
                  {estado.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            locale={esLocale}
            events={events}
            height="100%"
            headerToolbar={false}
            datesSet={(info) => {
              setCurrentTitle(info.view.title);
            }}
            eventClick={(info) => {
              setViewData(info.event.extendedProps);
              setViewStep(1);
              setViewOpen(true);
            }}
            dayMaxEvents={3}
            eventDisplay="block"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
            }}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
            }}
            views={{
              dayGridMonth: {
                titleFormat: { year: "numeric", month: "long" },
              },
              dayGridWeek: {
                titleFormat: { year: "numeric", month: "long", day: "numeric" },
              },
            }}
            buttonText={{
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
            }}
            moreLinkText={(num) => `+${num} más`}
            noEventsText="No hay avisos programados"
            eventClassNames="shadow-sm"
          />
        </div>

        {/* Estilos personalizados */}
        <style>{`
          .fc {
            font-family: inherit;
          }

          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #E5E7EB;
          }

          .fc-col-header-cell {
            background: linear-gradient(to bottom, #F9FAFB, #F3F4F6);
            padding: 12px 8px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            color: #6B7280;
          }

          .fc-daygrid-day-number {
            padding: 8px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }

          .fc-day-today {
            background-color: #EFF6FF !important;
          }

          .fc-day-today .fc-daygrid-day-number {
            background: #3B82F6;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .fc-event {
            border-radius: 6px;
            padding: 4px 8px;
            margin: 2px;
            font-size: 12px;
            font-weight: 500;
            border-width: 0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }

          .fc-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .fc-daygrid-day-events {
            margin-top: 4px;
          }

          .fc-more-link {
            color: #3B82F6;
            font-weight: 600;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #EFF6FF;
            margin: 2px;
          }

          .fc-more-link:hover {
            background: #DBEAFE;
          }

          .fc-daygrid-day-frame {
            min-height: 100px;
          }

          .fc-scrollgrid {
            border-radius: 12px;
            overflow: hidden;
            border-color: #E5E7EB;
          }

          .fc-daygrid-day:hover {
            background-color: #F9FAFB;
          }

          .fc-daygrid-event-harness {
            margin-top: 2px;
          }

          /* Estilos para vista semanal */
          .fc-timegrid-slot {
            height: 3em;
          }

          .fc-timegrid-slot-label {
            border-color: #E5E7EB;
            font-size: 12px;
            color: #6B7280;
          }

          .fc-timegrid-event {
            border-radius: 6px;
            border: none;
            padding: 4px 6px;
          }
        `}</style>
      </div>
    </div>
  );
}