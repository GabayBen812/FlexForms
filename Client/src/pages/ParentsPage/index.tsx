import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";
import { useState, useCallback, useMemo, useRef } from "react";
import { Plus, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Parent } from "@/types/parents/parent";
import { Kid } from "@/types/kids/kid";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { SmartLoadFromExcel } from "@/components/ui/completed/dialogs/SmartLoadFromExcel";
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

const parentsApi = createApiService<Parent>("/parents", {
  includeOrgId: true,
});

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

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
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "idNumber", header: t("id_number") },
    { 
      accessorKey: "linked_kids", 
      header: t("linked_kids"),
      meta: {
        editable: true,
        relationshipOptions: kidsOptions,
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
  }, [visibleColumns, organization, t, kidsOptions]);

  const actions: TableAction<Parent>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const fetchParentsData = useCallback(
    async (params?: ApiQueryParams) => {
      if (!organization?._id) {
        return {
          status: 200,
          data: {
            data: [],
            totalCount: 0,
            totalPages: 0,
          },
        };
      }

      if (!isUnifiedContacts) {
        return parentsApi.fetchAll(params, false, organization._id);
      }

      const contactResponse = await fetchContacts({
        ...(params || {}),
        type: "parent",
      });

      if (contactResponse.error || !contactResponse.data) {
        return contactResponse;
      }

      const contacts = contactResponse.data.data || [];
      const contactIds = contacts.map((contact) => contact._id);

      let relationships: ContactRelationship[] = [];
      if (contactIds.length > 0) {
        const relationshipsResponse = await getRelationshipsForContacts(contactIds);
        if (relationshipsResponse.error || !relationshipsResponse.data) {
          return relationshipsResponse;
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
        status: contactResponse.status,
        data: {
          data: parents,
          totalCount: contactResponse.data.totalCount,
          totalPages: contactResponse.data.totalPages,
        },
      };
    },
    [organization?._id, isUnifiedContacts, mapContactToParent],
  );

  const handleAddParent = async (data: any) => {
    try {
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
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        if (res.status === 200 || res.status === 201) {
          if (res.data) {
            const createdParent = res.data;
            toast.success(t("form_created_success"));
            setIsAddDialogOpen(false);
            tableMethods?.addItem(createdParent);
          } else {
            toast.success(t("form_created_success"));
            setIsAddDialogOpen(false);
            tableMethods?.refresh();
          }
        }
        return;
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
        dynamicFields: namespaceDynamicFields(
          data.dynamicFields as Record<string, unknown> | undefined,
          "parent",
        ),
      };

      const contactResponse = await createContact(contactPayload);
      if (contactResponse.error || !contactResponse.data) {
        const errorMessage =
          contactResponse.error || t("error") || "Failed to create parent contact";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const createdContact = contactResponse.data;
      parentRelationshipsRef.current[createdContact._id] = [];

      await syncParentRelationships(createdContact._id, linkedKidIds);

      const relationships = parentRelationshipsRef.current[createdContact._id] || [];
      const mappedParent = mapContactToParent(createdContact, relationships);

      toast.success(t("form_created_success"));
      setIsAddDialogOpen(false);
      tableMethods?.addItem(mappedParent);
    } catch (error) {
      console.error("Error creating parent:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ||
            (error as any)?.error ||
            t("error") ||
            "An error occurred";
      toast.error(errorMessage);
      throw error;
    }
  };

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
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("parents")}
      </h1>
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
            <SmartLoadFromExcel />
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
        editData={editingParent ? {
          firstname: editingParent.firstname,
          lastname: editingParent.lastname,
          idNumber: editingParent.idNumber || "",
          linked_kids: Array.isArray(editingParent.linked_kids) 
            ? editingParent.linked_kids.map((k: any) => typeof k === 'string' ? k : (k?._id || k?.toString() || k))
            : [],
          ...(editingParent.dynamicFields ? { dynamicFields: editingParent.dynamicFields } : {}),
        } : undefined}
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
