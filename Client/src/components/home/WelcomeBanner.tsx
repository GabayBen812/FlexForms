import { useContext } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { AuthContext } from "@/contexts/AuthContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function WelcomeBanner() {
  const { organization } = useContext(OrganizationsContext);
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  return (
    <Card className="mb-6 shadow-none bg-transparent border-none">
      <CardHeader className="pb-2">
        <h2 className="text-2xl font-bold text-primary">
          {t("welcome", "ברוך הבא")}{user?.name ? `, ${user.name}` : ""}!
        </h2>
      </CardHeader>
      <CardContent>
        <div className="text-lg text-muted-foreground">
          {organization?.name
            ? t("welcome_org", `לארגון ${organization.name}`)
            : t("welcome_flexforms", "ל-FlexForms!")}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {t("motivation", "מאחלים לך יום עבודה מוצלח ופורה!")}
        </div>
      </CardContent>
    </Card>
  );
} 