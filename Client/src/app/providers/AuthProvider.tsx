import React, { ReactNode } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();
  const contextValue = auth;
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};


