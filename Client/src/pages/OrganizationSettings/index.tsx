import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserTable from "./Departments";
import CallSettingsTable from "./CallSettings";
import { GetDirection } from "@/lib/i18n";
import Locations from "@/pages/OrganizationSettings/Locations";
import { useTranslation } from "react-i18next";
import GeneralSettings from "./GeneralSettings";
import SettingsBreadcrumbs from "./SettingsBreadcrumbs";
import Roles from "./Roles";
import Permissions from "./Roles/Permissions";

function OrganizationSettings() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  const descriptionSettings: Record<string, string> = {
    general: t("edit_general_settings"),
    departments: `breadcrumbs ${t("departments")}`,
    locations: `breadcrumbs ${t("locations")}`,
    calls: `breadcrumbs ${t("call_settings")}`,
    roles: `breadcrumbs ${t("roles")}`,
    permissions: `breadcrumbs ${t("permissions")}`,
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get("tab");
    if (
      tabFromUrl &&
      [
        "general",
        "members",
        "billing",
        "integrations",
        "calls",
        "roles",
      ].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`?tab=${value}`, { replace: true });
  };

  return (
    <div className=" mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("organization_settings")}
      </h1>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
        dir={GetDirection() ? "rtl" : "ltr"}
      >
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger variant={"boxed"} value="general">
            {t("general")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="departments">
            {t("departments")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="locations">
            {t("locations")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="calls">
            {t("call_settings")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="roles">
            {t("roles")}
          </TabsTrigger>
          <TabsTrigger variant={"boxed"} value="permissions">
            {t("permissions")}
          </TabsTrigger>
        </TabsList>

        {/* layout for all tabs */}
        <div className="flex flex-col gap-4 mt-5">
          {/* header with description or breadcrumbs */}
          <div className="border-b border-border pb-4">
            <h1 className="text-lg font-semibold text-primary">
              {t(activeTab)}
            </h1>
            {descriptionSettings[
              activeTab as keyof typeof descriptionSettings
            ].includes("breadcrumbs") ? (
              <SettingsBreadcrumbs
                tabLabels={Object.fromEntries(
                  Object.entries(descriptionSettings)
                    .filter(([_, value]) => value.includes("breadcrumbs"))
                    .map(([key, value]) => [
                      key,
                      value.replace("breadcrumbs ", ""),
                    ])
                )}
              />
            ) : (
              <p className="text-sm text-secondary">
                {descriptionSettings[
                  activeTab as keyof typeof descriptionSettings
                ] || t(activeTab)}
              </p>
            )}
          </div>

          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="departments">
            <UserTable />
          </TabsContent>

          <TabsContent value="locations">
            <Locations />
          </TabsContent>

          <TabsContent value="calls">
            <CallSettingsTable />
          </TabsContent>
          <TabsContent value="roles">
            <Roles />
          </TabsContent>
          <TabsContent value="permissions">
            <Permissions />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default OrganizationSettings;
