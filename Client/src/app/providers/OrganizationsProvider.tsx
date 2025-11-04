import React, { ReactNode } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { useOrganization } from "@/hooks/useOrganization";

export const OrganizationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const organization = useOrganization();

  return (
    <OrganizationsContext.Provider value={organization}>
      {children}
    </OrganizationsContext.Provider>
  );
};


