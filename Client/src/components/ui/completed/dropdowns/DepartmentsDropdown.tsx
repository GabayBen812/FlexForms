import { ChevronsUpDown, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { Department } from "@/types/api/departments";
import { useContext } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { getImage } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
interface DepartmentsDropdownProps {
  selectedDepartment?: Department | null;
  onSelectDepartment: (department: Department) => void;
}

export function DepartmentsDropdown({
  selectedDepartment,
  onSelectDepartment,
}: DepartmentsDropdownProps) {
  //@ts-ignore
  const { departments, departmentsStatus } = useContext(OrganizationsContext);
  const { t } = useTranslation();

  if (departmentsStatus === "pending" || !departments) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="text-right" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
              <Skeleton className="w-8 h-8" />
            </div>
            <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
              <Skeleton className="w-1/2 h-2" />
              <Skeleton className="w-1/4 h-2 mt-2" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  const department = selectedDepartment || departments[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-right"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
                <Avatar className="rounded-md size-8">
                  <AvatarImage
                    //@ts-ignore
                    src={getImage(department?.logo)}
                    alt={department?.name.he}
                  />

                  <AvatarFallback className="rounded-md text-white bg-[var(--datatable-header)]">
                    <Building className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
                <span className="truncate font-semibold">
                  {department ? department.name.he : t("select_department")}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("departments")}
            </DropdownMenuLabel>
            {departments.map((department) => (
              <DropdownMenuItem
                key={department.id}
                onClick={() => onSelectDepartment(department)}
                className="gap-2 p-2"
                disabled={selectedDepartment?.id === department.id}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Avatar className="rounded-md size-8">
                    <AvatarImage
                      //@ts-ignore
                      src={getImage(department.logo)}
                      alt={department.name.he}
                    />
                    <AvatarFallback className="rounded-md text-white bg-sidebar-primary">
                      <Building className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                {department.name.he}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
