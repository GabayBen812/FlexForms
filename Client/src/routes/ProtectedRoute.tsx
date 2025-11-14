import React, { useContext } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { PageLoader } from "@/components/ui/page-loader";

type Props = { children?: React.ReactNode };

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const auth = useContext(AuthContext);
  const { isOrganizationFetching } = useContext(OrganizationsContext);
  const location = useLocation();

  const { isAuthenticated, isLoading: isUserLoading } = auth;

  if (isUserLoading || isOrganizationFetching) {
    return <PageLoader />;
  }

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;


