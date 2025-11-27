import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";
import type { HTMLAttributes, ReactElement } from "react";
import { useState, useCallback, useMemo, useRef } from "react";
import { Plus, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { MutationResponse } from "@/types/api/auth";
import { createApiService } from "@/api/utils/apiFactory";
import { Parent } from "@/types/parents/parent";
import { Kid } from "@/types/kids/kid";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { SmartLoadFromExcel } from "@/components/ui/completed/dialogs/SmartLoadFromExcel";
import { DataTablePageLayout } from "@/components/layout/DataTablePageLayout";
import {
  getDynamicFieldDefinitions,
  mergeColumnsWithDynamicFields,
  normalizeDynamicFieldChoices,
  type DynamicFieldDefinition,
} from "@/utils/tableFieldUtils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { showConfirm } from "@/utils/swal";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import {
  fetchContacts,
  createContact,
  updateContact as updateContactApi,
  deleteContact as deleteContactApi,
  getRelationshipsForContacts,
  upsertRelationship,
  removeRelationship,
} from "@/api/contacts";
import { Contact, ContactRelationship } from "@/types/contacts/contact";
import {
  denamespaceDynamicFields,
  namespaceDynamicFields,
} from "@/utils/contacts/dynamicFieldNamespaces";
import { formatDateForDisplay, parseDateForSubmit } from "@/lib/dateUtils";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { ProfileAvatar, getProfileImageUrl } from "@/components/ProfileAvatar";

const parentsApi = createApiService<Parent>("/parents", {
  includeOrgId: true,
});

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

const PARENT_PROFILE_UPLOAD_PATH = "uploads/parents/profile-images";

interface KidDetailsPopoverProps {
  kid: Kid;
  trigger: ReactElement;
  t: TFunction;
  dynamicFieldDefinitions: Record<string, DynamicFieldDefinition>;
  dynamicFieldOrder: string[];
}

interface KidFieldRow {
  key: string;
  label: string;
  value: string;
  href?: string;
}

const hasRenderableValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) {
    return value.some(hasRenderableValue);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasRenderableValue);
  }
  return false;
};

const stringifyFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => stringifyFieldValue(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.label === "string" && record.label.trim().length > 0) {
      return record.label;
    }
    if (
      typeof record.value === "string" ||
      typeof record.value === "number" ||
      typeof record.value === "boolean"
    ) {
      return String(record.value);
    }
    return Object.values(record)
      .map((entry) => stringifyFieldValue(entry))
      .filter(Boolean)
      .join(" • ");
  }
  return "";
};

const extractSingleValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (
      typeof record.value === "string" ||
      typeof record.value === "number" ||
      typeof record.value === "boolean"
    ) {
      return String(record.value);
    }
    if (typeof record.label === "string") {
      return record.label;
    }
  }
  return "";
};

const normalizeValueArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => extractSingleValue(entry)).filter(Boolean);
  }
  const single = extractSingleValue(value);
  if (!single) return [];
  if (single.includes(",")) {
    return single
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [single];
};

function formatDynamicFieldValue(
  definition: DynamicFieldDefinition,
  rawValue: unknown,
  t: TFunction,
): { display: string; href?: string } {
  const baseDisplay = stringifyFieldValue(rawValue).trim();

  switch (definition.type) {
    case "SELECT": {
      const value = extractSingleValue(rawValue);
      const choices = normalizeDynamicFieldChoices(definition.choices);
      const label = value
        ? (choices.find((choice) => choice.value === value)?.label ?? baseDisplay) || value
        : baseDisplay;
      return { display: label };
    }
    case "MULTI_SELECT": {
      const values = normalizeValueArray(rawValue);
      const choices = normalizeDynamicFieldChoices(definition.choices);
      const labels = values.map(
        (value) => choices.find((choice) => choice.value === value)?.label ?? value,
      );
      return { display: labels.join(", ") || baseDisplay };
    }
    case "CHECKBOX":
      return {
        display: Boolean(rawValue) ? t("common:yes", "כן") : t("common:no", "לא"),
      };
    case "DATE":
      return { display: formatDateForDisplay(baseDisplay || undefined) };
    case "PHONE": {
      const value = extractSingleValue(rawValue) || baseDisplay;
      return {
        display: formatPhoneNumber(value),
        href: value ? `tel:${value}` : undefined,
      };
    }
    case "EMAIL": {
      const value = extractSingleValue(rawValue) || baseDisplay;
      return {
        display: value,
        href: value ? `mailto:${value}` : undefined,
      };
    }
    case "LINK": {
      const value = extractSingleValue(rawValue) || baseDisplay;
      const hasProtocol = /^https?:\/\//i.test(value);
      return {
        display: value,
        href: value ? (hasProtocol ? value : `https://${value}`) : undefined,
      };
    }
    case "NUMBER":
    case "MONEY": {
      const numericValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string" &&
              rawValue.trim() !== "" &&
              !Number.isNaN(Number(rawValue))
            ? Number(rawValue)
            : null;
      if (numericValue !== null) {
        return {
          display:
            definition.type === "MONEY"
              ? numericValue.toLocaleString("he-IL", {
                  style: "currency",
                  currency: "ILS",
                })
              : numericValue.toLocaleString("he-IL"),
        };
      }
      return { display: baseDisplay };
    }
    default:
      return { display: baseDisplay };
  }
}

function KidDetailsPopover({
  kid,
  trigger,
  t,
  dynamicFieldDefinitions,
  dynamicFieldOrder,
}: KidDetailsPopoverProps) {
  const linkedParentsCount = kid.linked_parents?.length ?? 0;
  const fullName = [kid.firstname, kid.lastname].filter(Boolean).join(" ");
  const kidStatus = kid.status?.trim() || "";

  const staticRows: KidFieldRow[] = [
    {
      key: "idNumber",
      label: t("id_number", "תעודת זהות"),
      value: kid.idNumber?.trim() || "",
    },
    {
      key: "address",
      label: t("address", "כתובת"),
      value: kid.address?.trim() || "",
    },
    {
      key: "status",
      label: t("status", "סטטוס"),
      value: kidStatus,
    },
  ].filter((row) => row.value);

  const orderedDynamicKeys =
    dynamicFieldOrder.length > 0
      ? dynamicFieldOrder
      : Object.keys(dynamicFieldDefinitions);

  const dynamicRows: KidFieldRow[] = orderedDynamicKeys
    .map((fieldKey) => {
      const definition = dynamicFieldDefinitions[fieldKey];
      if (!definition) {
        return null;
      }

      const rawValue = kid.dynamicFields?.[fieldKey];
      if (!hasRenderableValue(rawValue)) {
        return null;
      }

      const formatted = formatDynamicFieldValue(definition, rawValue, t);
      if (!formatted.display.trim()) {
        return null;
      }

      return {
        key: fieldKey,
        label: definition.label || fieldKey,
        value: formatted.display,
        href: formatted.href,
      };
    })
    .filter((row): row is KidFieldRow => Boolean(row));

  const renderFieldGrid = (rows: KidFieldRow[], prefix: string) => (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {rows.map(({ key, label, value, href }) => (
        <div key={`${prefix}-${key}`} className="space-y-1">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="text-sm font-semibold break-words text-right">
            {href ? (
              <a
                href={href}
                className="text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                {value}
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );

  const showEmptyState = staticRows.length === 0 && dynamicRows.length === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        side="left"
        className="w-[480px] max-w-[90vw] p-0 text-sm shadow-lg border bg-card max-h-[80vh] overflow-hidden"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 px-4 py-4 bg-muted/60">
            <div className="space-y-1">
              <p className="text-lg font-semibold">{fullName || t("kids:unknown_name", "ללא שם")}</p>
              {linkedParentsCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("linked_parents_count", {
                    count: linkedParentsCount,
                    defaultValue:
                      linkedParentsCount === 1
                        ? "מקושר להורה אחד"
                        : `מקושר ל-${linkedParentsCount} הורים`,
                  })}
                </p>
              )}
            </div>
            {kidStatus && (
              <Badge variant="secondary" className="text-xs font-medium">
                {kidStatus}
              </Badge>
            )}
          </div>

          <div className="px-4 py-5 space-y-6">
            {staticRows.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("kids:basic_information", "מידע בסיסי")}
                </p>
                {renderFieldGrid(staticRows, "static")}
              </section>
            )}

            {dynamicRows.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("kids:custom_fields", "שדות דינאמיים")}
                </p>
                {renderFieldGrid(dynamicRows, "dynamic")}
              </section>
            )}

            {showEmptyState && (
              <p className="text-sm text-muted-foreground text-center">
                {t("kids:no_kid_details", "אין נתונים להצגה")}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ParentsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const { isEnabled: isUnifiedContacts, isLoading: isContactsFlagLoading } = useFeatureFlag("FF_CONTACTS_UNIFIED");
  const parentRelationshipsRef = useRef<Record<string, ContactRelationship[]>>({});
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Parent) => void;
    updateItem: (item: Parent) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Parent[]>([]);

  // Fetch kids for multi-select
  const { data: kidsData = [] } = useQuery({
    queryKey: ["kids-options", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];
      const res = await kidsApi.fetchAll({}, false, organization._id);
      return (res.data || []) as Kid[];
    },
    enabled: !!organization?._id,
  });

  const kidsOptions = useMemo(
    () =>
      kidsData.map((kid) => ({
        value: kid._id || "",
        label: `${kid.firstname} ${kid.lastname}`,
        contactId: kid.contactId,
        kid,
      })),
    [kidsData],
  );

  const kidById = useMemo(() => {
    return kidsData.reduce<Record<string, Kid>>((acc, kid) => {
      if (kid._id) {
        acc[kid._id] = kid;
      }
      return acc;
    }, {});
  }, [kidsData]);

  const kidByContactId = useMemo(() => {
    return kidsData.reduce<Record<string, Kid>>((acc, kid) => {
      if (kid.contactId) {
        acc[kid.contactId] = kid;
      }
      return acc;
    }, {});
  }, [kidsData]);

  const kidDynamicFieldDefinitions = useMemo(
    () => getDynamicFieldDefinitions(organization, "kids"),
    [organization],
  );

  const kidDynamicFieldOrder = useMemo(() => {
    const config = organization?.tableFieldDefinitions?.kids;
    const definedKeys = Object.keys(kidDynamicFieldDefinitions);

    if (!config) {
      return definedKeys;
    }

    const ordered: string[] = [];
    const seen = new Set<string>();

    (config.fieldOrder || []).forEach((fieldName) => {
      if (kidDynamicFieldDefinitions[fieldName]) {
        ordered.push(fieldName);
        seen.add(fieldName);
      }
    });

    definedKeys.forEach((fieldName) => {
      if (!seen.has(fieldName)) {
        ordered.push(fieldName);
      }
    });

    return ordered;
  }, [organization, kidDynamicFieldDefinitions]);

  const renderKidChip = useCallback(
    ({
      value,
      DefaultChip,
    }: {
      value: string;
      DefaultChip: (props?: HTMLAttributes<HTMLDivElement>) => React.ReactNode;
    }) => {
      const kid = kidById[value];
      if (!kid) {
        return DefaultChip();
      }

      const triggerElement = DefaultChip({
        onClick: (event) => event.stopPropagation(),
        onPointerDown: (event) => event.stopPropagation(),
      }) as ReactElement;

      return (
        <KidDetailsPopover
          kid={kid}
          trigger={triggerElement}
          t={t}
          dynamicFieldDefinitions={kidDynamicFieldDefinitions}
          dynamicFieldOrder={kidDynamicFieldOrder}
        />
      );
    },
    [kidById, kidDynamicFieldDefinitions, kidDynamicFieldOrder, t],
  );

  const mapContactToParent = useCallback(
    (contact: Contact, relationships: ContactRelationship[] = []): Parent => {
      const dynamicFields = denamespaceDynamicFields(
        contact.dynamicFields as Record<string, unknown> | undefined,
        "parent",
      );

      const linkedKidIds = relationships
        .filter((rel) => rel.relation === "parent")
        .map((rel) => kidByContactId[rel.targetContactId]?._id)
        .filter((id): id is string => !!id);

      return {
        _id: contact._id,
        contactId: contact._id,
        firstname: contact.firstname,
        lastname: contact.lastname,
        profileImageUrl: contact.profileImageUrl,
        idNumber: contact.idNumber,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        status: contact.status,
        linked_kids: linkedKidIds,
        organizationId: contact.organizationId,
        dynamicFields: dynamicFields as Record<string, any> | undefined,
      };
    },
    [kidByContactId],
  );

  const syncParentRelationships = useCallback(
    async (parentContactId: string, linkedKidIds: string[]) => {
      const existingRelationships = parentRelationshipsRef.current[parentContactId] || [];
      const existingKidContactIds = existingRelationships.map((rel) => rel.targetContactId);

      const desiredKidContactIds = linkedKidIds
        .map((kidId) => kidById[kidId]?.contactId)
        .filter((id): id is string => !!id);

      const toAdd = desiredKidContactIds.filter((contactId) => !existingKidContactIds.includes(contactId));
      const toRemove = existingKidContactIds.filter((contactId) => !desiredKidContactIds.includes(contactId));

      const updatedRelationships = existingRelationships.filter(
        (rel) => !toRemove.includes(rel.targetContactId),
      );

      if (toAdd.length > 0) {
        for (const kidContactId of toAdd) {
          const response = await upsertRelationship(parentContactId, {
            targetContactId: kidContactId,
            relation: "parent",
          });
          if (!response.error && response.data) {
            updatedRelationships.push(response.data);
          }

          await upsertRelationship(kidContactId, {
            targetContactId: parentContactId,
            relation: "child",
          });
        }
      }

      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map(async (kidContactId) => {
            await removeRelationship(parentContactId, kidContactId);
            await removeRelationship(kidContactId, parentContactId);
          }),
        );
      }

      parentRelationshipsRef.current[parentContactId] = updatedRelationships;
    },
    [kidById],
  );

  // Custom selection column with edit icon
  const selectionColumn: ColumnDef<Parent> = {
    id: "select",
    enableSorting: false,
    header: ({ table }) => {
      const selectedCount = table.getSelectedRowModel().rows.length;
      return (
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            // @ts-ignore
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="border-white"
          />
          <span className="text-xs text-white">
            {selectedCount} נבחרו
          </span>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
        <TableEditButton
          onClick={(e) => {
            e.stopPropagation();
            setEditingParent(row.original);
            setIsEditDialogOpen(true);
          }}
        />
      </div>
    ),
    enableHiding: false,
    size: 150,
  };

  const columns: ColumnDef<Parent>[] = [
    selectionColumn,
    {
      accessorKey: "profileImageUrl",
      header: t("profile_picture", "תמונת פרופיל"),
      enableSorting: false,
      meta: {
        editable: true,
        excludeFromSearch: true,
        isImage: true,
        fieldType: "IMAGE",
        uploadPath: PARENT_PROFILE_UPLOAD_PATH,
        allowEmpty: true,
      },
      cell: ({ row }) => {
        const parent = row.original;
        const imageUrl = getProfileImageUrl(parent);
        const name = [parent.firstname, parent.lastname].filter(Boolean).join(" ");

        return (
          <div className="flex justify-center">
            <ProfileAvatar name={name} imageUrl={imageUrl} size="sm" />
          </div>
        );
      },
      size: 90,
    },
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "idNumber", header: t("id_number") },
    { 
      accessorKey: "linked_kids", 
      header: t("linked_kids"),
      meta: {
        editable: true,
        relationshipOptions: kidsOptions,
        relationshipChipRenderer: renderKidChip,
      },
    },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  // Merge static columns with dynamic fields
  const mergedColumns = useMemo(() => {
    // Update columns with current kidsOptions
    const updatedColumns = visibleColumns.map((col) => {
      if ((col as any).accessorKey === "linked_kids") {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            relationshipOptions: kidsOptions,
            relationshipChipRenderer: renderKidChip,
          },
        };
      }
      return col;
    });
    return mergeColumnsWithDynamicFields(
      updatedColumns,
      "parents",
      organization,
      t
    );
  }, [visibleColumns, organization, t, kidsOptions, renderKidChip]);

  const excelColumns = useMemo(() => mergedColumns, [mergedColumns]);

  const columnMetaMap = useMemo(() => {
    const map = new Map<string, ColumnDef<Parent>>();
    mergedColumns.forEach((column) => {
      const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
      if (accessorKey) {
        map.set(accessorKey, column);
      }
    });
    return map;
  }, [mergedColumns]);

  const actions: TableAction<Parent>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const fetchParentsData = useCallback(
    async (params?: ApiQueryParams) => {
      if (!organization?._id) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<Parent>;
      }

      if (!isUnifiedContacts) {
        return parentsApi.fetchAll(params, false, organization._id);
      }

      const contactResponse = await fetchContacts({
        ...(params || {}),
        type: "parent",
      });

      if (contactResponse.error || !contactResponse.data) {
        return {
          status: contactResponse.status,
          error: contactResponse.error,
          data: undefined,
        } as MutationResponse<Parent[]>;
      }

      const contacts = contactResponse.data.data || [];
      const contactIds = contacts.map((contact) => contact._id);

      let relationships: ContactRelationship[] = [];
      if (contactIds.length > 0) {
        const relationshipsResponse = await getRelationshipsForContacts(contactIds);
        if (relationshipsResponse.error || !relationshipsResponse.data) {
          return {
            status: relationshipsResponse.status,
            error: relationshipsResponse.error,
            data: undefined,
          } as MutationResponse<Parent[]>;
        }
        relationships = relationshipsResponse.data;
      }

      const relationshipsMap = relationships
        .filter((rel) => rel.relation === "parent")
        .reduce<Record<string, ContactRelationship[]>>((acc, rel) => {
          if (!acc[rel.sourceContactId]) {
            acc[rel.sourceContactId] = [];
          }
          acc[rel.sourceContactId].push(rel);
          return acc;
        }, {});

      parentRelationshipsRef.current = relationshipsMap;

      const parents = contacts.map((contact) =>
        mapContactToParent(contact, relationshipsMap[contact._id] || []),
      );

      return {
        data: parents,
        totalCount: contactResponse.data.totalCount,
        totalPages: contactResponse.data.totalPages,
      } as ApiResponse<Parent>;
    },
    [organization?._id, isUnifiedContacts, mapContactToParent],
  );

  const createParentRecord = useCallback(
    async (
      data: any,
      options: { skipIdValidation?: boolean } = {},
    ): Promise<{ parent?: Parent; shouldRefresh?: boolean }> => {
      const { skipIdValidation = false } = options;

      if (!skipIdValidation && data.idNumber && data.idNumber.trim() !== "") {
        if (!isValidIsraeliID(data.idNumber)) {
          throw new Error(t("invalid_israeli_id") || "תעודת זהות לא תקינה");
        }
      }

      if (!isUnifiedContacts) {
        const newParent = {
          ...data,
          organizationId: organization?._id || "",
          linked_kids: Array.isArray(data.linked_kids) ? data.linked_kids : [],
          ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
        };
        const res = await parentsApi.create(newParent);

        if (res.error) {
          const errorMessage = res.error || t("error") || "Failed to create parent";
          throw new Error(errorMessage);
        }

        if (res.status === 200 || res.status === 201) {
          if (res.data) {
            return { parent: res.data };
          }
          return { shouldRefresh: true };
        }
        return { shouldRefresh: true };
      }

      if (!organization?._id) {
        throw new Error(t("organization_required") || "Organization context missing");
      }

      const linkedKidIds: string[] = Array.isArray(data.linked_kids) ? data.linked_kids : [];

      const contactPayload = {
        firstname: data.firstname,
        lastname: data.lastname,
        type: "parent" as const,
        organizationId: organization._id,
        idNumber: data.idNumber,
        email: data.email,
        phone: data.phone,
        address: data.address,
        profileImageUrl: data.profileImageUrl,
        dynamicFields: namespaceDynamicFields(
          data.dynamicFields as Record<string, unknown> | undefined,
          "parent",
        ),
      };

      const contactResponse = await createContact(contactPayload);
      if (contactResponse.error || !contactResponse.data) {
        const errorMessage =
          contactResponse.error || t("error") || "Failed to create parent contact";
        throw new Error(errorMessage);
      }

      const createdContact = contactResponse.data;
      parentRelationshipsRef.current[createdContact._id] = [];

      await syncParentRelationships(createdContact._id, linkedKidIds);

      const relationships = parentRelationshipsRef.current[createdContact._id] || [];
      const mappedParent = mapContactToParent(createdContact, relationships);

      return { parent: mappedParent };
    },
    [isUnifiedContacts, organization?._id, t, syncParentRelationships, mapContactToParent],
  );

  const handleAddParent = async (data: any) => {
    try {
      const result = await createParentRecord(data);
      toast.success(t("form_created_success"));
      if (isAddDialogOpen) {
        setIsAddDialogOpen(false);
      }
      if (result.parent) {
        tableMethods?.addItem(result.parent);
      } else {
        tableMethods?.refresh();
      }
    } catch (error) {
      console.error("Error creating parent:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : undefined,
        response: (error as any)?.response,
        error: (error as any)?.error,
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ||
            (error as any)?.response?.data?.error ||
            (error as any)?.error ||
            JSON.stringify(error) ||
            t("error") ||
            "An error occurred";

      console.error("Final error message:", errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  const transformExcelRow = useCallback(
    (row: Record<string, string>) => {
      const transformed: Record<string, any> = {};
      const dynamicFields: Record<string, any> = {};

      Object.entries(row).forEach(([key, rawValue]) => {
        const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
        if (value === "" || value === undefined || value === null) {
          return;
        }

        if (key.startsWith("dynamicFields.")) {
          const fieldKey = key.replace("dynamicFields.", "");
          dynamicFields[fieldKey] = value;
          return;
        }

        const column = columnMetaMap.get(key);
        if (column?.meta?.isDate) {
          const parsedDate = parseDateForSubmit(value);
          if (parsedDate) {
            transformed[key] = parsedDate;
            return;
          }
        }

        transformed[key] = value;
      });

      if (Object.keys(dynamicFields).length) {
        transformed.dynamicFields = dynamicFields;
      }

      return transformed;
    },
    [columnMetaMap],
  );

  const handleExcelImport = useCallback(
    async (excelRows: Record<string, string>[]) => {
      if (!excelRows.length) {
        toast.error(t("excel_no_rows_to_save", "אין נתונים לשמירה"));
        return;
      }

      const preparedRows = excelRows
        .map(transformExcelRow)
        .filter((row) => row && Object.keys(row).length > 0);

      if (!preparedRows.length) {
        toast.error(t("excel_no_rows_to_save", "אין נתונים לשמירה"));
        return;
      }

      let successCount = 0;
      const errorMessages: string[] = [];

      for (let index = 0; index < preparedRows.length; index++) {
        try {
          await createParentRecord(preparedRows[index], { skipIdValidation: true });
          successCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : t("error") || (typeof error === "string" ? error : "An error occurred");
          errorMessages.push(`${index + 1}: ${errorMessage}`);
        }
      }

      if (successCount) {
        toast.success(
          t("excel_import_success", {
            count: successCount,
            defaultValue: `ייבוא ${successCount} רשומות הושלם בהצלחה`,
          }),
        );
        tableMethods?.refresh();
      }

      if (errorMessages.length) {
        toast.error(
          t("excel_import_partial_failure", {
            defaultValue: `חלק מהרשומות נכשלו (${errorMessages.length}): ${errorMessages
              .slice(0, 3)
              .join("; ")}`,
          }),
        );
      }
    },
    [createParentRecord, tableMethods, t, transformExcelRow],
  );

  const handleEditParent = async (data: any) => {
    if (!editingParent?._id) return;
    try {
      if (!isUnifiedContacts) {
        const updatedParent = {
          ...data,
          id: editingParent._id,
          organizationId: organization?._id || "",
          linked_kids: Array.isArray(data.linked_kids)
            ? data.linked_kids
            : Array.isArray(editingParent.linked_kids)
            ? editingParent.linked_kids.map((k: any) =>
                typeof k === "string" ? k : k?._id || k?.toString() || k,
              )
            : [],
          ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
        };
        const res = await parentsApi.update(updatedParent);
        if (res.status === 200 || res.data) {
          const updatedParentData = res.data;
          toast.success(t("updated_successfully") || "Record updated successfully");
          setIsEditDialogOpen(false);
          setEditingParent(null);
          tableMethods?.updateItem(updatedParentData);
        }
        return;
      }

      const parentContactId = editingParent.contactId || editingParent._id;
      if (!parentContactId) {
        throw new Error(t("error") || "Missing contact identifier");
      }

      const linkedKidIds: string[] = Array.isArray(data.linked_kids)
        ? data.linked_kids
        : Array.isArray(editingParent.linked_kids)
        ? editingParent.linked_kids
        : [];

      const updatePayload = {
        firstname: data.firstname,
        lastname: data.lastname,
        idNumber: data.idNumber,
        email: data.email,
        phone: data.phone,
        address: data.address,
        profileImageUrl: data.profileImageUrl,
        dynamicFields: namespaceDynamicFields(
          data.dynamicFields as Record<string, unknown> | undefined,
          "parent",
        ),
      };

      const updateResponse = await updateContactApi(parentContactId, updatePayload);
      if (updateResponse.error || !updateResponse.data) {
        const errorMessage =
          updateResponse.error || t("error") || "Failed to update parent contact";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await syncParentRelationships(parentContactId, linkedKidIds);
      const relationships = parentRelationshipsRef.current[parentContactId] || [];
      const mappedParent = mapContactToParent(updateResponse.data, relationships);

      toast.success(t("updated_successfully") || "Record updated successfully");
      setIsEditDialogOpen(false);
      setEditingParent(null);
      tableMethods?.updateItem(mappedParent);
    } catch (error) {
      console.error("Error updating parent:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async (selectedRowsParam?: Parent[]) => {
    const fallbackSelectedRows = Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Parent => !!row);

    const selectedRows = selectedRowsParam?.length
      ? selectedRowsParam
      : fallbackSelectedRows;

    const selectedIds = selectedRows
      .map((row) => row._id)
      .filter((id): id is string => !!id);
    
    if (selectedIds.length === 0) return;
    
    const confirmed = await showConfirm(
      t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
    );
    
    if (!confirmed) return;
    
    try {
      if (!isUnifiedContacts) {
        await Promise.all(selectedIds.map((id) => parentsApi.delete(id)));
      } else {
        const contactIds = selectedRows
          .map((row) => row.contactId || row._id)
          .filter((id): id is string => !!id);

        await Promise.all(contactIds.map((contactId) => deleteContactApi(contactId)));
        contactIds.forEach((contactId) => {
          delete parentRelationshipsRef.current[contactId];
        });
      }

      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting parents:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  return (
    <DataTablePageLayout title={t("parents")}>
      <>
        <DataTable<Parent>
          data={[]}
          fetchData={fetchParentsData}
          addData={parentsApi.create}
          updateData={parentsApi.update}
          deleteData={parentsApi.delete}
          columns={mergedColumns}
          actions={actions}
          searchable
          showAdvancedSearch
          onAdvancedSearchChange={setAdvancedFilters}
          initialAdvancedFilters={advancedFilters}
          isPagination={false}
          defaultPageSize={10}
          //@ts-ignore
          idField="_id"
          extraFilters={advancedFilters}
          organazitionId={organization?._id}
          entityType="parents"
          onRefreshReady={useCallback((methods) => setTableMethods(methods), [])}
          rowSelection={rowSelection}
          onRowSelectionChange={useCallback((updater: any) => {
            setRowSelection((prev) => {
              if (typeof updater === "function") {
                return updater(prev);
              } else {
                return updater;
              }
            });
          }, [])}
          visibleRows={useCallback((rows) => setTableRows(rows), [])}
          customLeftButtons={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" /> {t("add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFieldConfigDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <Settings className="w-4 h-4 mr-2" /> {t("configure_fields", "ערוך שדות דינאמיים")}
              </Button>
              <SmartLoadFromExcel
                columns={excelColumns}
                onSaveRows={handleExcelImport}
                excludeFields={["linked_kids"]}
              />
            </div>
          }
          onBulkDelete={handleBulkDelete}
        />
        <AddRecordDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          columns={mergedColumns}
          onAdd={handleAddParent}
          excludeFields={["organizationId"]}
          relationshipFields={{
            linked_kids: {
              options: kidsOptions,
            },
          }}
          defaultValues={{
            organizationId: organization?._id || "",
            linked_kids: [],
          }}
        />
        <AddRecordDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setEditingParent(null);
            }
          }}
          columns={mergedColumns}
          onAdd={handleAddParent}
          onEdit={handleEditParent}
          editMode={true}
          editData={
            editingParent
              ? {
                  firstname: editingParent.firstname,
                  lastname: editingParent.lastname,
                  idNumber: editingParent.idNumber || "",
                  profileImageUrl: editingParent.profileImageUrl || "",
                  linked_kids: Array.isArray(editingParent.linked_kids)
                    ? editingParent.linked_kids.map((k: any) =>
                        typeof k === "string" ? k : k?._id || k?.toString() || k,
                      )
                    : [],
                  ...(editingParent.dynamicFields
                    ? { dynamicFields: editingParent.dynamicFields }
                    : {}),
                }
              : undefined
          }
          relationshipFields={{
            linked_kids: {
              options: kidsOptions,
            },
          }}
          excludeFields={["organizationId"]}
          defaultValues={{
            organizationId: organization?._id || "",
            linked_kids: editingParent?.linked_kids || [],
          }}
        />
        <TableFieldConfigDialog
          open={isFieldConfigDialogOpen}
          onOpenChange={setIsFieldConfigDialogOpen}
          entityType="parents"
          organizationId={organization?._id || ""}
          onSave={() => {
            tableMethods?.refresh();
          }}
        />
      </>
    </DataTablePageLayout>
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
