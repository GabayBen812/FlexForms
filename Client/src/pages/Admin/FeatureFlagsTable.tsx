import { useState, useEffect } from 'react';
import { FeatureFlag } from '@/types/feature-flags';
import { DataTable } from '@/components/ui/completed/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { fetchAllFeatureFlags, updateFeatureFlag, deleteFeatureFlag } from '@/api/feature-flags';
import DynamicForm, { FieldConfig } from '@/components/forms/DynamicForm';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import FeatureFlagEditForm from '@/components/forms/FeatureFlagEditForm';


export default function FeatureFlagsTable() {
  const { t } = useTranslation();
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [orgs, setOrgs] = useState<{ _id: string; name: string }[]>([]);

  // Fetch organizations for assignment (on mount)
  useEffect(() => {
    // Replace with your real API call
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => setOrgs(data.data || data));
  }, []);

  const columns: ColumnDef<FeatureFlag>[] = [
    { accessorKey: 'key', header: t('key', 'Key') },
    { accessorKey: 'name', header: t('name', 'Name') },
    { accessorKey: 'description', header: t('description', 'Description') },
    {
      accessorKey: 'isEnabled',
      header: t('enabled', 'Enabled'),
      cell: ({ row }) => (
        <Switch
          checked={row.original.isEnabled}
          onCheckedChange={async (checked) => {
            await updateFeatureFlag(row.original._id, { isEnabled: checked });
            setRefreshKey((k) => k + 1);
          }}
        />
      ),
    },
    {
      accessorKey: 'tags',
      header: t('tags', 'Tags'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags?.map((tag) => (
            <span key={tag} className="bg-muted px-2 py-0.5 rounded text-xs">{tag}</span>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('actions', 'Actions'),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditingFlag(row.original)}>
            {t('edit', 'Edit')}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeletingFlag(row.original)}>
            {t('delete', 'Delete')}
          </Button>
        </div>
      ),
    },
  ];

  // Define fields for DynamicForm
  const flagFormFields: FieldConfig[] = [
    { name: "key", label: t("key", "Key"), type: "text", disabled: true },
    { name: "name", label: t("name", "Name"), type: "text" },
    { name: "description", label: t("description", "Description"), type: "text" },
    { name: "isEnabled", label: t("enabled", "Enabled"), type: "checkbox" },
    { name: "tags", label: t("tags", "Tags"), type: "text" },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">{t('feature_flags', 'Feature Flags')}</h2>
      <DataTable<FeatureFlag>
        key={refreshKey}
        columns={columns}
        fetchData={fetchAllFeatureFlags}
        searchable
        isPagination={true}
      />

      {/* Edit Dialog */}
      {editingFlag && (
        <FeatureFlagEditForm
          flag={editingFlag}
          organizations={orgs}
          onClose={() => setEditingFlag(null)}
          onUpdated={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* Delete Dialog */}
      {deletingFlag && (
        <Dialog open={!!deletingFlag} onOpenChange={() => setDeletingFlag(null)}>
          <DialogContent>
            <DialogTitle>{t('delete_feature_flag', 'Delete Feature Flag')}</DialogTitle>
            <p>{t('delete_confirm', 'Are you sure you want to delete this feature flag?')}</p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="destructive" onClick={async () => {
                await deleteFeatureFlag(deletingFlag._id);
                setDeletingFlag(null);
                setRefreshKey((k) => k + 1);
              }}>
                {t('delete', 'Delete')}
              </Button>
              <Button variant="outline" onClick={() => setDeletingFlag(null)}>
                {t('cancel', 'Cancel')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 