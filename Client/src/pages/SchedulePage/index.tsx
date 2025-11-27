import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventInput } from "@fullcalendar/core";
import type { EventDragStopArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import heLocale from "@fullcalendar/core/locales/he";
import { courseSessionsApi } from "@/api/course-sessions";
import { coursesApi } from "@/api/courses";
import { useOrganization } from "@/hooks/useOrganization";
import type { CourseSession, CourseSessionStatus } from "@/types/courses/CourseSession";
import type { Course } from "@/types/courses/Course";
import type { MutationResponse } from "@/types/api/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

export default function SchedulePage() {
  const { t, i18n } = useTranslation();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isError: sessionsError,
    error: sessionsErrorData,
  } = useQuery<CourseSession[]>({
    queryKey: ["schedule-sessions", organization?._id],
    enabled: !!organization?._id,
    queryFn: async () => {
      const response = (await courseSessionsApi.fetchAll(
        {},
        false,
        organization?._id
      )) as MutationResponse<CourseSession[]>;

      if (response.error) {
        throw new Error(response.error);
      }

      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErrorData,
  } = useQuery<Course[]>({
    queryKey: ["schedule-courses", organization?._id],
    enabled: !!organization?._id,
    queryFn: async () => {
      const response = (await coursesApi.fetchAll(
        {},
        false,
        organization?._id
      )) as MutationResponse<Course[]>;

      if (response.error) {
        throw new Error(response.error);
      }

      const coursesData = Array.isArray(response.data) ? response.data : [];
      return coursesData;
    },
  });

  const courseNameMap = useMemo<Record<string, string>>(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return {};
    }
    
    const map: Record<string, string> = {};
    courses.forEach((course) => {
      if (course?._id && course?.name) {
        // Handle both string and ObjectId formats
        const courseId = String(course._id);
        map[courseId] = course.name;
        // Also add without string conversion in case it's already a string
        if (typeof course._id === 'string') {
          map[course._id] = course.name;
        }
      }
    });
    
    return map;
  }, [courses]);

  const courseColorMap = useMemo<Record<string, string>>(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return {};
    }
    
    const map: Record<string, string> = {};
    courses.forEach((course) => {
      if (course?._id && course?.color) {
        // Handle both string and ObjectId formats
        const courseId = String(course._id);
        map[courseId] = course.color;
        // Also add without string conversion in case it's already a string
        if (typeof course._id === 'string') {
          map[course._id] = course.color;
        }
      }
    });
    
    return map;
  }, [courses]);

  const getSessionColor = (status: CourseSessionStatus, courseId?: string | { _id?: string } | null) => {
    // First, try to get course color
    if (courseId) {
      let courseIdString: string | undefined;
      if (typeof courseId === 'string') {
        courseIdString = courseId;
      } else if (typeof courseId === 'object' && courseId._id) {
        courseIdString = String(courseId._id);
      }
      
      if (courseIdString && courseColorMap[courseIdString]) {
        return courseColorMap[courseIdString];
      }
    }
    
    // Fallback to status-based color
    switch (status) {
      case "CANCELLED":
        return "#ef4444"; // red-500
      case "MOVED":
        return "#a855f7"; // purple-500
      case "TIME_CHANGED":
        return "#f59e0b"; // amber-500
      case "NORMAL":
      default:
        return "#3b82f6"; // blue-500
    }
  };

  const calendarEvents = useMemo<EventInput[]>(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    if (coursesLoading) return []; // Wait for courses to load

    const sessionLabel = t("session") || t("common:session") || "Session";

    return sessions.map((session) => {
      // Handle populated courseId (can be object with _id and name, or just an ID string)
      let courseName = sessionLabel;
      const courseIdValue = session.courseId as string | { name: string; _id?: string } | null | undefined;
      
      if (courseIdValue) {
        // If courseId is populated (object with name property)
        if (typeof courseIdValue === 'object' && 'name' in courseIdValue) {
          courseName = courseIdValue.name || sessionLabel;
        } 
        // If courseId is a string/ID, try to find in map
        else if (typeof courseIdValue === 'string') {
          courseName = courseNameMap[courseIdValue] || sessionLabel;
        }
      }
      
      return {
        id: session._id,
        title: courseName,
        start: session.startDateTime,
        end: session.endDateTime,
        color: getSessionColor(session.status, session.courseId),
        extendedProps: session,
      };
    });
  }, [sessions, courseNameMap, courseColorMap, coursesLoading, t]);

  const updateSessionMutation = useMutation({
    mutationFn: async ({
      sessionId,
      startDateTime,
      endDateTime,
      date,
    }: {
      sessionId: string;
      startDateTime: string;
      endDateTime: string;
      date: string;
    }) => {
      const response = (await courseSessionsApi.update({
        id: sessionId,
        startDateTime,
        endDateTime,
        date,
      })) as MutationResponse<CourseSession>;

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-sessions", organization?._id] });
      toast({
        title: t("session_updated") || t("common:success") || "Session updated",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error_updating_session") || t("error") || "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEventDrop = async (info: EventDragStopArg) => {
    const event = info.event;
    const session = event.extendedProps as CourseSession;
    const revert = (info as any).revert as (() => void) | undefined;

    if (!session?._id || !event.start || !event.end) {
      revert?.();
      return;
    }

    const startDateTime = event.start.toISOString();
    const endDateTime = event.end.toISOString();
    const date = event.start.toISOString().split("T")[0];

    try {
      await updateSessionMutation.mutateAsync({
        sessionId: session._id,
        startDateTime,
        endDateTime,
        date,
      });
    } catch (error) {
      revert?.();
    }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const event = info.event;
    const session = event.extendedProps as CourseSession;
    const revert = (info as any).revert as (() => void) | undefined;

    if (!session?._id || !event.start || !event.end) {
      revert?.();
      return;
    }

    const startDateTime = event.start.toISOString();
    const endDateTime = event.end.toISOString();
    const date = event.start.toISOString().split("T")[0];

    try {
      await updateSessionMutation.mutateAsync({
        sessionId: session._id,
        startDateTime,
        endDateTime,
        date,
      });
    } catch (error) {
      revert?.();
    }
  };

  const direction = i18n.dir(i18n.language);

  return (
    <div className="mx-auto w-full space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t("schedule")}</h1>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        {sessionsError || coursesError ? (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive">
            {(sessionsError &&
              (t("error_loading_sessions") ||
                t("error") ||
                (sessionsErrorData as Error)?.message)) ||
              (coursesError &&
                (t("error_loading_courses") ||
                  t("error") ||
                  (coursesErrorData as Error)?.message)) ||
              "Failed to load calendar data"}
          </div>
        ) : null}
        {sessionsLoading || coursesLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
        <FullCalendar
          key={i18n.language}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locales={[heLocale]}
          locale={i18n.language}
          direction={direction}
          height="auto"
          headerToolbar={{
            left: direction === "rtl" ? "prev,next today" : "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={calendarEvents}
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          buttonText={{
            today: t("today"),
            month: t("calendar_month"),
            week: t("calendar_week"),
            day: t("calendar_day"),
          }}
        />
        )}
      </div>
    </div>
  );
}
