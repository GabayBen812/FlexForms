import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GetDirection } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import GeneralSettings from "./GeneralSettings";
import SettingsBreadcrumbs from "./SettingsBreadcrumbs";


function OrganizationSettings() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  const descriptionSettings: Record<string, string> = {
    general: t("edit_general_settings")
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get("tab");
    if (
      tabFromUrl &&
      [
        "general"
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
        </div>
      </Tabs>
    </div>
  );
}

export default OrganizationSettings;
