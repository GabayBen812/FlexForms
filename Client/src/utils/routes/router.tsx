// router.js
import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "@/api/PrivateRoute";
import CreateOrganization from "@/pages/CreateOrganization/CreateOrganization";
import Login from "@/pages/Login/Login";
import { Layout } from "@/components/layouts/Layout";
import HomeIcon from "@/assets/icons/HomeIcon";
import ReportsIcon from "@/assets/icons/ReportsIcon";
import CallsIcon from "@/assets/icons/CallsIcon";
import PeopleIcon from "@/assets/icons/PeopleIcon";
import Settings from "@/pages/Settings/Settings";
// import { Departments } from "@/pages/Departments"; // Change All To That
import OrganizationSettings from "@/pages/OrganizationSettings";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import Payments from "@/pages/Payments";
import Home from "@/pages/Home";
import Forms from "@/pages/Forms";
import Users from "@/pages/Users";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <PrivateRoute />
      </Layout>
    ),
    handle: { showInSidebar: true },
    children: [
      {
        path: "/home",
        element: <Home />,
        handle: {
          title: "home",
          icon: HomeIcon,
          showInSidebar: true,
        },
      },
      {
        path: "/forms",
        element: <Forms />,
        handle: {
          title: "forms",
          icon: ReportsIcon,
          showInSidebar: true,
        },
      },
      {
        path: "/payments",
        handle: {
          title: "payments",
          icon: CallsIcon,
          showInSidebar: true,
        },
        element: <Payments />,
      },
      {
        path: "/users",
        element: <Users />,
        handle: { title: "users", showInSidebar: true, icon: PeopleIcon },
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/organization-settings",
        element: <OrganizationSettings />,
        handle: {
          title: "organization_settings",
          showInSidebar: true,
          icon: SettingsIcon,
        },
      },
    ],
  },
  { path: "/create-organization", element: <CreateOrganization /> },
  { path: "/login", element: <Login /> },
]);
