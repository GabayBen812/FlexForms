import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { CommandDialogDemo } from "./WebSearch";
import { TabBar } from "./TabBar";
import LanguagePicker from "@/components/LanguagePicker";
import { APP_VERSION } from "@/version";
import { Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateOrganizationName } from "@/api/organizations";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { t } from "i18next";

function Topbar() {
  const { organization, isOrganizationFetching, refetchOrganization } = useOrganization();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organization?.name || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Allow editing if user is system_admin OR if feature flag is enabled
  const canEdit = useFeatureFlag("is_edit_org_name").isEnabled || user?.role === "system_admin";

  if (!organization || isOrganizationFetching) {
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: t("organization_name_empty") });
      return;
    }
    
    setLoading(true);
    try {
      await updateOrganizationName(organization._id, name.trim());
      toast({ title: t("organization_name_updated") });
      setEditing(false);
      refetchOrganization?.();
    } catch (e) {
      toast({ title: t("organization_name_update_failed") });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(organization.name);
    setEditing(false);
  };

  return (
    <>
      <div className="absolute top-0 w-screen z-40">
        <TabBar />
      </div>
      <header className="flex h-16 shrink-0 items-center justify-start gap-2 border-b bg-white absolute top-12 w-screen z-50">
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
              {canEdit ? (
                editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded px-2 py-1 text-sm flex-1"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={organization?.name}
                      disabled={loading}
                      autoFocus
                      onKeyDown={e => { 
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                      }}
                    />
                    <button
                      className="btn btn-primary text-sm px-3 py-1"
                      onClick={handleSave}
                      disabled={loading || !name.trim()}
                    >
                      {t("save")}
                    </button>
                    <button
                      className="btn btn-secondary text-sm px-3 py-1"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <h1
                    className="truncate font-bold text-xl flex items-center gap-2 group cursor-pointer"
                    style={{ color: "var(--primary)" }}
                    onClick={() => { setEditing(true); setName(organization.name); }}
                    title={t("click_to_edit")}
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
    </>
  );
}

export default Topbar;
