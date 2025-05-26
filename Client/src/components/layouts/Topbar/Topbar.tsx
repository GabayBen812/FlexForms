import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { CommandDialogDemo } from "./WebSearch";
import LanguagePicker from "@/components/LanguagePicker";
import { APP_VERSION } from "@/version";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateOrganizationName } from "@/api/organizations";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { t } from "i18next";

function Topbar() {
  const { organization, isOrganizationFetching, refetchOrganization } = useOrganization();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organization?.name || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isEnabled: canEditOrgName } = useFeatureFlag("is_edit_org_name");

  if (!organization || isOrganizationFetching) {
    return null;
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOrganizationName(organization._id, name);
      toast({ title: t("organization_name_updated"), description: undefined });
      setEditing(false);
      refetchOrganization?.();
    } catch (e) {
      toast({ title: "Failed to update organization name.", description: undefined });
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-start gap-2 border-b bg-white absolute w-screen z-50">
      <div className="flex items-center gap-2 px-4 w-full child:w-1/3">
        <div className="flex gap-2 items-center">
          <div className="flex aspect-square size-10 items-center justify-center rounded-md text-sidebar-primary-foreground ">
            <Avatar className="rounded-lg size-10">
              <AvatarImage src={organization?.logo} alt={organization?.name} />
              <AvatarFallback className="rounded-md text-white bg-[var(--datatable-header)]">
                <Hotel className="size-4" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
            {canEditOrgName ? (
              editing ? (
                <div className="flex items-center gap-2">
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={organization?.name}
                    disabled={loading}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={loading || !name.trim()}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <h1
                  className="truncate font-bold text-xl flex items-center gap-2 group cursor-pointer"
                  style={{ color: "var(--primary)" }}
                  onClick={() => { setEditing(true); setName(organization?.name || ""); }}
                >
                  {organization?.name}
                  <span className="transition-opacity opacity-30 group-hover:opacity-100">
                    <Pencil size={18} />
                  </span>
                </h1>
              )
            ) : (
              <h1
                className="truncate font-bold text-xl"
                style={{ color: "var(--primary)" }}
              >
                {organization?.name}
              </h1>
            )}
          </div>
        </div>
        <div className="relative h-20">
          <div className="h-fit justify-center absolute top-5 w-full flex items-center z-50">
            <CommandDialogDemo />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end">
          <span className="text-sm font-semibold">Version: {APP_VERSION}</span>
          <LanguagePicker />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
