import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Hotel, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Organization } from "@/types/api/organization";
import { useContext, useEffect } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { useTranslation } from "react-i18next";

function Step2() {
  const { t } = useTranslation();
  const {
    organizations,
    organizationsStatus,
    selectOrganization,
    refetchOrganizations,
  } = useContext(OrganizationsContext);
  const navigate = useNavigate();

  useEffect(() => {
    refetchOrganizations();
  }, []);

  const handleOrganizationClick = (organizationId: string) => {
    if (organizationId === "new") navigate(`/create-organization`);
    else {
      selectOrganization(Number(organizationId));
      navigate("/home");
    }
  };

  if (
    organizationsStatus === "pending" ||
    !organizations ||
    !organizations.data
  ) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form className="flex flex-col items-center gap-6 w-full text-right">
      {organizations.data.length === 0 && <NoOrganizations />}
      {organizations.data.length > 0 && (
        <Organizations
          organizations={organizations.data}
          handleOrganizationClick={handleOrganizationClick}
        />
      )}
      <button
        className="flex items-end justify-end space-x-4 rounded-md border p-4 w-full group hover:bg-muted cursor-pointer duration-200 ease-out relative text-right"
        type="button"
        onClick={() => handleOrganizationClick("new")}
      >
        <div className="flex gap-2 flex-grow">
          <Avatar className="rounded-md">
            <AvatarFallback className="rounded-md bg-black text-white">
              <Hotel />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1 ltr:text-left">
            <p className="text-sm font-medium leading-none">
              {t("create_organization")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("create_new_organization")}
            </p>
          </div>
        </div>

        <div className="absolute rtl:left-4 ltr:rotate-180 ltr:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ChevronLeft
            className="text-muted-foreground group-hover:text-foreground"
            size={20}
          />
        </div>
      </button>
    </form>
  );
}

function Organizations({
  organizations,
  handleOrganizationClick,
}: {
  organizations: Organization[];
  handleOrganizationClick: (organizationId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col gap-6">
      <h1 className="font-medium text-2xl text-center">
        חברות משוייכות לחשבון
      </h1>
      <div className="flex flex-col gap-6">
        {organizations.map((organization: Organization) => (
          <button
            className="flex items-end justify-end space-x-4 rounded-md border p-4 w-full group hover:bg-muted cursor-pointer duration-200 ease-out relative text-right"
            type="button"
            key={organization.id}
            onClick={() => handleOrganizationClick(String(organization.id))}
          >
            <div className="flex gap-2 flex-grow rtl:flex-row">
              <Avatar className="rounded-md">
                <AvatarFallback className="rounded-md bg-accent text-white">
                  <Hotel />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 ltr:text-left">
                <p className="text-sm font-medium leading-none">
                  {organization.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("organization_associated_with_account")}
                </p>
              </div>
            </div>

            <div className="absolute rtl:left-4 ltr:rotate-180 ltr:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ChevronLeft
                className="text-muted-foreground group-hover:text-foreground"
                size={20}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NoOrganizations() {
  return (
    <div>
      <h1 className="font-medium text-2xl">לחשבון זה אין חברות משוייכות לו</h1>
    </div>
  );
}

export default Step2;
