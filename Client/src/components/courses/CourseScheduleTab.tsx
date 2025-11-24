import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { courseScheduleApi } from "@/api/courses/schedule";
import { CreateCourseScheduleDto } from "@/types/courses/Course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/date-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import dayjs from "dayjs";

interface CourseScheduleTabProps {
  courseId: string;
}

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

const scheduleItemSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
}).refine(
  (data) => {
    const [startHours, startMinutes] = data.startTime.split(":").map(Number);
    const [endHours, endMinutes] = data.endTime.split(":").map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    return endTotal > startTotal;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

const formSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  schedules: z.array(scheduleItemSchema).min(1, "At least one schedule is required"),
}).refine(
  (data) => {
    const startDate = dayjs(data.startDate);
    const endDate = dayjs(data.endDate);
    return endDate.isAfter(startDate) || endDate.isSame(startDate, "day");
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

type FormData = z.infer<typeof formSchema>;

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function CourseScheduleTab({ courseId }: CourseScheduleTabProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const { organization } = useOrganization();

  const {
    data: schedulesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", courseId, "schedule"],
    queryFn: async () => {
      const response = await courseScheduleApi.fetchSchedule(courseId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      schedules: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  const getDayLabel = (value: number) => {
    const fallback = DAYS_OF_WEEK.find((day) => day.value === value)?.label ?? "";
    return t(`day_${value}`, { defaultValue: fallback });
  };

  const getDefaultDayOfWeek = () => {
    const currentSchedules = form.getValues("schedules") || [];
    const usedDays = new Set(currentSchedules.map((schedule) => schedule.dayOfWeek));
    const availableDay = DAYS_OF_WEEK.find((day) => !usedDays.has(day.value));
    return availableDay?.value ?? DAYS_OF_WEEK[0].value;
  };

  const handleDuplicateSchedule = (index: number) => {
    const schedule = form.getValues(`schedules.${index}`);
    if (schedule) {
      append({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
    }
  };

  // Initialize form with existing data
  useEffect(() => {
    if (schedulesData && schedulesData.length > 0 && !isInitialized) {
      // Get the date range from the first schedule (all should have the same range)
      const firstSchedule = schedulesData[0];
      const startDate = dayjs(firstSchedule.startDate).format("YYYY-MM-DD");
      const endDate = dayjs(firstSchedule.endDate).format("YYYY-MM-DD");

      form.reset({
        startDate,
        endDate,
        schedules: schedulesData.map((schedule) => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })),
      });
      setIsInitialized(true);
    } else if (schedulesData && schedulesData.length === 0 && !isInitialized) {
      // No existing schedules, set default date range (next month to next year)
      const startDate = dayjs().add(1, "month").startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs().add(1, "year").endOf("year").format("YYYY-MM-DD");
      form.reset({
        startDate,
        endDate,
        schedules: [],
      });
      setIsInitialized(true);
    }
  }, [schedulesData, form, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!organization?._id) {
        throw new Error(
          t("organization_required", {
            defaultValue: "Organization context is missing",
          })
        );
      }

      const schedules: CreateCourseScheduleDto[] = data.schedules.map((schedule) => ({
        courseId,
        organizationId: organization._id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        startDate: dayjs(data.startDate).toISOString(),
        endDate: dayjs(data.endDate).toISOString(),
      }));

      const response = await courseScheduleApi.saveSchedule(
        courseId,
        organization._id,
        schedules
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId, "schedule"] });
      toast({
        title: t("schedule_saved_successfully", {
          defaultValue: "Schedule saved successfully",
        }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error_saving_schedule", {
          defaultValue: "Error saving schedule",
        }),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!organization?._id) {
      toast({
        title: t("organization_required", {
          defaultValue: "Organization context is missing",
        }),
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(data);
  };

  const handleAddSchedule = () => {
    append({
      dayOfWeek: getDefaultDayOfWeek(),
      startTime: "09:00",
      endTime: "10:00",
    });
  };

  const hasSchedules = fields.length > 0;

  if (isLoading) {
    return (
      <div className="p-4">
        {t("loading", { defaultValue: "Loading..." })}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        {t("error_loading_schedule", { defaultValue: "Error loading schedule" })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("course_schedule_settings", {
                defaultValue: "Course Schedule Settings",
              })}
            </CardTitle>
            <CardDescription>
              {t("course_schedule_settings_helper", {
                defaultValue: "Set the overall date range for the course.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  {t("schedule_start_date", {
                    defaultValue: "Schedule Start Date",
                  })}
                </Label>
                <Controller
                  name="startDate"
                  control={form.control}
                  render={({ field }) => (
                    <DateInput
                      id="startDate"
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                      required
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {t("schedule_start_date_helper", {
                    defaultValue: "Pick the first day sessions can take place.",
                  })}
                </p>
                {form.formState.errors.startDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  {t("schedule_end_date", {
                    defaultValue: "Schedule End Date",
                  })}
                </Label>
                <Controller
                  name="endDate"
                  control={form.control}
                  render={({ field }) => (
                    <DateInput
                      id="endDate"
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                      required
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {t("schedule_end_date_helper", {
                    defaultValue: "Sessions will stop automatically after this day.",
                  })}
                </p>
                {form.formState.errors.endDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle>
                {t("weekly_schedule", { defaultValue: "Weekly Schedule" })}
              </CardTitle>
              <CardDescription>
                {t("weekly_schedule_helper", {
                  defaultValue: "Add the days and times this course meets.",
                })}
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                {t("schedule_action_bar_hint", {
                  defaultValue: 'Use "Add day" to build the weekly pattern.',
                })}
              </p>
            </div>
            <div className="flex justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSchedule}
                size="lg"
                className="min-w-[200px]"
              >
                <Plus className="mr-2 h-5 w-5" />
                {t("add_day", { defaultValue: "Add Day" })}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasSchedules && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("no_schedule_items", {
                  defaultValue: 'No schedule items yet. Click "Add day" to get started.',
                })}
              </div>
            )}

            {fields.map((field, index) => {
              const dayValue = form.watch(`schedules.${index}.dayOfWeek`);

              return (
                <Card key={field.id} className="border border-muted/40">
                  <CardHeader className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {dayValue !== undefined
                          ? getDayLabel(dayValue)
                          : t("day_of_week", { defaultValue: "Day of Week" })}
                      </CardTitle>
                      <CardDescription>
                        {t("schedule_day_label", {
                          defaultValue: "Meeting day",
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDuplicateSchedule(index)}
                        aria-label={t("schedule_day_duplicate", {
                          defaultValue: "Duplicate this day",
                        })}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label={t("schedule_day_delete", {
                          defaultValue: "Remove this day",
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>
                        {t("day_of_week", { defaultValue: "Day of Week" })}
                      </Label>
                      <Select
                        value={
                          dayValue !== undefined ? String(dayValue) : undefined
                        }
                        onValueChange={(value) =>
                          form.setValue(
                            `schedules.${index}.dayOfWeek`,
                            Number(value)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("day_of_week", {
                              defaultValue: "Day of Week",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem
                              key={day.value}
                              value={String(day.value)}
                            >
                              {t(`day_${day.value}`, {
                                defaultValue: day.label,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.schedules?.[index]?.dayOfWeek && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.schedules[index]?.dayOfWeek
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {t("start_time", { defaultValue: "Start Time" })}
                      </Label>
                      <Input
                        type="time"
                        value={form.watch(`schedules.${index}.startTime`) || ""}
                        onChange={(e) =>
                          form.setValue(
                            `schedules.${index}.startTime`,
                            e.target.value
                          )
                        }
                        required
                      />
                      {form.formState.errors.schedules?.[index]?.startTime && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.schedules[index]?.startTime
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {t("end_time", { defaultValue: "End Time" })}
                      </Label>
                      <Input
                        type="time"
                        value={form.watch(`schedules.${index}.endTime`) || ""}
                        onChange={(e) =>
                          form.setValue(
                            `schedules.${index}.endTime`,
                            e.target.value
                          )
                        }
                        required
                      />
                      {form.formState.errors.schedules?.[index]?.endTime && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.schedules[index]?.endTime
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {t("schedule_time_helper", {
                        defaultValue: "Times use the HH:MM format.",
                      })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            {form.formState.errors.schedules && (
              <p className="text-sm text-destructive">
                {form.formState.errors.schedules.message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={saveMutation.isPending || !hasSchedules}
            size="lg"
            className="min-w-[200px]"
          >
            <Save className="mr-2 h-5 w-5" />
            {saveMutation.isPending
              ? t("saving", { defaultValue: "Saving..." })
              : t("save_schedule", { defaultValue: "Save Schedule" })}
          </Button>
        </div>
      </form>
    </div>
  );
}

