import React, { useContext } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";

const PrivateRoute: React.FC = () => {
  const auth = useContext(AuthContext);
  const { isOrganizationFetching } = useContext(OrganizationsContext);
  const location = useLocation();
  const { isAuthenticated, isUserLoading } = auth;

  if (isUserLoading || isOrganizationFetching) return <div>Loading...</div>;

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
};

export default PrivateRoute;
