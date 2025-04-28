import { createContext } from "react";
import { useOrganization } from "@/hooks/useOrganization";

// Extract the return type of useOrganization
type OrganizationsContextType = ReturnType<typeof useOrganization>;

// Create the context with the appropriate type
export const OrganizationsContext = createContext<OrganizationsContextType>(
  {} as OrganizationsContextType
);
