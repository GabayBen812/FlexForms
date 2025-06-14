import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "@/api/PrivateRoute";
import CreateOrganization from "@/pages/CreateOrganization/CreateOrganization";
import Login from "@/pages/Login/Login";
import { Layout } from "@/components/layouts/Layout";
import HomeIcon from "@/assets/icons/HomeIcon";
import ReportsIcon from "@/assets/icons/ReportsIcon";
import CallsIcon from "@/assets/icons/CallsIcon";
import PaymentsIcon from "@/assets/icons/PaymentsIcon";
import PeopleIcon from "@/assets/icons/PeopleIcon";
import Settings from "@/pages/Settings/Settings";
import OrganizationSettings from "@/pages/OrganizationSettings";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import ClubsIcon from "@/assets/icons/ClubsIcon";
import Payments from "@/pages/Payments";
import Home from "@/pages/Home";
import Forms from "@/pages/Forms";
import Users from "@/pages/Users";
import MacabiTable from "@/pages/MacabiTable";
import Requests from "@/pages/Requests";
import LandingPage from "@/pages/LandingPage";
import CreateForm from "@/pages/Forms/createPage/createForm";
import FormDetails from "@/pages/Forms/dashboardPage";
import FormRegistration from "@/pages/Forms/externalPage";
import Clubs from "@/pages/Clubs";
import { Navigate } from "react-router-dom";
import AdminDashboard from "@/pages/Admin";
import RegistrationSuccess from "@/pages/Forms/externalPage/RegistrationSuccess";
import FormSettings from "@/components/forms/FormSettings";
import PaymentError from "@/pages/Payment/Error"
import PaymentSuccess from "@/pages/Payment/Success"
import Rooms from "@/pages/Rooms";
import { DoorOpen } from "lucide-react";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    handle: { showInSidebar: false },
  },
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
        path: "rooms",
        element: <Rooms />,
        handle: {
          title: "rooms",
          icon: DoorOpen,
          showInSidebar: true,
          featureFlag: "ff_is_show_rooms",
        },
      },
      {
        path: "forms/:code",
        element: <FormDetails />,
        handle: { showInSidebar: false },
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <FormDetails />,
          },
          {
            path: "preview",
            element: <FormDetails />,
          },
          {
            path: "edit",
            element: <FormDetails />,
          },
          {
            path: "settings",
            element: <FormDetails />,
          },
        ],
      },
      {
        path: "create-form",
        element: <CreateForm />,
        handle: {
          title: "create_form",
          icon: ReportsIcon,
          showInSidebar: false,
        },
      },
      {
        path: "payments",
        element: <Payments />,
        handle: {
          title: "payments",
          icon: PaymentsIcon,
          showInSidebar: true,
          featureFlag: "is_show_payments",
        },
      },
      {
        path: "users",
        element: <Users />,
        handle: { title: "users", icon: PeopleIcon, showInSidebar: true },
      },
      {
        path: "clubs",
        element: <Clubs />,
        handle: {
          title: "clubs",
          icon: ClubsIcon,
          showInSidebar: true,
          featureFlag: "is_show_clubs",
        },
      },
      {
        path: "macabi-table",
        element: <MacabiTable />,
        handle: {
          title: "macabi_table",
          icon: ClubsIcon,
          showInSidebar: true,
          isMaccabi: true,
          featureFlag: "is_maccabi",
        },
      },
      {
        path: "requests",
        element: <Requests />,
        handle: { title: "requests", icon: ClubsIcon, showInSidebar: true, featureFlag: "is_show_requests" },
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
        path: "messages",
        element: <OrganizationSettings />,
        handle: {
          title: "messages",
          icon: SettingsIcon,
          showInSidebar: true,
          featureFlag: "is_show_messages"
        },
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "admin",
        element: <AdminDashboard />,
        handle: {
          title: "admin_interface",
          icon: SettingsIcon,
          showInSidebar: true,
          adminOnly: true,
        },
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/create-organization", element: <CreateOrganization /> },
  {
    path: "/forms/:code/registration",
    element: <FormRegistration />,
    handle: { showInSidebar: false },
  },
  {
    path: "/forms/:code/registration/success",
    element: <RegistrationSuccess />,
    handle: { showInSidebar: false },
  },
  {
    path: "/payment/error",
    element: <PaymentError />,
    handle: { showInSidebar: false },
  },
  {
    path: "/payment/success",
    element: <PaymentSuccess />,
    handle: { showInSidebar: false },
  },

]);
