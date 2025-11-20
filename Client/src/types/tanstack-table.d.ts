import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    hidden?: boolean;
    isDate?: boolean;
    excludeFromSearch?: boolean;
    editable?: boolean;
    fieldType?: string;
    options?: any;
    className?: string;
    isDynamic?: boolean;
    isTime?: boolean;
    isMoney?: boolean;
    isImage?: boolean;
    isFile?: boolean;
    fieldDefinition?: any;
    relationshipOptions?: Array<{ value: string; label: string }>;
  }
}

