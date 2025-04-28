import { useTranslation } from "react-i18next";
import CallSettingsForm from "./CallSettingsForm";
import { DataTable } from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { useEffect } from "react";
import { CallCategory } from "@/types/api/calls";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Hotel, Trash } from "lucide-react";
import { getImage } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

function CallsSettings() {
  const { t, i18n } = useTranslation();
  const {
    refetchCallCategories,
    fetchCallCategoriesStatus,
    callCategories,
    deleteCallCategory,
    deleteCallCategoryStatus,
  } = useOrganization();

  useEffect(() => {
    refetchCallCategories();
  });

  if (fetchCallCategoriesStatus === "pending" || !callCategories)
    return <div>Loading...</div>;
  const onDelete = (id: number) => {
    deleteCallCategory(id);
  };
  const columns: ColumnDef<CallCategory>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      filterOptions: callCategories.map(
        (callCategory) =>
          callCategory.name[i18n.language as keyof typeof callCategory.name]
      ),
      cell: ({ row }) => {
        const logo: string = row.original.logo;
        const name = row.getValue("name") as { he: string; en: string };
        const displayName = name[i18n.language as keyof typeof name];
        return (
          <div className="capitalize flex gap-2 items-center">
            <Avatar className="rounded-md size-14">
              <AvatarImage src={getImage(logo)} />
              <AvatarFallback className="rounded-md text-white bg-sidebar-primary">
                <Hotel className="size-4" />
              </AvatarFallback>
            </Avatar>
            <span className="ml-2 font-bold">{displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: t("department"),
      cell: ({ row }) => {
        const departmentName = row.original.department.name as {
          he: string;
          en: string;
        };
        const displayDepartment =
          departmentName[i18n.language as keyof typeof departmentName];

        return (
          <div className="capitalize flex gap-2 items-center">
            <Badge variant={"secondary"}>{displayDepartment}</Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,

      cell: ({ row }) => {
        const { id } = row.original;
        return (
          <div className="w-full flex justify-center gap-2">
            <Button variant={"outline"}>
              <Edit />
            </Button>
            <Button
              onClick={() => onDelete(id)}
              loading={deleteCallCategoryStatus === "pending"}
              variant={"destructive"}
            >
              <Trash />
            </Button>
          </div>
        );
      },
    },
  ];
  return (
    <div className="p-2 flex flex-col gap-4">
      <div className="flex w-full justify-between">
        <h1 className="font-medium text-2xl">{t("call_settings")}</h1>
        <CallSettingsForm mode="add" />
      </div>
      <DataTable<CallCategory>
        columns={columns}
        data={callCategories}
        onFilter={(data) => {
          console.log(data, "asdsad");
        }}
      />
    </div>
  );
}

export default CallsSettings;
