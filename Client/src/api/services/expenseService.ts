import { createApiService } from "@/api/utils/apiFactory";
import { Expense } from "@/types/expenses/expense";

const expenseService = createApiService<Expense>('/expenses', {
  includeOrgId: true,
});

export default expenseService;

