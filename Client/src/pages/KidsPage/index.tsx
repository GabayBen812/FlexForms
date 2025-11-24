import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";
import { useState, useCallback, useMemo, useRef } from "react";
import { Plus, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { MutationResponse } from "@/types/api/auth";
import { createApiService } from "@/api/utils/apiFactory";
import { Kid } from "@/types/kids/kid";
import { Parent } from "@/types/parents/parent";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { SmartLoadFromExcel } from "@/components/ui/completed/dialogs/SmartLoadFromExcel";
import { AdvancedUpdateDialog } from "@/components/AdvancedUpdateDialog";
import { ProfileAvatar, getProfileImageUrl } from "@/components/ProfileAvatar";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
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
import { parseDateForSubmit } from "@/lib/dateUtils";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

const parentsApi = createApiService<Parent>("/parents", {
  includeOrgId: true,
});

export default function KidsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const { isEnabled: isUnifiedContacts, isLoading: isContactsFlagLoading } = useFeatureFlag("FF_CONTACTS_UNIFIED");
  const kidRelationshipsRef = useRef<Record<string, ContactRelationship[]>>({});
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [isAdvancedUpdateOpen, setIsAdvancedUpdateOpen] = useState(false);
  const [advancedUpdateCount, setAdvancedUpdateCount] = useState(0);
  const [advancedUpdateRows, setAdvancedUpdateRows] = useState<Kid[]>([]);
  const [isAdvancedUpdating, setIsAdvancedUpdating] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Kid) => void;
    updateItem: (item: Kid) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Kid[]>([]);

  // Fetch parents for multi-select
  const { data: parentsData = [] } = useQuery({
    queryKey: ["parents-options", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];
      const res = await parentsApi.fetchAll({}, false, organization._id);
      return (res.data || []) as Parent[];
    },
    enabled: !!organization?._id,
  });

  const parentsOptions = useMemo(
    () =>
      parentsData.map((parent) => ({
        value: parent._id || "",
        label: `${parent.firstname} ${parent.lastname}`,
        contactId: parent.contactId,
      })),
    [parentsData],
  );

  const parentById = useMemo(() => {
    return parentsData.reduce<Record<string, Parent>>((acc, parent) => {
      if (parent._id) {
        acc[parent._id] = parent;
      }
      return acc;
    }, {});
  }, [parentsData]);

  const parentByContactId = useMemo(() => {
    return parentsData.reduce<Record<string, Parent>>((acc, parent) => {
      if (parent.contactId) {
        acc[parent.contactId] = parent;
      }
      return acc;
    }, {});
  }, [parentsData]);

  const mapContactToKid = useCallback(
    (contact: Contact, relationships: ContactRelationship[] = []): Kid => {
      const dynamicFields = denamespaceDynamicFields(
        contact.dynamicFields as Record<string, unknown> | undefined,
        "kid",
      );

      const linkedParentIds = relationships
        .filter((rel) => rel.relation === "child")
        .map((rel) => parentByContactId[rel.targetContactId]?._id)
        .filter((id): id is string => !!id);

      return {
        _id: contact._id,
        contactId: contact._id,
        firstname: contact.firstname,
        lastname: contact.lastname,
        idNumber: contact.idNumber,
        address: contact.address,
        status: contact.status,
        linked_parents: linkedParentIds,
        organizationId: contact.organizationId,
        dynamicFields: dynamicFields as Record<string, any> | undefined,
      };
    },
    [parentByContactId],
  );

  const syncKidRelationships = useCallback(
    async (kidContactId: string, linkedParentIds: string[]) => {
      const existingRelationships = kidRelationshipsRef.current[kidContactId] || [];
      const existingParentContactIds = existingRelationships.map((rel) => rel.targetContactId);

      const desiredParentContactIds = linkedParentIds
        .map((parentId) => parentById[parentId]?.contactId)
        .filter((id): id is string => !!id);

      const toAdd = desiredParentContactIds.filter((contactId) => !existingParentContactIds.includes(contactId));
      const toRemove = existingParentContactIds.filter((contactId) => !desiredParentContactIds.includes(contactId));

      const updatedRelationships = existingRelationships.filter(
        (rel) => !toRemove.includes(rel.targetContactId),
      );

      if (toAdd.length > 0) {
        for (const parentContactId of toAdd) {
          const response = await upsertRelationship(kidContactId, {
            targetContactId: parentContactId,
            relation: "child",
          });
          if (!response.error && response.data) {
            updatedRelationships.push(response.data);
          }

          await upsertRelationship(parentContactId, {
            targetContactId: kidContactId,
            relation: "parent",
          });
        }
      }

      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map(async (parentContactId) => {
            await removeRelationship(kidContactId, parentContactId);
            await removeRelationship(parentContactId, kidContactId);
          }),
        );
      }

      kidRelationshipsRef.current[kidContactId] = updatedRelationships;
    },
    [parentById],
  );

  // Custom selection column with edit icon
  const selectionColumn: ColumnDef<Kid> = {
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
            setEditingKid(row.original);
            setIsEditDialogOpen(true);
          }}
        />
      </div>
    ),
    enableHiding: false,
    size: 150,
  };
  

  const columns: ColumnDef<Kid>[] = [
    selectionColumn,
    {
      id: "profilePicture",
      header: t("profile_picture", "תמונת פרופיל"),
      enableSorting: false,
      meta: { editable: false, excludeFromSearch: true },
      cell: ({ row }) => {
        const kid = row.original;
        const imageUrl = getProfileImageUrl(kid);
        const name = [kid.firstname, kid.lastname].filter(Boolean).join(" ");

        return (
          <div className="flex justify-center">
            <ProfileAvatar name={name} imageUrl={imageUrl} size="sm" />
          </div>
        );
      },
      size: 90,
    },
    { accessorKey: "firstname", header: t("firstname"), meta: { editable: true } },
    { accessorKey: "lastname", header: t("lastname"), meta: { editable: true } },
    { accessorKey: "idNumber", header: t("id_number"), meta: { editable: true } },
    { 
      accessorKey: "linked_parents", 
      header: t("linked_parents"), 
      meta: { 
        editable: true,
        relationshipOptions: parentsOptions,
      } 
    },
    { accessorKey: "organizationId", header: "", meta: { hidden: true, editable: false } },
    // Place selectionColumn as the last item so it renders at the right side of the table.
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  // Merge static columns with dynamic fields
  const mergedColumns = useMemo(() => {
    // Update columns with current parentsOptions
    const updatedColumns = visibleColumns.map((col) => {
      if ((col as any).accessorKey === "linked_parents") {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            relationshipOptions: parentsOptions,
          },
        };
      }
      return col;
    });
    return mergeColumnsWithDynamicFields(
      updatedColumns,
      "kids",
      organization,
      t
    );
  }, [visibleColumns, organization, t, parentsOptions]);

  const excelColumns = useMemo(() => mergedColumns, [mergedColumns]);

  const columnMetaMap = useMemo(() => {
    const map = new Map<string, ColumnDef<Kid>>();
    mergedColumns.forEach((column) => {
      const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
      if (accessorKey) {
        map.set(accessorKey, column);
      }
    });
    return map;
  }, [mergedColumns]);

  const actions: TableAction<Kid>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const fetchKidsData = useCallback(
    async (params?: ApiQueryParams) => {
      if (!organization?._id) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<Kid>;
      }

      if (!isUnifiedContacts) {
        return kidsApi.fetchAll(params, false, organization._id);
      }

      const contactResponse = await fetchContacts({
        ...(params || {}),
        type: "kid",
      });

      if (contactResponse.error || !contactResponse.data) {
        return {
          status: contactResponse.status,
          error: contactResponse.error,
          data: undefined,
        } as MutationResponse<Kid[]>;
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
          } as MutationResponse<Kid[]>;
        }
        relationships = relationshipsResponse.data;
      }

      const relationshipsMap = relationships
        .filter((rel) => rel.relation === "child")
        .reduce<Record<string, ContactRelationship[]>>((acc, rel) => {
          if (!acc[rel.sourceContactId]) {
            acc[rel.sourceContactId] = [];
          }
          acc[rel.sourceContactId].push(rel);
          return acc;
        }, {});

      kidRelationshipsRef.current = relationshipsMap;

      const kids = contacts.map((contact) => mapContactToKid(contact, relationshipsMap[contact._id] || []));

      return {
        data: kids,
        totalCount: contactResponse.data.totalCount,
        totalPages: contactResponse.data.totalPages,
      } as ApiResponse<Kid>;
    },
    [organization?._id, isUnifiedContacts, mapContactToKid],
  );

  const createKidRecord = useCallback(
    async (
      data: any,
      options: { skipIdValidation?: boolean } = {},
    ): Promise<{ kid?: Kid; shouldRefresh?: boolean }> => {
      const { skipIdValidation = false } = options;

      if (!skipIdValidation && data.idNumber && data.idNumber.trim() !== "") {
        if (!isValidIsraeliID(data.idNumber)) {
          throw new Error(t("invalid_israeli_id") || "תעודת זהות לא תקינה");
        }
      }

      if (!isUnifiedContacts) {
        const newKid = {
          ...data,
          organizationId: organization?._id || "",
          linked_parents: Array.isArray(data.linked_parents) ? data.linked_parents : [],
          ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
        };
        const res = await kidsApi.create(newKid);

        if (res.error) {
          const errorMessage = res.error || t("error") || "Failed to create kid";
          throw new Error(errorMessage);
        }

        if (res.status === 200 || res.status === 201) {
          if (res.data) {
            return { kid: res.data };
          }
          return { shouldRefresh: true };
        }
        return { shouldRefresh: true };
      }

      if (!organization?._id) {
        throw new Error(t("organization_required") || "Organization context missing");
      }

      const linkedParentIds: string[] = Array.isArray(data.linked_parents) ? data.linked_parents : [];

      const contactPayload = {
        firstname: data.firstname,
        lastname: data.lastname,
        type: "kid" as const,
        organizationId: organization._id,
        idNumber: data.idNumber,
        address: data.address,
        dynamicFields: namespaceDynamicFields(
          data.dynamicFields as Record<string, unknown> | undefined,
          "kid",
        ),
      };

      const contactResponse = await createContact(contactPayload);
      if (contactResponse.error || !contactResponse.data) {
        const errorMessage = contactResponse.error || t("error") || "Failed to create kid contact";
        throw new Error(errorMessage);
      }

      const createdContact = contactResponse.data;
      kidRelationshipsRef.current[createdContact._id] = [];

      await syncKidRelationships(createdContact._id, linkedParentIds);

      const relationships = kidRelationshipsRef.current[createdContact._id] || [];
      const mappedKid = mapContactToKid(createdContact, relationships);

      return { kid: mappedKid };
    },
    [isUnifiedContacts, organization?._id, t, syncKidRelationships, mapContactToKid],
  );

  const handleAddKid = async (data: any) => {
    try {
      const result = await createKidRecord(data);
      toast.success(t("form_created_success"));
      if (isAddDialogOpen) {
        setIsAddDialogOpen(false);
      }
      if (result.kid) {
        tableMethods?.addItem(result.kid);
      } else {
        tableMethods?.refresh();
      }
    } catch (error) {
      console.error("Error creating kid:", error);
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
          await createKidRecord(preparedRows[index], { skipIdValidation: true });
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
    [createKidRecord, tableMethods, t, transformExcelRow],
  );

  const handleEditKid = async (data: any) => {
    if (!editingKid?._id) return;
    try {
      if (!isUnifiedContacts) {
        const updatedKid = {
          ...data,
          id: editingKid._id,
          organizationId: organization?._id || "",
          linked_parents: Array.isArray(data.linked_parents)
            ? data.linked_parents
            : Array.isArray(editingKid.linked_parents)
            ? editingKid.linked_parents.map((p: any) =>
                typeof p === "string" ? p : p?._id || p?.toString() || p,
              )
            : [],
          ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
        };
        const res = await kidsApi.update(updatedKid);
        if (res.status === 200 || res.data) {
          const updatedKidData = res.data;
          toast.success(t("updated_successfully") || "Record updated successfully");
          setIsEditDialogOpen(false);
          setEditingKid(null);
          tableMethods?.updateItem(updatedKidData);
        }
        return;
      }

      const kidContactId = editingKid.contactId || editingKid._id;
      if (!kidContactId) {
        throw new Error(t("error") || "Missing contact identifier");
      }

      const linkedParentIds: string[] = Array.isArray(data.linked_parents)
        ? data.linked_parents
        : Array.isArray(editingKid.linked_parents)
        ? editingKid.linked_parents
        : [];

      const updatePayload = {
        firstname: data.firstname,
        lastname: data.lastname,
        idNumber: data.idNumber,
        address: data.address,
        dynamicFields: namespaceDynamicFields(
          data.dynamicFields as Record<string, unknown> | undefined,
          "kid",
        ),
      };

      const updateResponse = await updateContactApi(kidContactId, updatePayload);
      if (updateResponse.error || !updateResponse.data) {
        const errorMessage = updateResponse.error || t("error") || "Failed to update kid contact";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await syncKidRelationships(kidContactId, linkedParentIds);
      const relationships = kidRelationshipsRef.current[kidContactId] || [];
      const mappedKid = mapContactToKid(updateResponse.data, relationships);

      toast.success(t("updated_successfully") || "Record updated successfully");
      setIsEditDialogOpen(false);
      setEditingKid(null);
      tableMethods?.updateItem(mappedKid);
    } catch (error) {
      console.error("Error updating kid:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async (selectedRowsParam?: Kid[]) => {
    const fallbackSelectedRows = Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Kid => !!row);

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
        await Promise.all(selectedIds.map((id) => kidsApi.delete(id)));
      } else {
        const contactIds = selectedRows
          .map((row) => row.contactId || row._id)
          .filter((id): id is string => !!id);

        await Promise.all(contactIds.map((contactId) => deleteContactApi(contactId)));
        contactIds.forEach((contactId) => {
          delete kidRelationshipsRef.current[contactId];
        });
      }

      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting kids:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  const getFallbackSelectedRows = useCallback((): Kid[] => {
    return Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Kid => !!row);
  }, [rowSelection, tableRows]);

  const handleBulkAdvancedUpdate = (selectedRowsParam: Kid[]) => {
    const rowsToUpdate = selectedRowsParam.length
      ? selectedRowsParam
      : getFallbackSelectedRows();

    if (!rowsToUpdate.length) {
      toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
      return;
    }

    setAdvancedUpdateRows(rowsToUpdate);
    setAdvancedUpdateCount(rowsToUpdate.length);
    setIsAdvancedUpdateOpen(true);
  };

  const handleAdvancedUpdateConfirm = async (field: string, value: string | string[]) => {
    const rowsToUpdate = advancedUpdateRows.length
      ? advancedUpdateRows
      : getFallbackSelectedRows();

    const ids = rowsToUpdate
      .map((row) => row._id)
      .filter((id): id is string => !!id);

    if (!ids.length) {
      toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
      return;
    }

    const payload: Record<string, any> = field.startsWith("dynamicFields.")
      ? {
          dynamicFields: {
            [field.replace("dynamicFields.", "")]: value,
          },
        }
      : { [field]: value };

    try {
      setIsAdvancedUpdating(true);

      if (!isUnifiedContacts) {
        await Promise.all(
          ids.map((id) =>
            kidsApi.update({
              id,
              organizationId: organization?._id || "",
              ...payload,
            }),
          ),
        );
      } else {
        if (field === "linked_parents") {
          const updatedValue = Array.isArray(value)
            ? value
            : value
            ? [value]
            : [];

          await Promise.all(ids.map((contactId) => syncKidRelationships(contactId, updatedValue)));
        } else {
          await Promise.all(
            ids.map(async (contactId) => {
              const contactPayload: Record<string, unknown> = {};
              Object.entries(payload).forEach(([key, val]) => {
                if (key === "dynamicFields") {
                  contactPayload.dynamicFields = namespaceDynamicFields(
                    val as Record<string, unknown>,
                    "kid",
                  );
                } else {
                  contactPayload[key] = val;
                }
              });

              const response = await updateContactApi(contactId, contactPayload);
              if (response.error) {
                throw new Error(response.error);
              }
            }),
          );
        }
      }

      toast.success(t("updated_successfully"));
      tableMethods?.refresh();
      setRowSelection({});
      setAdvancedUpdateRows([]);
    } catch (error) {
      console.error("Advanced update failed", error);
      toast.error(t("error"));
      throw error;
    } finally {
      setIsAdvancedUpdating(false);
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("kids")}
      </h1>
      <DataTable<Kid>
        data={[]}
        fetchData={fetchKidsData}
        addData={kidsApi.create}
        updateData={kidsApi.update}
        deleteData={kidsApi.delete}
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
        entityType="kids"
        onRefreshReady={useCallback((methods) => setTableMethods(methods), [])}
        rowSelection={rowSelection}
        onRowSelectionChange={useCallback((updater: any) => {
          setRowSelection((prev) => {
            if (typeof updater === 'function') {
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
              className="flex items-center gap-2 rounded-full border-transparent bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/40 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:from-emerald-500 hover:via-green-500 hover:to-teal-400 hover:text-white hover:shadow-xl hover:shadow-emerald-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-2" /> {t("add")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsFieldConfigDialogOpen(true)}
              className="flex items-center gap-2 rounded-full border-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200/40 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-400 hover:text-white hover:shadow-xl hover:shadow-purple-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200 focus-visible:ring-offset-2"
            >
              <Settings className="w-4 h-4 mr-2" /> {t("configure_fields", "ערוך שדות דינאמיים")}
            </Button>
            <SmartLoadFromExcel 
              columns={excelColumns} 
              onSaveRows={handleExcelImport}
              excludeFields={["linked_parents"]}
            />
          </div>
        }
        onBulkDelete={handleBulkDelete}
        onBulkAdvancedUpdate={handleBulkAdvancedUpdate}
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={mergedColumns}
        onAdd={handleAddKid}
        excludeFields={["organizationId"]}
        relationshipFields={{
          linked_parents: {
            options: parentsOptions,
          },
        }}
        defaultValues={{
          organizationId: organization?._id || "",
          linked_parents: [],
        }}
      />
      <AddRecordDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingKid(null);
          }
        }}
        columns={mergedColumns}
        onAdd={handleAddKid}
        onEdit={handleEditKid}
        editMode={true}
        editData={editingKid ? {
          firstname: editingKid.firstname,
          lastname: editingKid.lastname,
          idNumber: editingKid.idNumber || "",
          linked_parents: Array.isArray(editingKid.linked_parents) 
            ? editingKid.linked_parents.map((p: any) => typeof p === 'string' ? p : (p?._id || p?.toString() || p))
            : [],
          ...(editingKid.dynamicFields ? { dynamicFields: editingKid.dynamicFields } : {}),
        } : undefined}
        relationshipFields={{
          linked_parents: {
            options: parentsOptions,
          },
        }}
        excludeFields={["organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
          linked_parents: editingKid?.linked_parents || [],
        }}
      />
      <TableFieldConfigDialog
        open={isFieldConfigDialogOpen}
        onOpenChange={setIsFieldConfigDialogOpen}
        entityType="kids"
        organizationId={organization?._id || ""}
        onSave={() => {
          tableMethods?.refresh();
        }}
      />
      <AdvancedUpdateDialog
        open={isAdvancedUpdateOpen}
        onOpenChange={(open) => {
          if (!open && isAdvancedUpdating) {
            return;
          }
          setIsAdvancedUpdateOpen(open);
          if (!open) {
            setAdvancedUpdateCount(0);
            setAdvancedUpdateRows([]);
          }
        }}
        columns={mergedColumns}
        selectedRowCount={advancedUpdateCount}
        onUpdate={handleAdvancedUpdateConfirm}
      />
    </div>
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
