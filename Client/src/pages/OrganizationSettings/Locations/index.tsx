import DataTable from "@/components/ui/completed/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { TableAction } from "@/types/ui/data-table-types";
import { z } from "zod";
import DynamicForm, {
  FieldConfig,
} from "@/pages/OrganizationSettings/Departments/DynamicForm";
import {
  fetchLocationsParams,
  deleteLocation,
  updateLocation,
  createLocation,
} from "@/api/locations/index";
import { Location } from "@/types/api/locations";
import i18n from "@/i18n";

const Locations = () => {
  const { t } = useTranslation();

  const columns: ColumnDef<Location>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div>{row.original.name[i18n.language as "he" | "en"]}</div>
      ),
      size: 100,
    },
    {
      accessorKey: "roomNumber",
      header: t("room_number"),
      cell: ({ row }) => <div>{row.original.roomNumber ?? "-"}</div>,
      size: 100,
    },
  ];

  const actions: TableAction<Location>[] = [
    { label: t("edit") },
    { type: "delete", label: t("delete") },
  ];

  const locationFormFields: FieldConfig[] = [
    { name: "name", label: t("name"), type: "language" },
    {
      name: "roomNumber",
      label: t("room_number"),
      type: "text",
    },
  ];

  const locationSchema = z.object({
    name: z.object({
      he: z.string().min(2),
      en: z.string().min(2),
    }),
    roomNumber: z.coerce.number().optional(),
  });

  return (
    <DataTable<Location>
      fetchData={fetchLocationsParams}
      addData={createLocation}
      deleteData={deleteLocation}
      updateData={updateLocation}
      columns={columns}
      actions={actions}
      searchable={true}
      showAddButton={true}
      isPagination={true}
      defaultPageSize={10}
      idField="id"
      renderExpandedContent={({ handleSave, rowData, handleEdit }) => {
        const mode = rowData?.id ? "edit" : "create";
        return (
          <DynamicForm
            mode={mode}
            headerKey="location"
            fields={locationFormFields}
            validationSchema={locationSchema}
            defaultValues={rowData}
            onSubmit={async (data: z.infer<typeof locationSchema>) => {
              if (handleSave && mode === "create") handleSave(data);
              else if (handleEdit && mode === "edit")
                handleEdit({ id: rowData?.id, ...data });
            }}
          />
        );
      }}
    />
  );
};

export default Locations;
