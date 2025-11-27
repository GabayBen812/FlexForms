import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { coursesApi } from "@/api/courses";
import { Course } from "@/types/courses/Course";

export default function Courses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organization } = useOrganization();

  const handleCourseClick = (course: Course) => {
    if (course && course._id) {
      navigate(`/courses/${course._id}/manage`);
    }
  };

  const columns = useMemo<ColumnDef<Course>[]>(() => [
    {
      accessorKey: "name",
      header: t("activity_name"),
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div
            className="w-full text-center cursor-pointer text-primary hover:text-primary/80 hover:underline transition-colors text-lg font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleCourseClick(course);
            }}
          >
            {course.name}
          </div>
        );
      },
      size: 400,
      minSize: 350,
      meta: { editable: false },
    },
    {
      accessorKey: "participantsCount",
      header: t("participants_count"),
      cell: ({ row }) => {
        // TODO: Replace with actual participants count when available
        return (
          <div className="w-full text-center">
            0
          </div>
        );
      },
      size: 200,
      minSize: 180,
      meta: { editable: false },
    },
  ], [t]);

  const wrappedFetchData = useCallback(
    async (params: any) => {
      if (!organization?._id) {
        return Promise.resolve({
          status: 200,
          data: [],
          totalCount: 0,
          totalPages: 0,
        });
      }

      const pageSize = params.pageSize || 10;
      const page = params.page || 1;

      try {
        const response = await coursesApi.fetchAll(
          {
            ...params,
            pageSize,
            page,
            organizationId: organization._id,
          },
          false,
          organization._id
        );

        // Handle both ApiResponse and MutationResponse types
        const courses = Array.isArray(response.data)
          ? response.data
          : [];

        // Return in the format expected by DataTable
        return {
          //@ts-ignore
          status: response.status || 200,
          data: courses,
          //@ts-ignore
          totalCount: response.totalCount || courses.length,
          //@ts-ignore
          totalPages: response.totalPages || Math.ceil(courses.length / pageSize),
        };
      } catch (error) {
        console.error("Error fetching courses:", error);
        return {
          status: 500,
          data: [],
          totalCount: 0,
          totalPages: 0,
        };
      }
    },
    [organization?._id]
  );

  const handleUpdateCourse = useCallback(
    async (data: Partial<Course> & { id: string | number }) => {
      return coursesApi.update({ ...data, id: data._id || data.id });
    },
    []
  );

  const handleDeleteCourse = useCallback(
    async (id: string | number) => {
      return coursesApi.delete(id);
    },
    []
  );

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center px-4">
        <div className="mb-6 flex w-full items-center justify-between">
          <h1 className="text-center text-2xl font-semibold text-primary">
            {t("courses")}
          </h1>
          <Button onClick={() => navigate("/courses/create")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("create_new_course")}
          </Button>
        </div>
        <div className="w-full max-w-[1400px]">
          <DataTable<Course>
            data={[]}
            fetchData={wrappedFetchData}
            updateData={handleUpdateCourse}
            deleteData={handleDeleteCourse}
            columns={columns}
            searchable
            showAddButton={false}
            defaultPageSize={10}
            idField="_id"
            onRowClick={handleCourseClick}
            isPagination={true}
            isLazyLoading={true}
          />
        </div>
      </div>
    </div>
  );
}
