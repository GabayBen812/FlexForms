import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationResponse } from "@/types/api/auth";
import {
  NewOrganizationPayload,
  Organization,
  UpdateOrganizationPayload,
} from "@/types/api/organization";


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
    refetchOrganization,
  };
}
