import { useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { courseEnrollmentsApi } from "@/api/course-enrollments";
import { CourseEnrollment } from "@/types/courses/CourseEnrollment";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddChildDialog } from "./AddChildDialog";
import { toast } from "@/hooks/use-toast";
import { MutationResponse } from "@/types/api/auth";
import { cn } from "@/lib/utils";

interface ParticipantsTabProps {
  courseId: string;
}

export function ParticipantsTab({ courseId }: ParticipantsTabProps) {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: CourseEnrollment) => void;
    updateItem: (item: CourseEnrollment) => void;
  } | null>(null);

  const columns: ColumnDef<CourseEnrollment>[] = useMemo(() => {
    const getKidFullName = (enrollment: CourseEnrollment) => {
      const kidData =
        enrollment.kid ??
        (typeof enrollment.kidId === "object" && enrollment.kidId !== null
          ? enrollment.kidId
          : null);

      if (kidData && (kidData.firstname || kidData.lastname)) {
        return `${kidData.firstname ?? ""} ${kidData.lastname ?? ""}`.trim();
      }

      return t("unknown") || "-";
    };

    return [
      {
        accessorKey: "kid",
        header: t("kid_name") || "Kid Name",
        cell: ({ row }) => {
          const kidName = getKidFullName(row.original);
          return (
            <div className="flex justify-center">
              <div
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border",
                  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                )}
              >
                <span>{kidName}</span>
              </div>
            </div>
          );
        },
        meta: {
          editable: false,
        },
        size: 400,
        minSize: 250,
      },
      {
        accessorKey: "enrollmentDate",
        header: t("enrollment_date") || "Enrollment Date",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatDateForDisplay(row.original.enrollmentDate)}
          </span>
        ),
        meta: {
          isDate: true,
          editable: false,
        },
        size: 300,
        minSize: 200,
      },
    ];
  }, [t]);

  const fetchEnrollmentsData = useCallback(
    async (params?: ApiQueryParams): Promise<ApiResponse<CourseEnrollment>> => {
      if (!organization?._id || !courseId) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<CourseEnrollment>;
      }

      const response = (await courseEnrollmentsApi.fetchAll(
        {
          ...params,
          courseId,
        },
        false,
        organization._id
      )) as MutationResponse<CourseEnrollment[]>;

      if (response.error) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<CourseEnrollment>;
      }

      const enrollments = Array.isArray(response.data) ? response.data : [];
      
      return {
        data: enrollments,
        totalCount: enrollments.length,
        totalPages: 1,
      } as ApiResponse<CourseEnrollment>;
    },
    [organization?._id, courseId]
  );

  const handleDeleteEnrollment = useCallback(
    async (id: string | number): Promise<MutationResponse<CourseEnrollment>> => {
      const response = (await courseEnrollmentsApi.delete(id)) as MutationResponse<CourseEnrollment>;
      if (response.error) {
        toast({
          title: t("error") || "Error",
          description: response.error,
          variant: "destructive",
        });
        throw new Error(response.error);
      }
      await queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
      return response;
    },
    [courseId, queryClient, t]
  );

  const handleAddChild = useCallback(
    async (kidId: string) => {
      if (!organization?._id || !courseId) {
        toast({
          title: t("error") || "Error",
          description: t("missing_required_fields") || "Missing required fields",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await courseEnrollmentsApi.create({
          organizationId: organization._id,
          courseId,
          kidId,
          enrollmentDate: new Date().toISOString(),
        });

        if (response.error) {
          toast({
            title: t("error") || "Error",
            description: response.error,
            variant: "destructive",
          });
          return;
        }

        if (response.data) {
          toast({
            title: t("success") || "Success",
            description: t("child_added_successfully") || "Child added successfully",
          });
          setIsAddDialogOpen(false);
          tableMethods?.addItem(response.data);
          queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
        }
      } catch (error) {
        console.error("Error adding child:", error);
        toast({
          title: t("error") || "Error",
          description: error instanceof Error ? error.message : t("failed_to_add_child") || "Failed to add child",
          variant: "destructive",
        });
      }
    },
    [organization?._id, courseId, tableMethods, queryClient, t]
  );

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-6">
            <Button onClick={() => setIsAddDialogOpen(true)} className="self-start">
              <Plus className="h-4 w-4 mr-2" />
              {t("add_child") || "Add Child"}
            </Button>
          </div>

          <div className="w-full">
            <DataTable<CourseEnrollment>
              data={[]}
              fetchData={fetchEnrollmentsData}
              columns={columns}
              updateData={async () => {
                // Not needed for now
                return { status: 200, data: {} as CourseEnrollment };
              }}
              deleteData={handleDeleteEnrollment}
              showAddButton={false}
              showEditButton={false}
              showDeleteButton={true}
              defaultPageSize={10}
              showPageSizeSelector={false}
              onRefreshReady={setTableMethods}
              idField="_id"
              searchable={false}
              contentHeight="auto"
            />
          </div>
        </div>

        <AddChildDialog
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSelect={handleAddChild}
          courseId={courseId}
        />
      </div>
    </div>
  );
}

