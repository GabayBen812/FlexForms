import { ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Account } from "@/types/accounts/account";

export const accountsApiService = createApiService<Account>("/accounts", {
  includeOrgId: true,
});

export const fetchAllAccounts = async (
  params: ApiQueryParams = {},
  organizationId?: string
) => {
  const response = await accountsApiService.fetchAll(params, true, organizationId);
  const payload = Array.isArray(response)
    ? {
        data: response,
        totalCount: response.length,
        totalPages: 1,
      }
    : response;

  return {
    data: payload,
  };
};

export const createAccount = (data: Partial<Account>) => {
  return accountsApiService.create(data);
};

export const updateAccount = (data: Partial<Account> & { id: string | number }) => {
  return accountsApiService.update(data);
};

export const deleteAccount = (id: string | number) => {
  return accountsApiService.delete(id);
};

