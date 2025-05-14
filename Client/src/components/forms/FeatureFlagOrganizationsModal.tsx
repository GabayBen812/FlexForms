import { useState } from "react";
import { FeatureFlag } from "@/types/feature-flags";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { assignFeatureFlagsToOrganization, removeFeatureFlagFromOrganization } from "@/api/organizations";
import { featureFlagCache } from "@/services/featureFlagCache";
import { useOrganization } from "@/hooks/useOrganization";

interface Props {
  flag: FeatureFlag;
  organizations: { _id: string; name: string; featureFlagIds: string[] }[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function FeatureFlagOrganizationsModal({ flag, organizations, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const { refetchOrganization } = useOrganization();
  // selectedOrgs: orgs that have this flag assigned
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
    organizations
      .filter(org => org.featureFlagIds && org.featureFlagIds.includes(flag._id))
      .map(org => org._id)
  );
  const [saving, setSaving] = useState(false);

  // Compute which orgs are checked (should have this flag)
  const handleOrgChange = (orgId: string) => {
    setSelectedOrgs((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // For each org, if checked and not already assigned, assign. If unchecked and was assigned, remove.
    const orgIdsToAssign = selectedOrgs;
    const orgIdsToRemove = organizations
      .map(org => org._id)
      .filter(orgId => !selectedOrgs.includes(orgId));
    // Assign flag to checked orgs
    await Promise.all(orgIdsToAssign.map(orgId => assignFeatureFlagsToOrganization(orgId, [flag._id])));
    // Remove flag from unchecked orgs
    await Promise.all(orgIdsToRemove.map(orgId => removeFeatureFlagFromOrganization(orgId, flag._id)));
    featureFlagCache.clear();
    if (typeof refetchOrganization === 'function') {
      await refetchOrganization();
    }
    setSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto z-[1200]">
        <DialogTitle>{t("assign_organizations", "Assign Organizations")}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <div className="font-medium mb-2">{t("organizations", "Organizations")}</div>
            <div className="flex flex-wrap gap-2">
              {organizations.map(org => (
                <label key={org._id} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer bg-muted/50 hover:bg-muted transition">
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org._id)}
                    onChange={() => handleOrgChange(org._id)}
                  />
                  <span>{org.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {t("save", "Save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 