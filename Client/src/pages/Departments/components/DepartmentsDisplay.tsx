import { Card, CardContent } from "@/components/ui/card";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { getImage } from "@/lib/supabase";
import { Department } from "@/types/api/departments";
import { Users } from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";

function DepartmentsDisplay() {
  const { departments } = useContext(OrganizationsContext);

  return (
    <div className="flex flex-wrap gap-4">
      {departments?.map((department) => {
        return (
          <DepartmentDisplay key={department.id} department={department} />
        );
      })}
    </div>
  );
}

function DepartmentDisplay({ department }: { department: Department }) {
  const { i18n, t } = useTranslation();
  const image = String(getImage(department.logo));
  console.log(image, "asdsad");

  return (
    <>
      <Card className="sm:w-[280px] w-full h-[300px] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer">
        <CardContent className="z-20 flex flex-col justify-center items-center gap-2">
          <div className="bg-light rounded-full h-20 w-20 mb-2">
            <img src={image} className="rounded-full h-20 w-20 p-[2px]" />
          </div>
          <div className="font-semibold text-primary text-xl text-center">
            {department.name[i18n.language as "he" | "en"]}
          </div>
          <div className="text-sm text-muted-foreground flex gap-1 rtl:flex-row ltr:flex-row items-center">
            <Users className="w-4" />
            <div className="gap-1 flex">
              <span> {department._count.OrganizationRole}</span>
              <span>{t("people")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default DepartmentsDisplay;
