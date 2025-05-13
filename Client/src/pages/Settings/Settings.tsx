import AccountSettings from "./components/Tabs/AccountSettings";
import { useTranslation } from "react-i18next";

function Settings() {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold my-4 ">{t("settings")}</h1>
      <AccountSettings />
    </div>
  );
}

export default Settings;
