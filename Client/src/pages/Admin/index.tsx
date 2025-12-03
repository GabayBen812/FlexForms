import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationsTable from './OrganizationsTable';
import FeatureFlagsTable from './FeatureFlagsTable';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateOrganizationDialog from './CreateOrganizationDialog';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir();
  const isRTL = direction === "rtl";
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'system_admin')) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return <div className="p-8 text-center">Loading...</div>;
  if (user.role !== 'system_admin') return null;

  return (
    <div className="p-2 w-full" dir={direction}>
      <Tabs
        defaultValue="organizations"
        className={`w-full ${isRTL ? "text-right" : "text-left"}`}
        dir={direction}
      >
        <div className="flex justify-center">
          <TabsList className="bg-muted rounded-lg p-1 shadow border w-fit mx-auto sm:mx-0">
            <TabsTrigger value="organizations">{t('organizations')}</TabsTrigger>
            <TabsTrigger value="featureFlags">{t('feature_flags', 'Feature Flags')}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="organizations">
          <section className="bg-white rounded-xl shadow p-2 w-full m-2">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("create_organization", "Create Organization")}
              </Button>
            </div>
            <OrganizationsTable />
          </section>
        </TabsContent>
        <TabsContent value="featureFlags">
          <section className="bg-white rounded-xl shadow p-2 w-full m-2">
            <FeatureFlagsTable />
          </section>
        </TabsContent>
      </Tabs>
      <CreateOrganizationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={() => {
          // Invalidate queries to refresh the tables
          queryClient.invalidateQueries({ queryKey: ["organizations"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
      />
    </div>
  );
} 