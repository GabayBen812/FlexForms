import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DoorOpen } from "lucide-react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarItems() {
  const { t } = useTranslation();
  const { isEnabled: hasRoomsAccess } = useFeatureFlag("rooms");

  return (
    <SidebarMenu>
      {/* ... existing items ... */}
      
      {hasRoomsAccess && (
        <SidebarMenuItem>
          <Link to="/rooms">
            <SidebarMenuButton>
              <DoorOpen className="h-4 w-4" />
              {t("rooms")}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      )}
      
      {/* ... existing items ... */}
    </SidebarMenu>
  );
} 