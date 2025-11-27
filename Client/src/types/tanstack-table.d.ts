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
    uploadPath?: string;
    allowEmpty?: boolean;
    relationshipChipRenderer?: (args: {
      value: string;
      label: string;
      option?: { value: string; label: string; color?: string; [key: string]: unknown };
      DefaultChip: (props?: React.HTMLAttributes<HTMLDivElement>) => React.ReactNode;
    }) => React.ReactNode;
  }
}

