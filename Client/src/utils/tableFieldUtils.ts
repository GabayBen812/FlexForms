import { ColumnDef } from "@tanstack/react-table";
import { Organization } from "@/types/api/organization";

export type DynamicFieldChoice =
  | string
  | {
      value?: string;
      label?: string;
      color?: string;
    };

export interface DynamicFieldChoiceOption {
  value: string;
  label: string;
  color?: string;
}

export interface DynamicFieldDefinition {
  type:
    | "TEXT"
    | "SELECT"
    | "DATE"
    | "NUMBER"
    | "EMAIL"
    | "PHONE"
    | "MULTI_SELECT"
    | "TIME"
    | "CHECKBOX"
    | "ADDRESS"
    | "MONEY"
    | "IMAGE"
    | "FILE"
    | "LINK";
  label: string;
  required?: boolean;
  choices?: DynamicFieldChoice[];
  defaultValue?: any;
}

export function normalizeDynamicFieldChoices(
  choices?: DynamicFieldDefinition["choices"]
): DynamicFieldChoiceOption[] {
  if (!Array.isArray(choices)) {
    return [];
  }

  return choices
    .map((choice) => {
      if (typeof choice === "string") {
        return {
          value: choice,
          label: choice,
        };
      }

      const label = choice?.label ?? choice?.value ?? "";
      const value = choice?.value ?? choice?.label ?? "";

      if (!label || !value) {
        return null;
      }

      return {
        label,
        value,
        color: choice?.color,
      };
    })
    .filter((opt) => Boolean(opt && typeof opt === 'object' && 'value' in opt && 'label' in opt && opt.value && opt.label)) as DynamicFieldChoiceOption[];
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
    
    // Determine compact size based on field type
    let size = 140; // Default
    switch (fieldDef.type) {
      case "CHECKBOX":
        size = 90;
        break;
      case "DATE":
      case "TIME":
        size = 130;
        break;
      case "NUMBER":
        size = 120;
        break;
      case "MONEY":
        size = 140;
        break;
      case "EMAIL":
      case "PHONE":
        size = 160;
        break;
      case "LINK":
        size = 150;
        break;
      case "IMAGE":
      case "FILE":
        size = 100;
        break;
      case "ADDRESS":
        size = 180;
        break;
      case "SELECT":
        size = 130;
        break;
      case "MULTI_SELECT":
        size = 180;
        break;
      default: // TEXT and others
        size = 140;
    }
    
    const column: ColumnDef<T> = {
      accessorKey: `dynamicFields.${fieldName}`,
      id: `dynamicFields.${fieldName}`, // Explicit id for drag and drop
      header: fieldDef.label || fieldName,
      size,
      meta: {
        isDynamic: true,
        fieldType: fieldDef.type === "SELECT" ? "SELECT" : 
                   fieldDef.type === "MULTI_SELECT" ? "MULTI_SELECT" : 
                   fieldDef.type === "CHECKBOX" ? "CHECKBOX" :
                   fieldDef.type === "ADDRESS" ? "ADDRESS" :
                   fieldDef.type === "IMAGE" ? "IMAGE" :
                   fieldDef.type === "FILE" ? "FILE" :
                   fieldDef.type === "LINK" ? "LINK" :
                   undefined,
        options: normalizeDynamicFieldChoices(fieldDef.choices),
        isDate: fieldDef.type === "DATE",
        isTime: fieldDef.type === "TIME",
        isMoney: fieldDef.type === "MONEY",
        isImage: fieldDef.type === "IMAGE",
        isFile: fieldDef.type === "FILE",
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

