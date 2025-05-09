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
import OrganizationSettings from "@/pages/OrganizationSettings";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import ClubsIcon from "@/assets/icons/ClubsIcon";
import Payments from "@/pages/Payments";
import Home from "@/pages/Home";
import Forms from "@/pages/Forms";
import Users from "@/pages/Users";
import LandingPage from "@/pages/LandingPage";
import CreateForm from "@/pages/Forms/createPage/createForm";
import FormDetails from "@/pages/Forms/dashboardPage";
import FormRegistration from "@/pages/Forms/externalPage";
import Clubs from "@/pages/Clubs";
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
        path: "home",
        element: <Home />,
        handle: { title: "home", icon: HomeIcon, showInSidebar: true },
      },
      {
        path: "forms",
        element: <Forms />,
        handle: {
          title: "forms",
          icon: ReportsIcon,
          showInSidebar: true,
        },
      },
      {
        path: "forms/:code",
        element: <FormDetails />,
        handle: { showInSidebar: false },
      },          
      {
        path: "create-form",
        element: <CreateForm />,
        handle: { title: "create_form", icon: ReportsIcon, showInSidebar: false },
      },
      {
        path: "payments",
        element: <Payments />,
        handle: { title: "payments", icon: CallsIcon, showInSidebar: true },
      },
      {
        path: "users",
        element: <Users />,
        handle: { title: "users", icon: PeopleIcon, showInSidebar: true },
      },
      {
        path: "clubs",
        element: <Clubs />,
        handle: { title: "clubs", icon: ClubsIcon, showInSidebar: true },
      },
      {
        path: "organization-settings",
        element: <OrganizationSettings />,
        handle: {
          title: "organization_settings",
          icon: SettingsIcon,
          showInSidebar: true,
        },
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/create-organization", element: <CreateOrganization /> },
  {
    path: "/landing",
    element: <LandingPage />,
    handle: { showInSidebar: false },
  },
  {
    path: "/forms/:code/registration",
    element: <FormRegistration />,
    handle: { showInSidebar: false },
  },
]);
