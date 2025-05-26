import apiClient from "@/api/apiClient";

export const updateFormSettings = (formId: string, data: any) =>
  apiClient.put(`/forms/${formId}/settings`, data); 