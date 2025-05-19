import { useState, useEffect } from 'react';
import { FeatureFlag } from '@/types/feature-flags';
import { DataTable } from '@/components/ui/completed/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { fetchAllFeatureFlags, updateFeatureFlag, deleteFeatureFlag } from '@/api/feature-flags';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import FeatureFlagEditForm from '@/components/forms/FeatureFlagEditForm';
import FeatureFlagOrganizationsModal from '@/components/forms/FeatureFlagOrganizationsModal';
import { fetchAllOrganizations } from '@/api/organizations';


export default function FeatureFlagsTable() {
  const { t } = useTranslation();
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [orgsModalFlag, setOrgsModalFlag] = useState<FeatureFlag | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<{ _id: string; name: string; featureFlagIds: string[] }[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  useEffect(() => {
    async function loadOrgs() {
      setOrgsLoading(true);
      const res = await fetchAllOrganizations();
      // Defensive: support both _id and id, and include featureFlagIds
      const orgs = (res.data || []).map((org: any) => ({
        _id: org._id || org.id,
        name: org.name,
        featureFlagIds: org.featureFlagIds || [],
      }));
      setAllOrganizations(orgs);
      setOrgsLoading(false);
    }
    loadOrgs();
  }, [refreshKey]);

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
          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setEditingFlag(row.original); }}>
            {t('edit', 'Edit')}
          </Button>
          <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); setDeletingFlag(row.original); }}>
            {t('delete', 'Delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">{t('feature_flags', 'Feature Flags')}</h2>
      <DataTable<FeatureFlag>
        data={[]}
        key={refreshKey}
        columns={columns}
        fetchData={fetchAllFeatureFlags}
        addData={async () => { return { data: {} as FeatureFlag, status: 200 }; }}
        updateData={async () => { return { data: {} as FeatureFlag, status: 200 }; }}
        searchable
        isPagination={true}
        onRowClick={row => setOrgsModalFlag(row)}
      />

      {/* Edit Dialog */}
      {editingFlag && (
        <FeatureFlagEditForm
          flag={editingFlag}
          onClose={() => setEditingFlag(null)}
          onUpdated={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* Organization Assignment Modal */}
      {orgsModalFlag && (
        <FeatureFlagOrganizationsModal
          flag={orgsModalFlag}
          organizations={allOrganizations}
          onClose={() => setOrgsModalFlag(null)}
          onUpdated={() => setRefreshKey(k => k + 1)}
          //@ts-ignore
          isLoading={orgsLoading}
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