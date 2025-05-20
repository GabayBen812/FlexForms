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
  const { isEnabled: paymentsFF } = useFeatureFlag("ff_is_show_payments");
  const { isEnabled: usersFF } = useFeatureFlag("ff_is_show_users");
  const { isEnabled: formsFF } = useFeatureFlag("ff_is_show_forms");

  // User role
  const userRole = auth?.user?.role;

  // Data queries
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
    queryKey: ["forms"],
    queryFn: async () => {
      const res = await apiClient.get("/forms");
      return res.data;
    },
    enabled: formsFF,
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
  ].filter(Boolean);

  // Show up to 4 cards based on permissions
  const visibleCards = allCards.slice(0, 4);

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
