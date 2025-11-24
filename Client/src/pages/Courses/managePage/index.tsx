import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { coursesApi } from "@/api/courses";
import { Course } from "@/types/courses/Course";
import { CourseScheduleTab } from "@/components/courses/CourseScheduleTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { SessionsTab } from "./SessionsTab";
import { AttendanceTab } from "./AttendanceTab";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export default function CourseManagement() {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "participants";
  });
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (courseId) {
      setIsLoading(true);
      setError(null);
      coursesApi.fetch(courseId)
        .then((res) => {
          if (res.error) {
            setError(res.error);
            setCourse(null);
          } else if (res.data) {
            setCourse(res.data);
            setError(null);
          } else {
            setError(t("error") || "Failed to load course");
            setCourse(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching course:", err);
          setError(err.message || t("error") || "Failed to load course");
          setCourse(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [courseId, t]);

  // Sync URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Initialize tab from URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && ["participants", "schedule", "attendance", "meetings"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, []); // Only on mount

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  const handleCancelNameEdit = () => {
    if (!course) return;
    setEditedName(course.name);
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!course) return;
    const trimmedName = editedName.trim();

    if (!trimmedName) {
      toast({
        variant: "destructive",
        title: t("course_name_required") || "Course name is required",
      });
      return;
    }

    if (trimmedName === course.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);

    try {
      const result = await coursesApi.update({
        id: course._id,
        name: trimmedName,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setCourse((prev) => (prev ? { ...prev, name: trimmedName } : prev));
      setIsEditingName(false);
      toast({
        title: t("course_name_update_success") || "Course name updated successfully",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("course_name_update_error");
      toast({
        variant: "destructive",
        title: t("course_name_update_error") || "Failed to update course name",
        description: message,
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveName();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleCancelNameEdit();
    }
  };

  if (isLoading) {
    return <div className="p-6">{t("loading")}...</div>;
  }

  if (error || !course) {
    return (
      <div className="p-6">
        <div className="text-destructive">
          {error || t("error_loading_course") || "Failed to load course"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        {isEditingName ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={nameInputRef}
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
              onKeyDown={handleNameKeyDown}
              disabled={isSavingName}
              className="text-2xl font-semibold text-primary border border-border rounded-md px-3 py-2 w-full sm:w-auto"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="text-green-600 hover:text-green-700"
                onClick={handleSaveName}
                disabled={isSavingName}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={handleCancelNameEdit}
                disabled={isSavingName}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="group inline-flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => {
                    setEditedName(course.name);
                    setIsEditingName(true);
                  }}
                >
                  <h1 className="text-2xl font-semibold text-primary">
                    {course.name}
                  </h1>
                  <Pencil className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("click_to_edit") || "Click to edit"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
        dir={direction}
      >
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger variant={"boxed"} value="participants">
            {t("course_participants")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="schedule">
            {t("course_schedule_settings")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="attendance">
            {t("attendance_registration")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="meetings">
            {t("list_of_meetings")}
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-4 mt-5">
          

          <TabsContent value="participants">
            {courseId && <ParticipantsTab courseId={courseId} />}
          </TabsContent>

          <TabsContent value="schedule">
            {courseId && <CourseScheduleTab courseId={courseId} />}
          </TabsContent>

          <TabsContent value="attendance">
            {courseId && <AttendanceTab courseId={courseId} />}
          </TabsContent>

          <TabsContent value="meetings">
            {courseId && <SessionsTab courseId={courseId} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

