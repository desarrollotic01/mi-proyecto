import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

/* ================= HELPERS ================= */

const getEventColor = (estado) => {
  const colors = {
    "CREADO": "#3b82f6",
    "LIBERADO": "#8b5cf6",
    "CIERRE_TECNICO": "#f59e0b",
    "CERRADO": "#10b981",
    "CANCELADO": "#ef4444"
  };
  return colors[estado] || colors.CREADO;
};

const getEventTextColor = (estado) => {
  return "#ffffff";
};

const addOneDayToDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

/* ================= COMPONENT ================= */

export default function CalendarioView({ ordenes, onViewOrden }) {
  const calendarRef = useRef(null);
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [estadoFilter, setEstadoFilter] = useState("TODOS");

  /* ================= CALENDAR EVENTS ================= */
  const calendarEvents = ordenes
    .filter(orden => estadoFilter === "TODOS" || orden.estado === estadoFilter)
    .map(orden => ({
      id: orden.id,
      title: `${orden.numeroOT || "Sin N°"} - ${orden.descripcionGeneral?.substring(0, 30) || "Sin desc."}`,
      start: orden.fechaProgramadaInicio ? orden.fechaProgramadaInicio.split('T')[0] : null,
      end: orden.fechaProgramadaFin ? addOneDayToDate(orden.fechaProgramadaFin.split('T')[0]) : null,
      allDay: true,
      backgroundColor: getEventColor(orden.estado),
      borderColor: getEventColor(orden.estado),
      textColor: getEventTextColor(orden.estado),
      extendedProps: {
        orden: orden
      }
    }))
    .filter(event => event.start); // Solo eventos con fecha de inicio

  /* ================= CHANGE VIEW ================= */
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(calendarView);
    }
  }, [calendarView]);

  /* ================= EVENT CLICK ================= */
  const handleEventClick = (info) => {
    const orden = info.event.extendedProps.orden;
    if (orden) {
      onViewOrden(orden);
    }
  };

  const estados = ["TODOS", "CREADO", "LIBERADO", "CIERRE_TECNICO", "CERRADO", "CANCELADO"];

  return (
    <div className="space-y-4">
      {/* CONTROLS */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-3 items-center">
          {/* VIEW SELECTOR */}
          <div className="flex gap-2">
            {[
              { value: "dayGridMonth", label: "📅 Mes", icon: "📅" },
              { value: "dayGridWeek", label: "📆 Semana", icon: "📆" },
              { value: "timeGridWeek", label: "🕐 Horario", icon: "🕐" }
            ].map(view => (
              <button
                key={view.value}
                onClick={() => setCalendarView(view.value)}
                className={`
                  px-4 py-2 rounded-xl font-semibold transition-all duration-300
                  ${calendarView === view.value
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500"
                  }
                `}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* ESTADO FILTER */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="
              px-4 py-2
              bg-white border-2 border-slate-200
              rounded-xl
              focus:border-blue-500 focus:ring-4 focus:ring-blue-100
              transition-all duration-200
              font-medium text-slate-700
              cursor-pointer
            "
          >
            {estados.map(estado => (
              <option key={estado} value={estado}>
                {estado === "TODOS" ? "📊 Todos los Estados" : estado.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* EVENT COUNT */}
          <div className="ml-auto bg-white px-4 py-2 rounded-xl border-2 border-slate-200 font-semibold text-slate-700">
            <span className="text-blue-600">{calendarEvents.length}</span> eventos
          </div>
        </div>

        {/* LEGEND */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Leyenda de Estados</p>
          <div className="flex flex-wrap gap-3">
            {[
              { estado: "CREADO", label: "Creado" },
              { estado: "LIBERADO", label: "Liberado" },
              { estado: "CIERRE_TECNICO", label: "Cierre Técnico" },
              { estado: "CERRADO", label: "Cerrado" },
              { estado: "CANCELADO", label: "Cancelado" }
            ].map(({ estado, label }) => (
              <div key={estado} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2 border-white shadow-sm"
                  style={{ backgroundColor: getEventColor(estado) }}
                ></div>
                <span className="text-sm text-slate-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          locale={esLocale}
          events={calendarEvents}
          height="80vh"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          }}
          eventClick={handleEventClick}
          eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
          dayCellClassNames="hover:bg-slate-50 transition-colors"
          nowIndicator={true}
          navLinks={true}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          eventDisplay="block"
          displayEventTime={false}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
        />
      </div>

      {/* EMPTY STATE */}
      {calendarEvents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-400">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg font-medium">No hay órdenes en este calendario</p>
            <p className="text-sm">Ajusta los filtros para ver más eventos</p>
          </div>
        </div>
      )}
    </div>
  );
}