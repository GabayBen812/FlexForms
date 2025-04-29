import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
// import { z } from "zod";
import DataTable from "@/components/ui/completed/data-table";
import { TableAction } from "@/types/ui/data-table-types";
import { Button } from "@/components/ui/button";
// import { MutationResponse } from "@/types/api/auth";
// import { ApiResponse } from "@/types/ui/data-table-types";

type User = {
  id: string;
  name: string;
  email: string;
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "שם",
    cell: ({ row }) => <div>{row.original.name}</div>,
  },
  {
    accessorKey: "email",
    header: "מייל",
    cell: ({ row }) => <div>{row.original.email}</div>,
  },
];

const actions: TableAction<User>[] = [
  { label: "ערוך", type: "edit" },
  { label: "מחק", type: "delete" },
];

// const userSchema = z.object({
//   name: z.string().min(2, "הכנס שם תקין"),
//   email: z.string().email("הכנס מייל תקין"),
// });



const Users = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-4">משתמשים</h1>

      <DataTable<User>
        // fetchData={async () => {}
        columns={columns}
        actions={actions}
        searchable
        showAddButton
        isPagination
        defaultPageSize={10}
        idField="id"
        renderExpandedContent={({ handleSave, rowData, handleEdit }) => {
          const defaultValues = {
            name: rowData?.name || "",
            email: rowData?.email || "",
          };

          return (
            <div className="p-4 border rounded-md bg-muted/50">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;
                  const email = formData.get("email") as string;

                  const userData = {
                    id: rowData?.id ?? crypto.randomUUID(),
                    name,
                    email,
                  };

                  try {
                    if (rowData?.id && handleEdit) await handleEdit(userData);
                    else if (handleSave) await handleSave(userData);
                  } catch (err) {
                    console.error("Error saving user:", err);
                  }
                }}
              >
                <div>
                  <label className="block mb-1">שם</label>
                  <input
                    name="name"
                    defaultValue={defaultValues.name}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">אימייל</label>
                  <input
                    name="email"
                    defaultValue={defaultValues.email}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <Button type="submit">שמור</Button>
              </form>
            </div>
          );
        }}
      />
    </div>
  );
};

export default Users;
