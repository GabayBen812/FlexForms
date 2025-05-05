import { useAuth } from "@/hooks/useAuth";

export const getUserOrganizationId = (): string => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.organizationId || "";
};
