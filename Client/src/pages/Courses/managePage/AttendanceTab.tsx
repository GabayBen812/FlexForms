import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { courseEnrollmentsApi } from "@/api/course-enrollments";
import { courseScheduleApi } from "@/api/courses/schedule";
import { courseAttendanceApi } from "@/api/course-attendance";
import { CourseEnrollment } from "@/types/courses/CourseEnrollment";
import { CourseAttendance, CreateCourseAttendanceDto } from "@/types/courses/CourseAttendance";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { getCourseScheduleDates, getDefaultAttendanceDate } from "@/lib/courseDateUtils";
import { toast } from "@/hooks/use-toast";
import { MutationResponse } from "@/types/api/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/he";
import "dayjs/locale/en";

interface AttendanceTabProps {
  courseId: string;
}

interface AttendanceRow {
  _id?: string;
  kidId: string;
  kidName: string;
  attended: boolean;
  notes?: string;
  enrollment: CourseEnrollment;
}

export function AttendanceTab({ courseId }: AttendanceTabProps) {
  const { t, i18n } = useTranslation();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Configure dayjs locale based on current language
  useEffect(() => {
    const locale = i18n.language === "he" ? "he" : "en";
    dayjs.locale(locale);
  }, [i18n.language]);

  // Fetch course schedule
  const { data: schedulesData, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["course", courseId, "schedule"],
    queryFn: async () => {
      const response = await courseScheduleApi.fetchSchedule(courseId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
  });

  // Calculate available dates and default date
  const availableDates = useMemo(() => {
    if (!schedulesData || schedulesData.length === 0) {
      return [];
    }
    return getCourseScheduleDates(schedulesData);
  }, [schedulesData]);

  const defaultDate = useMemo(() => {
    if (!schedulesData || schedulesData.length === 0) {
      return new Date();
    }
    return getDefaultAttendanceDate(schedulesData);
  }, [schedulesData]);

  // Set default date on mount
  useEffect(() => {
    if (defaultDate && !selectedDate) {
      setSelectedDate(defaultDate);
    }
  }, [defaultDate, selectedDate]);

  // Fetch course participants
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["course-enrollments", courseId],
    queryFn: async () => {
      if (!organization?._id || !courseId) {
        return [];
      }
      const response = (await courseEnrollmentsApi.fetchAll(
        { courseId },
        false,
        organization._id
      )) as MutationResponse<CourseEnrollment[]>;
      return response.data || [];
    },
    enabled: !!organization?._id && !!courseId,
  });

  // Fetch attendance for selected date
  const selectedDateISO = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : null;
  const { data: attendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ["course-attendance", courseId, selectedDateISO],
    queryFn: async () => {
      if (!selectedDateISO || !organization?._id) {
        return [];
      }
      const response = await courseAttendanceApi.fetchByCourseAndDate(courseId, selectedDateISO);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    enabled: !!selectedDateISO && !!organization?._id,
  });

  // Merge participants with attendance data
  const tableData = useMemo<AttendanceRow[]>(() => {
    if (!enrollmentsData || enrollmentsData.length === 0) {
      return [];
    }

    const attendanceMap = new Map<string, CourseAttendance>();
    if (attendanceData) {
      attendanceData.forEach((attendance) => {
        const kidId = typeof attendance.kidId === "string" 
          ? attendance.kidId 
          : (attendance.kidId && typeof attendance.kidId === "object" && "_id" in attendance.kidId)
            ? (attendance.kidId as { _id?: string })._id || ""
            : "";
        if (kidId) {
          attendanceMap.set(kidId, attendance);
        }
      });
    }

    return enrollmentsData.map((enrollment) => {
      const kidData =
        enrollment.kid ??
        (typeof enrollment.kidId === "object" && enrollment.kidId !== null
          ? enrollment.kidId
          : null);

      const kidId = typeof enrollment.kidId === "string" ? enrollment.kidId : enrollment.kidId?._id || "";
      const kidName = kidData && (kidData.firstname || kidData.lastname)
        ? `${kidData.firstname ?? ""} ${kidData.lastname ?? ""}`.trim()
        : t("unknown");

      const attendance = attendanceMap.get(kidId);

      return {
        _id: attendance?._id,
        kidId,
        kidName,
        attended: attendance?.attended ?? false,
        notes: attendance?.notes ?? "",
        enrollment,
      };
    });
  }, [enrollmentsData, attendanceData, t]);

  const columns: ColumnDef<AttendanceRow>[] = useMemo(() => {
    return [
      {
        accessorKey: "kidName",
        header: t("full_name"),
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium border",
                  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                )}
              >
                <span>{row.original.kidName}</span>
              </div>
            </div>
          );
        },
        meta: {
          editable: false,
        },
      },
      {
        accessorKey: "attended",
        header: t("attended"),
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              {row.original.attended ? "✓" : ""}
            </div>
          );
        },
        meta: {
          editable: true,
          fieldType: "CHECKBOX",
        },
      },
      {
        accessorKey: "notes",
        header: t("notes"),
        size: 300,
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              {row.original.notes || ""}
            </div>
          );
        },
        meta: {
          editable: true,
          fieldType: "TEXT",
        },
      },
    ];
  }, [t]);

  const fetchAttendanceData = useCallback(
    async (params?: ApiQueryParams): Promise<ApiResponse<AttendanceRow>> => {
      return {
        data: tableData,
        totalCount: tableData.length,
        totalPages: 1,
      } as ApiResponse<AttendanceRow>;
    },
    [tableData]
  );

  // Debounce timer ref
  const saveTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Debounced save function
  const debouncedSave = useCallback(
    async (row: AttendanceRow, updates: Partial<AttendanceRow>) => {
      if (!organization?._id || !selectedDateISO) {
        return;
      }

      // Clear existing timer for this row
      const existingTimer = saveTimerRef.current.get(row.kidId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const attendanceDto: CreateCourseAttendanceDto = {
          organizationId: organization._id,
          courseId,
          kidId: row.kidId,
          date: selectedDateISO,
          attended: updates.attended ?? row.attended,
          notes: updates.notes ?? row.notes,
        };

        const response = await courseAttendanceApi.createOrUpdate(attendanceDto);
        if (response.error) {
          toast({
            title: t("error"),
            description: response.error,
            variant: "destructive",
          });
          return;
        }

        // Invalidate and refetch attendance data
        await queryClient.invalidateQueries({
          queryKey: ["course-attendance", courseId, selectedDateISO],
        });

        saveTimerRef.current.delete(row.kidId);
      }, 500);

      saveTimerRef.current.set(row.kidId, timer);
    },
    [organization?._id, selectedDateISO, courseId, queryClient, t]
  );

  const handleUpdateAttendance = useCallback(
    async (updatedData: Partial<AttendanceRow> & { id?: string | number }): Promise<MutationResponse<AttendanceRow>> => {
      const id = updatedData.id || updatedData.kidId;
      if (!id) {
        throw new Error(t("row_id_not_found"));
      }

      const row = tableData.find((r) => r._id === id || r.kidId === id);
      if (!row) {
        throw new Error(t("row_not_found"));
      }

      // Extract only the changed fields (exclude id)
      const { id: _, ...updates } = updatedData;
      
      // Update React Query cache optimistically so the UI updates immediately
      if (selectedDateISO) {
        queryClient.setQueryData<CourseAttendance[]>(
          ["course-attendance", courseId, selectedDateISO],
          (oldData) => {
            // If oldData is undefined, create a new array with the updated attendance
            if (!oldData) {
              const kidId = typeof id === "string" ? id : String(id);
              const newAttendance: CourseAttendance = {
                _id: row._id || undefined,
                organizationId: organization?._id || "",
                courseId,
                kidId: kidId,
                date: selectedDateISO,
                attended: updates.attended ?? row.attended ?? false,
                notes: updates.notes ?? row.notes ?? "",
              } as CourseAttendance;
              return [newAttendance];
            }
            
            const kidId = typeof id === "string" ? id : String(id);
            const existingIndex = oldData.findIndex((attendance) => {
              const attKidId = typeof attendance.kidId === "string" 
                ? attendance.kidId 
                : (attendance.kidId && typeof attendance.kidId === "object" && "_id" in attendance.kidId)
                  ? (attendance.kidId as { _id?: string })._id || ""
                  : "";
              return attKidId === kidId;
            });

            const baseAttendance = existingIndex >= 0 
              ? oldData[existingIndex] 
              : {
                  _id: row._id || undefined,
                  organizationId: organization?._id || "",
                  courseId,
                  kidId: kidId,
                  date: selectedDateISO,
                  attended: row.attended ?? false,
                  notes: row.notes ?? "",
                };

            const updatedAttendance: CourseAttendance = {
              ...baseAttendance,
              attended: updates.attended !== undefined ? updates.attended : baseAttendance.attended ?? false,
              notes: updates.notes !== undefined ? (updates.notes ?? "") : (baseAttendance.notes ?? ""),
            } as CourseAttendance;

            if (existingIndex >= 0) {
              // Update existing attendance
              const newData = [...oldData];
              newData[existingIndex] = updatedAttendance;
              return newData;
            } else {
              // Add new attendance
              return [...oldData, updatedAttendance];
            }
          }
        );
      }

      // Save to server after debounce
      await debouncedSave(row, updates);

      return {
        status: 200,
        data: { ...row, ...updates } as AttendanceRow,
      };
    },
    [tableData, debouncedSave, selectedDateISO, attendanceData, courseId, organization?._id, queryClient]
  );

  const handleDateChange = (dateStr: string) => {
    const date = dayjs(dateStr).toDate();
    setSelectedDate(date);
  };

  const isLoading = isLoadingSchedule || isLoadingEnrollments || isLoadingAttendance;

  if (isLoading) {
    return <div className="p-4">{t("loading")}</div>;
  }

  if (!schedulesData || schedulesData.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        {t("no_schedule_configured")}
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        {t("no_scheduled_dates")}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center px-4">
        <div className="w-full max-w-[1400px]">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <Label htmlFor="attendance-date">{t("select_date")}</Label>
              <Select
                value={selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : undefined}
                onValueChange={handleDateChange}
              >
                <SelectTrigger id="attendance-date" className="w-full sm:w-[300px] mt-2">
                  <SelectValue placeholder={t("select_date")}>
                    {selectedDate && (
                      <>
                        {formatDateForDisplay(dayjs(selectedDate).format("YYYY-MM-DD"))} - {dayjs(selectedDate).format("dddd")}
                      </>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => {
                    const dateStr = dayjs(date).format("YYYY-MM-DD");
                    const displayDate = formatDateForDisplay(dateStr);
                    const dayName = dayjs(date).format("dddd");
                    return (
                      <SelectItem key={dateStr} value={dateStr}>
                        {displayDate} - {dayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedDate && (
              <div className="mt-6">
                <DataTable<AttendanceRow>
                  data={[]}
                  fetchData={fetchAttendanceData}
                  columns={columns}
                  updateData={handleUpdateAttendance}
                  deleteData={async () => {
                    return { status: 200, data: {} as AttendanceRow };
                  }}
                  showAddButton={false}
                  showEditButton={false}
                  showDeleteButton={false}
                  defaultPageSize={10}
                  showPageSizeSelector={false}
                  idField="kidId"
                  searchable={false}
                  contentHeight="auto"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

