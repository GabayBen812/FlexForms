
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Hotel,
  PhoneCall,
  Users,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Ghost,
} from "lucide-react";
import { createApiService } from "@/api/utils/apiFactory";
import { Call } from "@/types/api/calls";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const callsApi = createApiService<Call>("/calls", { includeOrgId: true });
const usersApi = createApiService("/users", { includeOrgId: true });

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [recentCallsCount, setRecentCallsCount] = useState<number>(0);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [pendingCallsCount, setPendingCallsCount] = useState<number>(0);
  const [employeesCount, setEmployeesCount] = useState<number>(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [closedCallsCount, setClosedCallsCount] = useState<number>(0);
  const [avgCloseTime, setAvgCloseTime] = useState<number>(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await usersApi.fetchAll({});
        setEmployees(data || []);
        setEmployeesCount(data?.length ?? 0);
      } catch (err) {
        console.error("Error fetching employees", err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data } = await callsApi.getRecentCalls();
        setRecentCallsCount(data?.length ?? 0);
      } catch (err) {
        console.error("Error fetching recent calls", err);
      }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const { data } = await callsApi.fetchAll({ sortField: "createdAt" });
        if (data) {
          setPendingCallsCount(
            data.filter((c) => c.status === "Open" || c.status === "InProgress").length
          );
          setClosedCallsCount(data.filter((c) => c.status === "Closed").length);

          const closedCalls = data.filter((c) => c.status === "Closed");
          if (closedCalls.length > 0) {
            const totalCloseTime = closedCalls.reduce((sum, call) => {
              const open = new Date(call.createdAt).getTime();
              const close = new Date(call.closedAt ?? call.createdAt).getTime();
              return sum + (close - open);
            }, 0);
            setAvgCloseTime(totalCloseTime / closedCalls.length / 60000); // דקות
          }
          setRecentCalls(data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching calls", err);
      }
    };
    fetchCalls();
  }, []);

  const getStatusColor = (status?: Call["status"]) => {
    switch (status) {
      case "Open":
        return "bg-green-500";
      case "InProgress":
        return "bg-yellow-400";
      case "Closed":
        return "bg-gray-400";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-2">
        {t("welcome_back")}
      </h1>
      <div
        className="h-1 w-20 rounded-full"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <p className="text-muted-foreground mb-4">{t("dashboard_summary")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          onClick={() => navigate("/calls")}
          className="border-[var(--accent)] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("open_calls")}
              </CardTitle>
              <PhoneCall className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentCallsCount}</div>
            <p className="text-xs text-muted-foreground">{t("since_yesterday")}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/employees")}
          className="border-[var(--accent)] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("employees")}
              </CardTitle>
              <Users className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeesCount}</div>
            <p className="text-xs text-muted-foreground">{t("active_users")}</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--accent)] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("avg_close_time")}
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCloseTime ? avgCloseTime.toFixed(2) : "0"} min
            </div>
            <p className="text-xs text-muted-foreground">{t("last_7_days")}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/calls")}
          className="border-[var(--accent)] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("pending_issues")}
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pendingCallsCount > 0 ? "text-red-500" : "text-green-600"
              }`}
            >
              {pendingCallsCount}
            </div>
            <p className="text-xs text-muted-foreground">{t("needs_attention")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle>{t("recent_calls")}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/calls")}
              className="text-[var(--accent)]"
            >
              {t("view_all")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCalls.length > 0 ? (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="p-3 border rounded-md hover:bg-muted/50 transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-sm">{call.title}</h4>
                    <Badge className={getStatusColor(call.status)}>
                      {call.status
                        ? t(call.status.toLowerCase())
                        : t("unknown_status")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {call.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {new Date(call.createdAt).toLocaleDateString("he-IL")}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/calls/${call.id}`)}
                    >
                      {t("details")}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Ghost className="w-10 h-10 text-secondary" />
                <p className="font-medium">{t("no_results_title")}</p>
                <p className="text-sm">{t("no_results_calls")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle>{t("recent_employees")}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/employees")}
              className="text-[var(--accent)]"
            >
              {t("view_all")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {employees.length > 0 ? (
              employees.slice(0, 3).map((emp) => (
                <div
                  key={emp.id}
                  className="p-3 border rounded-md hover:bg-muted/50 transition flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    {emp.avatarUrl ? (
                      <AvatarImage src={emp.avatarUrl} />
                    ) : (
                      <AvatarFallback>
                        <Hotel className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("new_employee")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    {t("details")}
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Ghost className="w-10 h-10 text-secondary" />
                <p className="font-medium">{t("no_results_title")}</p>
                <p className="text-sm">{t("no_results_employees")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
