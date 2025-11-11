import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchAllFeatureFlags } from "@/api/feature-flags";
import { Organization } from "@/types/api/organization";
import { FeatureFlag } from "@/types/feature-flags";
import { ApiQueryParams } from "@/types/ui/data-table-types";
import { cn } from "@/lib/utils";

type OrganizationEditDialogProps = {
  open: boolean;
  organization: Organization | null;
  onClose: () => void;
  onSave: (payload: { name: string; description?: string; featureFlagIds: string[] }) => Promise<void>;
};

const FEATURE_FLAGS_QUERY_PARAMS: Pick<ApiQueryParams, "page" | "pageSize"> = {
  page: 1,
  pageSize: 1000,
};

export default function OrganizationEditDialog({
  open,
  organization,
  onClose,
  onSave,
}: OrganizationEditDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [flagSearch, setFlagSearch] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feature-flags", "organizations-dialog"],
    queryFn: async () => {
      const response = await fetchAllFeatureFlags(FEATURE_FLAGS_QUERY_PARAMS);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const featureFlags: FeatureFlag[] = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (open && organization) {
      setName(organization.name ?? "");
      setDescription(organization.description ?? "");
      setSelectedFlags(organization.featureFlagIds ?? []);
      setFlagSearch("");
      setShowOnlySelected(false);
    } else if (!open) {
      setName("");
      setDescription("");
      setSelectedFlags([]);
      setIsSaving(false);
      setFlagSearch("");
      setShowOnlySelected(false);
    }
  }, [open, organization]);

  const toggleFlag = (flagId: string) => {
    setSelectedFlags((prev) =>
      prev.includes(flagId)
        ? prev.filter((id) => id !== flagId)
        : [...prev, flagId]
    );
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        featureFlagIds: selectedFlags,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedSearch = flagSearch.trim().toLowerCase();

  const filteredFlags = useMemo(() => {
    return featureFlags.filter((flag) => {
      if (showOnlySelected && !selectedFlags.includes(flag._id)) {
        return false;
      }
      if (!normalizedSearch) return true;
      return (
        flag.name.toLowerCase().includes(normalizedSearch) ||
        flag.key.toLowerCase().includes(normalizedSearch) ||
        (flag.description ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [featureFlags, normalizedSearch, selectedFlags, showOnlySelected]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          {t("loading", "Loading...")}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="py-6 text-center text-destructive">
          {t("feature_flags_load_error", "Failed to load feature flags.")}
        </div>
      );
    }

    if (!featureFlags.length) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          {t("no_feature_flags_available", "No feature flags available.")}
        </div>
      );
    }

    if (!filteredFlags.length) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          {t("no_matching_feature_flags", "No feature flags match the filters.")}
        </div>
      );
    }

    return (
      <div className="border rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 bg-muted/20">
        {filteredFlags.map((flag) => (
          <label
            key={flag._id}
            className={cn(
              "flex items-start gap-3 rounded-md border border-transparent p-2 transition-colors",
              selectedFlags.includes(flag._id)
                ? "bg-primary/5 border-primary/40"
                : "hover:bg-muted"
            )}
          >
            <Checkbox
              checked={selectedFlags.includes(flag._id)}
              onCheckedChange={() => toggleFlag(flag._id)}
            />
            <div className="space-y-0.5">
              <p className="font-medium text-sm text-foreground">{flag.name}</p>
              <p className="text-xs text-muted-foreground break-words">
                {flag.description || flag.key}
              </p>
            </div>
          </label>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[92vh]">
        <form onSubmit={handleSave} className="flex flex-col min-h-0 max-h-[90vh]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">
              {t("edit_organization_title", "Edit Organization")}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-y-auto space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("organization_name")}
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("organization_description")}
              </label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("organization_feature_flags", "Feature Flags")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "organization_feature_flags_helper",
                    "Enable or disable feature flags for this organization."
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Input
                  value={flagSearch}
                  onChange={(event) => setFlagSearch(event.target.value)}
                  placeholder={t(
                    "feature_flags_search_placeholder",
                    "Search feature flags..."
                  )}
                  className="lg:max-w-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOnlySelected((prev) => !prev)}
                  className={cn(
                    "whitespace-nowrap transition-colors",
                    showOnlySelected
                      ? "bg-primary/15 text-primary border-primary/40 hover:bg-primary/20"
                      : "hover:bg-muted"
                  )}
                >
                  {showOnlySelected
                    ? t("show_all_feature_flags", "Show all feature flags")
                    : t(
                        "show_only_selected_feature_flags",
                        "Show only selected feature flags"
                      )}
                </Button>
              </div>
              {renderContent()}
            </div>
          </DialogBody>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("saving", "Saving...") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

