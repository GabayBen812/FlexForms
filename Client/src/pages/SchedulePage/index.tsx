import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { EventInput } from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import heLocale from "@fullcalendar/core/locales/he";

export default function SchedulePage() {
  const { t, i18n } = useTranslation();

  const calendarEvents = useMemo<EventInput[]>(() => [], []);

  const direction = i18n.dir(i18n.language);

  return (
    <div className="mx-auto w-full space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t("schedule")}</h1>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <FullCalendar
          key={i18n.language}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={[heLocale]}
          locale={i18n.language}
          direction={direction}
          height="auto"
          headerToolbar={{
            left: direction === "rtl" ? "next,prev today" : "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={calendarEvents}
          buttonText={{
            today: t("today"),
            month: t("calendar_month"),
            week: t("calendar_week"),
            day: t("calendar_day"),
          }}
        />
      </div>
    </div>
  );
}
