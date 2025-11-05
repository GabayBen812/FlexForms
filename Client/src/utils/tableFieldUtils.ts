import { ColumnDef } from "@tanstack/react-table";
import { Organization } from "@/types/api/organization";

export interface DynamicFieldDefinition {
  type: "TEXT" | "SELECT" | "DATE" | "NUMBER" | "EMAIL" | "PHONE" | "MULTI_SELECT" | "TIME" | "CHECKBOX" | "ADDRESS" | "MONEY";
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
  const dynamicFieldsConfig = organization?.tableFieldDefinitions?.[entityType];
  const dynamicFields = dynamicFieldsConfig?.fields || {};
  const fieldOrder = dynamicFieldsConfig?.fieldOrder || [];
  
  // Determine the order of dynamic fields
  let orderedFieldNames: string[];
  if (fieldOrder.length > 0) {
    // Use saved order, but include any new fields that might not be in the order
    const existingFields = new Set(fieldOrder);
    const newFields = Object.keys(dynamicFields).filter(name => !existingFields.has(name));
    // Keep only fields that still exist
    const validOrderedFields = fieldOrder.filter(name => name in dynamicFields);
    orderedFieldNames = [...validOrderedFields, ...newFields];
  } else {
    // No saved order, use default order (Object.keys)
    orderedFieldNames = Object.keys(dynamicFields);
  }
  
  const dynamicColumns: ColumnDef<T>[] = orderedFieldNames.map((fieldName) => {
    const fieldDef = dynamicFields[fieldName];
    const column: ColumnDef<T> = {
      accessorKey: `dynamicFields.${fieldName}`,
      id: `dynamicFields.${fieldName}`, // Explicit id for drag and drop
      header: fieldDef.label || fieldName,
      meta: {
        isDynamic: true,
        fieldType: fieldDef.type === "SELECT" ? "SELECT" : 
                   fieldDef.type === "MULTI_SELECT" ? "MULTI_SELECT" : 
                   fieldDef.type === "CHECKBOX" ? "CHECKBOX" :
                   fieldDef.type === "ADDRESS" ? "ADDRESS" :
                   undefined,
        options: fieldDef.choices?.map(choice => ({ value: choice, label: choice })),
        isDate: fieldDef.type === "DATE",
        isTime: fieldDef.type === "TIME",
        isMoney: fieldDef.type === "MONEY",
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
  return (organization?.tableFieldDefinitions?.[entityType]?.fields || {}) as Record<string, DynamicFieldDefinition>;
}

/**
 * Gets all dynamic field values from a record
 */
export function getDynamicFieldValues(record: Record<string, any>): Record<string, any> {
  return record.dynamicFields || {};
}

