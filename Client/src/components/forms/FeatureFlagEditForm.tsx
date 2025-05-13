import { useState } from "react";
import { FeatureFlag } from "@/types/feature-flags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { updateFeatureFlag } from "@/api/feature-flags";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  flag: FeatureFlag;
  organizations: { _id: string; name: string }[];
  onClose: () => void;
  onUpdated: () => void;
};

export default function FeatureFlagEditForm({ flag, organizations, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...flag });
  const [saving, setSaving] = useState(false);

  // For org assignment
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(flag.organizationIds);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSwitch = (checked: boolean) => {
    setForm({ ...form, isEnabled: checked });
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgs((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateFeatureFlag(flag._id, { ...form, organizationIds: selectedOrgs });
    setSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[1200]">
        <DialogTitle>{t("edit_feature_flag", "Edit Feature Flag")}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">{t("key", "Key")}</label>
              <Input value={form.key} name="key" disabled className="w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">{t("name", "Name")}</label>
              <Input value={form.name} name="name" onChange={handleChange} className="w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">{t("description", "Description")}</label>
              <Input value={form.description} name="description" onChange={handleChange} className="w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">{t("enabled", "Enabled")}</label>
              <div className="flex items-center gap-2">
                <Switch checked={form.isEnabled} onCheckedChange={handleSwitch} />
                <span>{form.isEnabled ? t("on", "On") : t("off", "Off")}</span>
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">{t("tags", "Tags")}</label>
              <Input value={form.tags?.join(", ") || ""} name="tags" onChange={e => setForm({ ...form, tags: e.target.value.split(",").map(s => s.trim()) })} className="w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">{t("organizations", "Organizations")}</label>
              <div className="flex flex-wrap gap-2">
                {organizations.map(org => (
                  <label key={org._id} className="flex items-center gap-1 border rounded px-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org._id)}
                      onChange={() => handleOrgChange(org._id)}
                    />
                    {org.name}
                  </label>
                ))}
              </div>
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