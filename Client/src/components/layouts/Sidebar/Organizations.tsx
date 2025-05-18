import { useContext } from "react";
import { ChevronsUpDown, Hotel } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export function Organizations({ loading }: { loading: boolean }) {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();
  const { organization } =
    useContext(OrganizationsContext);
  console.log("organization", organization);

  if (loading || !organization) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="text-right" disabled>
            <div className="flex aspect-square size-10 items-center justify-center rounded-md">
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

  return (
    <SidebarMenu>
      <SidebarMenuItem className="data-[state=open]:mx-[5px] mx-[5.5px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-right "
            >
              <div className="flex aspect-square size-10 items-center justify-center rounded-md text-sidebar-primary-foreground">
                <Avatar className="rounded-md size-10">
                  <AvatarImage
                    src={organization?.logo}
                    alt={organization?.name}
                  />
                  <AvatarFallback className="rounded-md text-white bg-sidebar-primary">
                    <Hotel className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
                <span className="truncate font-semibold">
                  {organization?.name}
                </span>
                <span className="truncate text-xs">
                  {/* @ts-ignore */}
                  {organization?.role?.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("organizations")}
            </DropdownMenuLabel>

            {/* @ts-ignore */}
            {organizations.map((organizationChild) => (
              <DropdownMenuItem
                key={organizationChild.id}
                //@ts-ignore
                onClick={() => selectOrganization(organizationChild.id)}
                className="gap-2 p-2"
                disabled={organizationChild.id === organization.id}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Avatar className="rounded-md size-8">
                    <AvatarImage
                      src={organizationChild?.logo}
                      alt={organizationChild?.name}
                    />
                    <AvatarFallback className="rounded-md text-white bg-sidebar-primary">
                      <Hotel className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                {organizationChild.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
