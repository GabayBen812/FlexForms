import { ColumnDef } from "@tanstack/react-table";
import { Organization } from "@/types/api/organization";

export interface DynamicFieldDefinition {
  type: "TEXT" | "SELECT" | "DATE" | "NUMBER" | "EMAIL" | "PHONE";
  label: string;
  required?: boolean;
  choices?: string[];
  defaultValue?: any;
}

/**
 * Merges static columns with dynamic field definitions from organization
 */
export function mergeColumnsWithDynamicFields<T>(
  staticColumns: ColumnDef<T>[],
  entityType: string,
  organization: Organization | null,
  t: (key: string) => string
): ColumnDef<T>[] {
  const dynamicFields = organization?.tableFieldDefinitions?.[entityType]?.fields || {};
  
  const dynamicColumns: ColumnDef<T>[] = Object.entries(dynamicFields).map(([fieldName, fieldDef]) => {
    const column: ColumnDef<T> = {
      accessorKey: `dynamicFields.${fieldName}`,
      header: fieldDef.label || fieldName,
      meta: {
        isDynamic: true,
        fieldType: fieldDef.type === "SELECT" ? "SELECT" : undefined,
        options: fieldDef.choices?.map(choice => ({ value: choice, label: choice })),
        isDate: fieldDef.type === "DATE",
        editable: true, // Dynamic fields are editable by default
        fieldDefinition: fieldDef,
      },
    };
    
    return column;
  });
  
  return [...staticColumns, ...dynamicColumns];
}

/**
 * Gets dynamic field definitions for a specific entity type
 */
export function getDynamicFieldDefinitions(
  organization: Organization | null,
  entityType: string
): Record<string, DynamicFieldDefinition> {
  return organization?.tableFieldDefinitions?.[entityType]?.fields || {};
}

/**
 * Gets all dynamic field values from a record
 */
export function getDynamicFieldValues(record: Record<string, any>): Record<string, any> {
  return record.dynamicFields || {};
}

