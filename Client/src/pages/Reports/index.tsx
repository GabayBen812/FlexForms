import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { createApiService } from "@/api/utils/apiFactory";
import { GetTextDirection } from "@/lib/i18n";

const reportsApi = createApiService<any>("/reports/calls", { includeOrgId: true });

export const getAverageCloseTime = () =>
  reportsApi.customRequest("get", "/reports/calls/avg-close-time");

export const getTopClosers = () =>
  reportsApi.customRequest("get", "/reports/calls/top-closers");

export const getCallsByCategory = () =>
  reportsApi.customRequest("get", "/reports/calls/by-category");

export const getStatusPie = () =>
  reportsApi.customRequest("get", "/reports/calls/status-pie");

const mockStatusPie = [
  { name: "Open", value: 10 },
  { name: "InProgress", value: 15 },
  { name: "Closed", value: 25 },
];

const mockCategory = [
  { name: "Cleaning", value: 12 },
  { name: "Plumbing", value: 8 },
  { name: "Electricity", value: 5 },
];

const mockClosers = [
  { name: "Alice", value: 10 },
  { name: "Bob", value: 15 },
  { name: "Charlie", value: 20 },
];

const COLORS = ["#007aff", "#00c853", "#ff1744"];

export default function Reports() {
  const { t } = useTranslation();
  const direction: "rtl" | "ltr" = GetTextDirection();

  const [avgCloseTime, setAvgCloseTime] = useState<number | null>(null);
  const [topClosers, setTopClosers] = useState<any[]>(mockClosers);
  const [callsByCategory, setCallsByCategory] = useState<any[]>(mockCategory);
  const [statusPie, setStatusPie] = useState<any[]>(mockStatusPie);

  useEffect(() => {
    getAverageCloseTime().then((res) => res.data && setAvgCloseTime(res.data));
    getTopClosers().then((res) => res.data && setTopClosers(res.data));
    getCallsByCategory().then((res) => res.data && setCallsByCategory(res.data));
    getStatusPie().then((res) => res.data && setStatusPie(res.data));
  }, []);

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("reports")}</h1>

      <div
        className={`rounded-xl p-4 bg-muted/40 border ${
          direction === "rtl" ? "text-right" : "text-left"
        }`}
      >
        <Tabs defaultValue="overview" dir={direction}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
            <TabsTrigger value="employees">{t("employees")}</TabsTrigger>
            <TabsTrigger value="departments">{t("departments")}</TabsTrigger>
            <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
            <TabsTrigger value="timeline">{t("timeline")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("avg_close_time")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgCloseTime ?? "--"} min</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("status_distribution")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={70}>
                        {statusPie.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("calls_by_category")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={callsByCategory}>
                      <Bar dataKey="value" fill="#007aff" />
                      <Tooltip />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>{t("top_closers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topClosers}>
                    <Bar dataKey="value" fill="#00c853" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
