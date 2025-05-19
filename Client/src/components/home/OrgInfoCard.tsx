import { useContext } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function OrgInfoCard() {
  const { organization } = useContext(OrganizationsContext);

  if (!organization) return null;

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Building2 className="w-6 h-6 text-primary" />
        <span className="text-lg font-semibold">{organization.name}</span>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-1">מספר מזהה: {organization.id || organization._id}</div>
        {/* @ts-ignore */}
        {organization.admins && (
          <div className="text-sm text-muted-foreground mb-1">
            {/* @ts-ignore */}
            מנהלים: {organization.admins.map((a: any) => a.fullName || a.email).join(", ")}
          </div>
        )}
        {organization.description && (
          <div className="text-sm text-muted-foreground">{organization.description}</div>
        )}
      </CardContent>
    </Card>
  );
} 