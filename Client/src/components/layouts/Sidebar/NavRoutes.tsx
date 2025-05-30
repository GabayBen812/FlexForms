import { ChevronRight, Plus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { router } from "@/utils/routes/router";
import { Link, NavLink, RouteObject, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isRouteActive } from "@/utils/routes/routesUtils";
import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function NavRoutes() {
  const { user } = useAuth();
  return (
    <SidebarGroup className="gap-4">
      <NewCallButton />
      {router.routes.map((route) => {
        if (!route.handle?.showInSidebar) return null;
        if (route.handle?.adminOnly && user?.role !== 'system_admin') return null;
        return (
          <div key={route.id}>
            {route.handle?.groupLabel && (
              <SidebarGroupLabel>{route.handle?.groupLabel}</SidebarGroupLabel>
            )}
            <SideBarMenuRoute route={route} user={user} />
          </div>
        );
      })}
    </SidebarGroup>
  );
}

function SideBarMenuRoute({ route, user }: { route: RouteObject, user: any }) {
  const { t } = useTranslation();
  const { organization } = useOrganization();

  return (
    <SidebarMenu className="gap-0">
      {route.children?.map((childRoute) => {
        if (!childRoute.handle?.showInSidebar) return null;
        if (childRoute.handle?.adminOnly && user?.role !== 'system_admin') return null;
        if (childRoute.handle?.featureFlag) {
          const { isEnabled } = useFeatureFlag(childRoute.handle.featureFlag);
          if (!isEnabled) return null;
        }
        if (
          childRoute.handle?.isMaccabi &&
          organization?.name !== "מרכז מכבי ישראל"
        ) {
          return null;
        }
        return (
          <Collapsible
            key={childRoute.id}
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem className="">
              {childRoute.children && childRoute.children?.length > 0 && (
                <CollapsibleChildren childRoute={childRoute} />
              )}
              {childRoute.handle?.groupLabel && (
                <SidebarGroupLabel>
                  {childRoute.handle?.groupLabel}
                </SidebarGroupLabel>
              )}
              {!childRoute.children && childRoute.path && (
                <NavLink
                  to={childRoute.path}
                  className={({ isActive }) => `
    ease duration-150 text-sidebar-primary-foreground rounded-none px-2 relative
    ${isActive ? "text-sidebar-accent" : ""}
  `}
                >
                  {({ isActive }) => (
                    <SidebarMenuButton
                      tooltip={t(childRoute.handle.title)}
                      className={`flex items-center w-full ${
                        isActive ? "text-sidebar-accent" : "text-gray-700"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute h-full rtl:left-0 ltr:right-0 w-1 bg-sidebar-accent" />
                      )}
                      <span className="mx-4">
                        {childRoute.handle.icon && (
                          <childRoute.handle.icon isActive={isActive} />
                        )}
                      </span>
                      <span className="font-semibold">
                        {t(childRoute.handle.title)}
                      </span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              )}
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </SidebarMenu>
  );
}

function CollapsibleChildren({ childRoute }: { childRoute: RouteObject }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = isRouteActive(childRoute, currentPath);

  return (
    <>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          className={`${isActive && "text-black"}`}
          tooltip={childRoute.handle.title}
        >
          {childRoute.handle.icon && <childRoute.handle.icon />}
          <span>{childRoute.handle.title}</span>
          <ChevronRight className="ltr:ml-auto rtl:mr-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180" />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {childRoute.children?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.handle.title}>
              <SidebarMenuSubButton asChild>
                <Link to={subItem.path || "/"}>
                  <span
                    className={
                      isRouteActive(subItem, currentPath, true)
                        ? "text-sidebar-accent"
                        : "ease duration-150"
                    }
                  >
                    {subItem.handle.title}
                  </span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </>
  );
}

function NewCallButton() {
  const { t } = useTranslation();
  const { state, isMobile } = useSidebar();
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const fill = resolveTheme(theme).primary;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/create-form");
  };


  return (
    <SidebarMenu>
      <SidebarMenuItem className="m-[2.5px] mt-5">
        <Link to="/create-form">
          <SidebarMenuButton className="text-sidebar-primary-foreground active:bg-none group">
            <span className="flex items-center gap-2 font-bold whitespace-nowrap">
              <div className="rounded-full bg-sidebar-accent p-2 mx-1">
                <Plus className="text-white rounded-full w-5 h-5" />
              </div>
              <span
                className={`${
                  state === "collapsed" && !isMobile ? "hidden" : ""
                } transition-colors`}
                style={{ color: fill }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = fill || "")}
                onClick={handleClick}
              >
                {t("add_x", { x: t("call") })}
              </span>
            </span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
