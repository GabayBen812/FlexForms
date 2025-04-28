import { AvatarFallback, AvatarImage, Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Organization } from "@/types/api/organization";
import { ChevronsUpDown, Hotel } from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  setSelectedOrganization: (organization: Organization) => void;
  selectedOrganization: Organization | null;
}

function OrganizationSettingsOrgSelect({
  selectedOrganization,
  setSelectedOrganization,
}: Props) {
  const { organizations } = useContext(OrganizationsContext);
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent shadow-sm border border-border data-[state=open]:text-sidebar-accent-foreground rtl:flex-row-reverse ltr:flex-row"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
            <Avatar className="rounded-md size-8">
              <AvatarImage
                src={selectedOrganization?.logo}
                alt={selectedOrganization?.name}
              />
              <AvatarFallback className="rounded-md text-white bg-sidebar-primary">
                <Hotel className="size-4" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
            <span className="truncate">{selectedOrganization?.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("organizations")}
        </DropdownMenuLabel>
        {organizations?.map((organizationChild) => (
          <DropdownMenuItem
            key={organizationChild.id}
            onClick={() => setSelectedOrganization(organizationChild)}
            className="gap-2 p-2"
            disabled={organizationChild.id === selectedOrganization?.id}
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
  );
}

export default OrganizationSettingsOrgSelect;
