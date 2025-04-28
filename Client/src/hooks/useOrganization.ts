import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationResponse } from "@/types/api/auth";
import {
  NewOrganizationPayload,
  Organization,
  UpdateOrganizationPayload,
} from "@/types/api/organization";

import {
  fetchCallCategories,
  deleteCallCategory,
  createCallCategory,
} from "@/api/calls/categories";
import { Department } from "@/types/api/departments";
import {
  fetchDepartments,
  createNewDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/api/departments/index";
import { CallCategory } from "@/types/api/calls";
import { toast } from "sonner";
import {
  fetchOrganizations,
  fetchOrganization,
  createNewOrganization,
  updateOrganization,
} from "@/api/organizations/index";
// import { fetchPermissions } from "@/api/permissions";
import { resolveTheme } from "@/lib/themeUtils";
import { useEffect } from "react";

export const getSelectedOrganization = () =>
  Number(localStorage.getItem("selectedOrganization"));

export function useOrganization() {
  const queryClient = useQueryClient();
  const fetchOrganizationsQuery = useQuery<
    MutationResponse,
    Error,
    MutationResponse<Organization[]>
  >({
    queryKey: ["organizations"],
    queryFn: fetchOrganizations,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const fetchOrganizationQuery = useQuery<
    MutationResponse,
    Error,
    MutationResponse<Organization>
  >({
    queryKey: ["organization"],
    queryFn: fetchOrganization,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const createNewOrganizationMutation = useMutation<
    MutationResponse<Organization>,
    Error,
    NewOrganizationPayload
  >({
    mutationFn: createNewOrganization,
  });
  const updateOrganizationMutation = useMutation<
    MutationResponse<Organization>,
    Error,
    UpdateOrganizationPayload
  >({
    mutationFn: updateOrganization,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["organizations"] }),
    onError: () => toast.error("שגיאה בעדכון הארגון"),
  });

  const createNewDepartmentMutation = useMutation<
    MutationResponse<Department>,
    Error,
    Department
  >({
    retry: false,
    mutationFn: createNewDepartment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
  // const permissionsQuery = useQuery<Promise<MutationResponse<Permissions>>>({
  //   queryKey: ["permissions"],
  //   queryFn: fetchPermissions,
  //   retry: false,
  // });

  const fetchDepartmentsQuery = useQuery<MutationResponse<Department[]>, Error>(
    { queryKey: ["departments"], queryFn: fetchDepartments, retry: false }
  );

  const deleteDepartmentMutation = useMutation<
    MutationResponse<null>,
    Error,
    number
  >({
    mutationFn: deleteDepartment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const updateDepartmentMutation = useMutation<
    MutationResponse<Department>,
    Error,
    Department
  >({
    mutationFn: updateDepartment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const fetchCallCategoriesQuery = useQuery<
    MutationResponse<CallCategory[]>,
    Error
  >({
    queryKey: ["callCategories"],
    queryFn: fetchCallCategories,
    retry: false,
    enabled: false,
  });

  const deleteCallCategoryMutation = useMutation<
    MutationResponse<null>,
    Error,
    number
  >({
    mutationFn: deleteCallCategory,
  });

  const createNewCallCategoryMutation = useMutation<
    MutationResponse<CallCategory>,
    Error,
    CallCategory
  >({
    mutationFn: createCallCategory,
    onSuccess: () => fetchCallCategoriesQuery.refetch(),
  });
  const selectOrganization = (id: number) => {
    localStorage.setItem("selectedOrganization", id.toString());
    queryClient.invalidateQueries({
      queryKey: ["departments"],
    });
    queryClient.invalidateQueries({
      queryKey: ["organization"],
    });
  };

  const organization = fetchOrganizationQuery.data?.data;
  const refetchOrganization = fetchOrganizationQuery.refetch;

  useEffect(() => {
    const accentColor = organization?.customStyles?.accentColor;
    const resolvedColor = resolveTheme(accentColor).accent;
    const resolvedTablesColor = resolveTheme(accentColor).datatableHeader;
    const resolveColorPrimary = resolveTheme(accentColor).primary;
    const resolvedBackgroundColor = resolveTheme(accentColor).background;
    const resolvedTabsBg = resolveTheme(accentColor).tabsBg;
    document.documentElement.style.setProperty("--accent", resolvedColor);
    document.documentElement.style.setProperty(
      "--sidebar-accent",
      resolvedColor
    );
    document.documentElement.style.setProperty(
      "--datatable-header",
      resolvedTablesColor
    );
    document.documentElement.style.setProperty(
      "--primary",
      resolveColorPrimary
    );
    document.documentElement.style.setProperty(
      "--background",
      resolvedBackgroundColor
    );
    document.documentElement.style.setProperty("--border", resolvedTabsBg);
  }, [organization]);

  return {
    createNewOrganization: createNewOrganizationMutation.mutateAsync,
    updateOrganization: updateOrganizationMutation.mutateAsync,
    isCreateNewOrganizationLoading:
      createNewOrganizationMutation.status === "pending",
    organizations: fetchOrganizationsQuery.data,
    organizationsStatus: fetchOrganizationsQuery.status,
    refetchOrganizations: fetchOrganizationsQuery.refetch,
    isOrganizationFetching: fetchOrganizationQuery.isFetching,
    organization: fetchOrganizationQuery.data?.data,
    selectOrganization: selectOrganization,
    createNewDepartment: createNewDepartmentMutation.mutateAsync,
    createNewDepartmentStatus: createNewDepartmentMutation.status,
    departments: fetchDepartmentsQuery.data?.data,
    departmentsStatus: fetchDepartmentsQuery.status,
    deleteDepartment: deleteDepartmentMutation.mutateAsync,
    createNewCallCategory: createNewCallCategoryMutation.mutateAsync,
    createNewCallCategoryStatus: createNewCallCategoryMutation.status,
    callCategories: fetchCallCategoriesQuery.data?.data,
    fetchCallCategoriesStatus: fetchCallCategoriesQuery.status,
    refetchCallCategories: fetchCallCategoriesQuery.refetch,
    deleteCallCategory: deleteCallCategoryMutation.mutateAsync,
    deleteCallCategoryStatus: deleteCallCategoryMutation.status,
    updateDepartment: updateDepartmentMutation.mutateAsync,
    refetchOrganization,
  };
}
