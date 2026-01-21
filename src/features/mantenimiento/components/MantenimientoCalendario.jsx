import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { ESTADOS_AV } from "../config/camposMantenimiento";

export default function MantenimientoCalendario({
  calendarRef,
  calendarView,
  setCalendarView,
  filteredCalendarEvents,
}) {
  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex justify-start mb-2 gap-2">
        <button
          onClick={() => setCalendarView("dayGridMonth")}
          className="px-3 py-1 text-sm rounded border"
        >
          Mes
        </button>
        <button
          onClick={() => setCalendarView("dayGridWeek")}
          className="px-3 py-1 text-sm rounded border"
        >
          Semana
        </button>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={calendarView}
        locale={esLocale}
        events={filteredCalendarEvents.map((ev) => ({
          ...ev,
          backgroundColor:
            ESTADOS_AV[ev.extendedProps.estadoAviso]?.color,
          textColor:
            ESTADOS_AV[ev.extendedProps.estadoAviso]?.text,
        }))}
        height="80vh"
      />
    </div>
  );
}