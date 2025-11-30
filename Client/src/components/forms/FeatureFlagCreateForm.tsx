import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createFeatureFlag } from "@/api/feature-flags";
import { toast } from "@/hooks/use-toast";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function FeatureFlagCreateForm({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    key: "",
    name: "",
    description: "",
    isEnabled: true,
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitch = (checked: boolean) => {
    setForm((prev) => ({ ...prev, isEnabled: checked }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKey = form.key.trim();
    const trimmedName = form.name.trim();
    if (!trimmedKey || !trimmedName) {
      toast.error(
        t("feature_flag_missing_required_fields", "Key and name are required.")
      );
      return;
    }

    setSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload = {
        key: trimmedKey,
        name: trimmedName,
        description: form.description.trim() || undefined,
        isEnabled: form.isEnabled,
        ...(tags.length ? { tags } : {}),
      };
      const response = await createFeatureFlag(payload);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success(
        t("feature_flag_created_successfully", "Feature flag created successfully.")
      );
      onCreated();
      onClose();
    } catch (error) {
      console.error("Error creating feature flag:", error);
      const message =
        error instanceof Error ? error.message : t("error", "Error");
      toast.error(
        message ||
          t("feature_flag_create_failed", "Failed to create feature flag.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[1200]">
        <DialogTitle>
          {t("create_feature_flag", "Create Feature Flag")}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                {t("key", "Key")}
              </label>
              <Input
                value={form.key}
                name="key"
                onChange={handleChange}
                required
                className="w-full"
                placeholder={t("feature_flag_key_placeholder", "Unique key")}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                {t("name", "Name")}
              </label>
              <Input
                value={form.name}
                name="name"
                onChange={handleChange}
                required
                className="w-full"
                placeholder={t(
                  "feature_flag_name_placeholder",
                  "Feature flag name"
                )}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">
                {t("description", "Description")}
              </label>
              <Input
                value={form.description}
                name="description"
                onChange={handleChange}
                className="w-full"
                placeholder={t(
                  "feature_flag_description_placeholder",
                  "Describe the feature flag"
                )}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                {t("enabled", "Enabled")}
              </label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isEnabled}
                  onCheckedChange={handleSwitch}
                />
                <span>
                  {form.isEnabled ? t("on", "On") : t("off", "Off")}
                </span>
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">
                {t("tags", "Tags")}
              </label>
              <Input
                value={form.tags}
                name="tags"
                onChange={handleChange}
                className="w-full"
                placeholder={t(
                  "feature_flag_tags_placeholder",
                  "Comma separated tags"
                )}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              disabled={saving}
            >
              {t("cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("saving", "Saving...") : t("create", "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}









