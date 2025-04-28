import { Input } from "@/components/ui/Input";
import DepartmentForm from "@/pages/Departments/components/DepartmentForm";
import DepartmentsDisplay from "@/pages/Departments/components/DepartmentsDisplay";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import DepartmentFormDisplayTypes from "./components/DepartmentFormDisplayTypes";
import { useContext } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";

export const Departments = () => {
  const { t } = useTranslation();
  const { departments } = useContext(OrganizationsContext);

  return (
    <div className="p-2 flex flex-col gap-4">
      <div className="flex w-full justify-between">
        <div className="flex gap-3 items-center mb-3">
          <h1 className="text-2xl text-primary font-semibold">
            {t("departments")}
          </h1>
          <div className="size-6 font-semibold text-sm flex items-center justify-center bg-accent text-light rounded-md">
            {departments?.length}
          </div>
        </div>
      </div>
      <div className="flex w-full justify-between">
        <Input
          icon={<Search className="text-muted-foreground w-4" />}
          placeholder={t("search")}
          className="shadow-sm w-80"
        />
        <h1 className="text-accent underline cursor-pointer">
          {t("manage_departments")}
        </h1>
      </div>
      <DepartmentsDisplay />
    </div>
  );
};
