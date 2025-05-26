import { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";
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

export interface ColumnMeta {
  hidden?: boolean;
  isDate?: boolean;
  excludeFromSearch?: boolean;
  editable?: boolean;
  fieldType?: string;
  options?: any;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  fetchData: (
    params?: ApiQueryParams,
    rawDataOnly?: boolean,
    organizationId?: string
  ) => Promise<ApiResponse<TData> | MutationResponse<TData[]>>;
  updateData: (
    data: Partial<TData> & { id: string | number }
  ) => Promise<MutationResponse<TData>>;
  deleteData?: (id: string | number) => Promise<MutationResponse<TData>>;
  onRowClick?: (row: TData) => void;
  extraFilters?: Record<string, any>;
  idField?: keyof TData;
  defaultSortField?: string;
  defaultSortDirection?: "asc" | "desc";
  defaultPageSize?: number;
  onColumnOrderChange?: (columnOrder: string[]) => void;
  stickyColumnCount?: number;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  renderExpandedContent?: (props: {
    handleSave: (data: Partial<TData>) => Promise<void>;
  }) => React.ReactNode;
  addData?: any;
  searchable?: boolean;
  showAdvancedSearch?: boolean;
  onAdvancedSearchChange?: (filters: Record<string, any>) => void;
  initialAdvancedFilters?: Record<string, any>;
  isPagination?: boolean;
  showAddButton?: boolean | Array<{ name: string; defaultValue: string }>;
  customAddButton?: React.ReactNode;
  showActionColumn?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showDuplicateButton?: boolean;
  actions?: any;
  initialData?: any;
  rowSelection?: any;
  enableColumnReordering?: boolean;
  columnOrder?: string[];
  [key: string]: any;
  visibleRows?: (rows: TData[]) => void;
}

export interface TableAction<TData> {
  label: string;
  onClick?: (row: Row<TData>) => void;
  type?: "edit" | "delete" | string;
  editData?: Partial<TData>;
}

export type FieldType = "TEXT" | "SELECT" | "DATE" | "FILE" | "CURRENCY";
