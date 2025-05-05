import { MutationResponse } from "@/types/api/auth";
import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { buildQueryParams, handleApiError } from "../configs";
import apiClient from "../apiClient";
import { getUserOrganizationId } from "./getUserOrganizationId";

type CustomRoute =
  | ((...args: any[]) => string)
  | ((...args: any[]) => {
      url: string;
      params?: Record<string, any>;
      data?: any;
    });

interface ApiServiceOptions {
  includeOrgId?: boolean;
  customRoutes?: {
    fetchAll?: CustomRoute;
    fetch?: CustomRoute;
    create?: CustomRoute;
    update?: CustomRoute;
    delete?: CustomRoute;
  };
}

export const createApiService = <T>(
  baseUrl: string,
  options: ApiServiceOptions = {}
) => {
  const { includeOrgId = false, customRoutes = {} } = options;

  const resolveRoute = (
    route: CustomRoute | undefined,
    fallback: string,
    args: any[] = []
  ): { url: string; config: Record<string, any> } => {
    if (!route) return { url: fallback, config: {} };
    const result = route(...args);
    if (typeof result === "string") return { url: result, config: {} };
    const { url, ...config } = result;
    return { url, config };
  };

  return {
    fetchAll: async (
      params?: ApiQueryParams,
      rawDataOnly = false
    ): Promise<MutationResponse<T[]> | ApiResponse<T>> => {
      try {
        const queryParams = buildQueryParams(params || {}, getUserOrganizationId());
        const { url, config } = resolveRoute(customRoutes.fetchAll, baseUrl);

        const response = await apiClient.get<ApiResponse<T> | T[]>(url, {
          ...config,
          params: {
            ...config.params,
            ...queryParams,
            ...(includeOrgId ? { organizationId: getUserOrganizationId() } : {}),
          },
        });

        if (rawDataOnly) return response.data as ApiResponse<T>;

        return {
          status: response.status,
          data: response.data as T[],
        };
      } catch (error) {
        return handleApiError(error);
      }
    },

    fetch: async (...args: any[]): Promise<MutationResponse<T>> => {
      try {
        const fallbackUrl = `${baseUrl}/find`;
        const { url, config } = resolveRoute(
          customRoutes.fetch,
          fallbackUrl,
          args
        );

        const params = {
          ...(config?.params || {}),
          ...(includeOrgId ? { organizationId: getUserOrganizationId() } : {}),
        };

        const response = await apiClient.get<T>(url, {
          ...config,
          params,
        });

        return { status: response.status, data: response.data };
      } catch (error) {
        return handleApiError(error);
      }
    },

    create: async (data: Partial<T>): Promise<MutationResponse<T>> => {
      try {
        const payload = includeOrgId
          ? { ...data, organizationId: getUserOrganizationId() }
          : data;

        const { url, config } = resolveRoute(customRoutes.create, baseUrl);
        const response = await apiClient.post<T>(url, payload, config);

        return { status: response.status, data: response.data };
      } catch (error) {
        return handleApiError(error);
      }
    },

    update: async (data: Partial<T> & { id: string | number }): Promise<MutationResponse<T>> => {
      try {
        const payload = includeOrgId
          ? { ...data, organizationId: getUserOrganizationId() }
          : data;

        const { url, config } = resolveRoute(customRoutes.update, `${baseUrl}/${data.id}`);
        const method = config?.method || "put";

        const response = await apiClient.request<T>({
          method,
          url,
          data: payload,
          ...config,
        });

        return { status: response.status, data: response.data };
      } catch (error) {
        return handleApiError(error);
      }
    },

    delete: async (id: string | number): Promise<MutationResponse<null>> => {
      try {
        const { url, config } = resolveRoute(
          customRoutes.delete,
          `${baseUrl}/${id}`,
          [id]
        );
        const response = await apiClient.delete<null>(url, config);

        return { status: response.status, data: response.data };
      } catch (error) {
        return handleApiError(error);
      }
    },

    customRequest: async <R = any>(
      method: "get" | "post" | "put" | "delete" | "patch",
      route: string,
      options?: {
        data?: any;
        params?: Record<string, any>;
        headers?: Record<string, any>;
        rawDataOnly?: boolean;
        includeOrgId?: boolean;
      }
    ): Promise<MutationResponse<R> | ApiResponse<R> | R> => {
      try {
        const { data, headers, rawDataOnly = false } = options || {};
        const params = {
          ...(options?.params || {}),
          ...(includeOrgId ? { organizationId: getUserOrganizationId() } : {}),
        };
        const response = await apiClient.request<R>({
          url: route,
          method,
          data,
          params,
          headers,
        });

        if (rawDataOnly) return response.data;

        return {
          status: response.status,
          data: (response.data as any)?.data ?? response.data,
        };
      } catch (error) {
        return handleApiError(error);
      }
    },

    getRecentCalls: async (): Promise<MutationResponse<T[]>> => {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { url, config } = resolveRoute(customRoutes.fetchAll, baseUrl);

        const params = {
          ...(config.params || {}),
          ...(includeOrgId ? { organizationId: getUserOrganizationId() } : {}),
          createdAt: {
            gte: yesterday,
          },
        };

        const response = await apiClient.get<T[]>(url, {
          ...config,
          params,
        });

        return {
          status: response.status,
          data: response.data,
        };
      } catch (error) {
        console.error("Error fetching recent calls:", error);
        return handleApiError(error);
      }
    },
  };
};
