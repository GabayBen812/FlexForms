import React, { ReactNode, useEffect } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

export const OrganizationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const organization = useOrganization();

  useEffect(() => {
    const accentColor = organization.organization?.customStyles?.accentColor;
    const resolvedColor = resolveTheme(accentColor).accent;
    const resolvedTablesColor = resolveTheme(accentColor).datatableHeader;
    const resolveColorPrimary = resolveTheme(accentColor).primary;
    const resolvedBackgroundColor = resolveTheme(accentColor).background;
    const resolvedTabsBg = resolveTheme(accentColor).tabsBg;
    
    document.documentElement.style.setProperty("--accent", resolvedColor);
    document.documentElement.style.setProperty(
      "--sidebar-accent",
      resolvedColor
    );
    document.documentElement.style.setProperty(
      "--datatable-header",
      resolvedTablesColor
    );
    document.documentElement.style.setProperty(
      "--primary",
      resolveColorPrimary
    );
    document.documentElement.style.setProperty(
      "--background",
      resolvedBackgroundColor
    );
    document.documentElement.style.setProperty("--border", resolvedTabsBg);
  }, [organization.organization]);

  return (
    <OrganizationsContext.Provider value={organization}>
      {children}
    </OrganizationsContext.Provider>
  );
};


