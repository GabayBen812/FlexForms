import { ColumnDef, Row } from "@tanstack/react-table";
import { MutationResponse } from "@/types/api/auth";

export interface ApiQueryParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
  [key: string]: any;
}

export interface ApiResponse<TData> {
  data: TData[];
  totalCount: number;
  totalPages: number;
}

export interface ExpandedContentProps<TData> {
  rowData: TData;
  handleSave?: (newData: Partial<TData>) => void;
  handleEdit?: (row: Partial<TData>) => void;
}

export interface DataTableProps<TData> {
  fetchData: (
    params: ApiQueryParams
  ) => Promise<ApiResponse<TData> | MutationResponse<TData[]>>;
  initialData?: TData[];
  addData: (data: Partial<TData>) => Promise<MutationResponse<TData>>;
  updateData: (data: TData) => Promise<MutationResponse<TData>>;
  deleteData?: (id: number) => Promise<MutationResponse<null>>;
  columns: ColumnDef<TData>[];
  searchable?: boolean;
  isPagination?: boolean;
  actions?: TableAction<TData>[] | null;
  defaultPageSize?: number;
  renderExpandedContent?: (
    props: ExpandedContentProps<TData>
  ) => React.ReactNode;
  showAddButton?: boolean;
  idField?: keyof TData;
  onRowClick?: (row: Row<TData>) => void;
}

export interface TableAction<TData> {
  label: string;
  onClick?: (row: Row<TData>) => void;
  type?: "edit" | "delete" | string;
  editData?: Partial<TData>;
}
