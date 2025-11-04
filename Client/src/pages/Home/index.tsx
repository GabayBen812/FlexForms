import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { AuthContext } from "@/contexts/AuthContext";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DoorOpen, Users as UsersIcon, CreditCard } from "lucide-react";
import apiClient from "@/api/apiClient";
import WelcomeBanner from "@/components/home/WelcomeBanner";
import DashboardWidgets from "@/components/home/DashboardWidgets";
import { createApiService } from "@/api/utils/apiFactory";

export default function Home() {
  const { organization } = useContext(OrganizationsContext);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("organization", organization);
  }, []);
  // Feature flags
  const { isEnabled: roomsFF } = useFeatureFlag("ff_is_show_rooms");
  const { isEnabled: paymentsFF } = useFeatureFlag("IS_SHOW_PAYMENTS");
  const { isEnabled: usersFF } = useFeatureFlag("ff_is_show_users");
  const { isEnabled: formsFF } = useFeatureFlag("is_show_forms");
  const { isEnabled: kidsFF } = useFeatureFlag("IS_SHOW_KIDS");
  const { isEnabled: parentsFF } = useFeatureFlag("IS_SHOW_PARENTS");
  const { isEnabled: employeesFF } = useFeatureFlag("IS_SHOW_EMPLYESS");
  const { isEnabled: tasksFF } = useFeatureFlag("IS_SHOW_TASKS");

  const userRole = auth?.user?.role;
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await apiClient.get("/rooms");
      return res.data;
    },
    enabled: roomsFF,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users", organization?._id],
    queryFn: async () => {
      const res = await apiClient.get("/users", {
        params: {
          organizationId: organization?._id,
        },
      });
      return res.data;
    },
    enabled: usersFF || userRole === "admin" || userRole === "system_admin",
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await apiClient.get("/payments");
      return res.data;
    },
    enabled: paymentsFF,
  });

  const { data: forms = [], isLoading: formsLoading } = useQuery({
    queryKey: ["forms", organization?._id],
    queryFn: async () => {
      const res = await apiClient.get("/forms", {
        params: {
          organizationId: organization?._id,
        },
      });
      return res.data;
    },
    enabled: formsFF && !!organization?._id,
  });

  const { data: kids = [], isLoading: kidsLoading } = useQuery({
    queryKey: ["kids", organization?._id],
    queryFn: async () => {
      const res = await apiClient.get("/kids", {
        params: {
          organizationId: organization?._id,
        },
      });
      return res.data;
    },
    enabled: kidsFF && !!organization?._id,
  });

  const { data: parents = [], isLoading: parentsLoading } = useQuery({
    queryKey: ["parents", organization?._id],
    queryFn: async () => {
      const res = await apiClient.get("/parents", {
        params: {
          organizationId: organization?._id,
        },
      });
      return res.data;
    },
    enabled: parentsFF && !!organization?._id,
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees", organization?._id],
    queryFn: async () => {
      const res = await apiClient.get("/employees", {
        params: {
          organizationId: organization?._id,
        },
      });
      return res.data;
    },
    enabled: employeesFF && !!organization?._id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", organization?._id],
    queryFn: async () => {
      const res = await apiClient.get("/tasks", {
        params: {
          organizationId: organization?._id,
        },
      });
      return res.data;
    },
    enabled: tasksFF && !!organization?._id,
  });

  // Prepare all possible cards
  const allCards = [
    roomsFF && {
      key: "rooms",
      title: "חדרים",
      value: roomsLoading ? "..." : rooms.length,
      description: "מספר חדרים בארגון",
      onClick: () => navigate("/rooms"),
      icon: "DoorOpen",
    },
    formsFF && {
      key: "forms",
      title: "טפסים",
      value: formsLoading ? "..." : forms.length,
      description: "מספר טפסים בארגון",
      onClick: () => navigate("/forms"),
      icon: "FileText",
    },
    (usersFF || userRole === "admin" || userRole === "system_admin") && {
      key: "users",
      title: "משתמשים",
      value: usersLoading ? "..." : users.length,
      description: "משתמשים בארגון",
      onClick: () => navigate("/users"),
      icon: "Users",
    },
    paymentsFF && {
      key: "payments",
      title: "תשלומים",
      value: paymentsLoading ? "..." : payments.length,
      description: "סך התשלומים בארגון",
      onClick: () => navigate("/payments"),
      icon: "CreditCard",
    },
    kidsFF && {
      key: "kids",
      title: "ילדים",
      value: kidsLoading ? "..." : (Array.isArray(kids) ? kids.length : 0),
      description: "מספר ילדים בארגון",
      onClick: () => navigate("/kids"),
      icon: "PeopleIcon",
    },
    parentsFF && {
      key: "parents",
      title: "הורים",
      value: parentsLoading ? "..." : (Array.isArray(parents) ? parents.length : 0),
      description: "מספר הורים בארגון",
      onClick: () => navigate("/parents"),
      icon: "PeopleIcon",
    },
    employeesFF && {
      key: "employees",
      title: "עובדים",
      value: employeesLoading ? "..." : (Array.isArray(employees) ? employees.length : 0),
      description: "מספר עובדים בארגון",
      onClick: () => navigate("/employees"),
      icon: "EmployeesIcon",
    },
    tasksFF && {
      key: "tasks",
      title: "משימות",
      value: tasksLoading ? "..." : (Array.isArray(tasks) ? tasks.length : 0),
      description: "מספר משימות בארגון",
      onClick: () => navigate("/tasks"),
      icon: "TasksIcon",
    },
  ].filter(Boolean);

  // Show all cards (removed the 4 card limit)
  const visibleCards = allCards;

  return (
    <div className="min-h-screen w-full bg-muted/50 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-1 flex flex-col">
        <WelcomeBanner />
        <div className="bg-background rounded-xl shadow-sm p-6 mt-6">
          <DashboardWidgets cards={visibleCards} />
        </div>
      </div>
    </div>
  );
}
