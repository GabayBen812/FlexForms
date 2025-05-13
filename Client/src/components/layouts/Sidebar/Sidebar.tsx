import * as React from "react";
import { NavRoutes } from "@/components/layouts/Sidebar/NavRoutes";
import { NavUser } from "@/components/layouts/Sidebar/NewUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isOrganizationFetching } = React.useContext(OrganizationsContext);
  const loading = isOrganizationFetching;
  return (
    <Sidebar className="bg-primary" collapsible="icon" {...props}>
      <SidebarTrigger className=" hover:bg-sidebar-accent/85 hover:text-light bg-sidebar-accent absolute duration-150 ease-in-out top-14 rtl:-left-[10px] ltr:-right-[10px] text-light rounded-full z-50" />

      <SidebarContent>{!loading && <NavRoutes />}</SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
