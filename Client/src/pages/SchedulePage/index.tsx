import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useState } from "react";

import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/utils/apiClient";

export type Payment = {
  id: string;
  amount: number;
  service: string;
  status: string;
  lowProfileCode?: string;
  cardDetails?: {
    cardOwnerName: string;
    cardOwnerEmail: string;
    last4Digits: string;
    expiryMonth: string;
    expiryYear: string;
    token: string;
  };
  invoice?: {
    id: string;
    originalDocumentUrl: string;
  };
  formId: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

const paymentsApi = createApiService<Payment>("/payments", {
  includeOrgId: true,
});

export default function Payments() {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationsContext);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const columns: ColumnDef<Payment>[] = [
   
  ];

  const actions: TableAction<Payment>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const paymentFormFields: FieldConfig[] = [
    { name: "payerName", label: t("payer_name"), type: "text" },
    { name: "payerEmail", label: t("payer_email"), type: "email" },
    { name: "amount", label: t("amount"), type: "number" },
    { name: "date", label: t("date"), type: "date" },
    { name: "formId", label: t("form"), type: "text" },
  ];

  const paymentSchema = z.object({
    payerName: z.string().min(1),
    payerEmail: z.string().email(),
    amount: z.number(),
    date: z.string(),
    formId: z.string(),
  });

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("schudule")}
      </h1>      
    </div>
  );
}

export async function fetchAllFeatureFlags(params: ApiQueryParams) {
  const res = await apiClient.get("/feature-flags", { params });
  if (Array.isArray(res.data)) {
    return {
      data: res.data,
      totalCount: res.data.length,
      totalPages: 1,
    };
  }
  return res.data;
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<FeatureFlag>
) {
  const res = await apiClient.put(`/feature-flags/${id}`, data);
  return res.data;
}

export async function deleteFeatureFlag(id: string) {
  const res = await apiClient.delete(`/feature-flags/${id}`);
  return res.data;
}
