import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel, LogOut, Search, Settings } from "lucide-react";
import { CommandDialogDemo } from "./WebSearch";
import { TabBar } from "./TabBar";
import LanguagePicker from "@/components/LanguagePicker";
import { APP_VERSION } from "@/version";
import { Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateOrganizationName } from "@/api/organizations";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSeasons } from "@/api/seasons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Topbar() {
  const { organization, isOrganizationFetching, refetchOrganization } = useOrganization();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organization?.name || "");
  const [loading, setLoading] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { toast } = useToast();
  
  // Allow editing if user is system_admin OR if feature flag is enabled
  const canEdit = useFeatureFlag("is_edit_org_name").isEnabled || user?.role === "system_admin";
  
  // Check if seasons feature flag is enabled
  const showSeasons = useFeatureFlag("IS_SHOW_SEASONS").isEnabled;

  // Fetch seasons for the dropdown
  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons"],
    queryFn: fetchSeasons,
    enabled: showSeasons,
  });

  // Keyboard shortcut: Cmd/Ctrl+K to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      // Use e.code (physical key) to work with both Hebrew and English keyboard layouts
      // KeyK is the physical K key regardless of keyboard language
      const isKKey = e.code === "KeyK" || e.key === "k" || e.key === "K";
      
      if ((e.metaKey || e.ctrlKey) && isKKey) {
        // Prevent browser's default search behavior
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    // Use capture phase to intercept before browser handles it
    // passive: false ensures preventDefault() works
    const options = { capture: true, passive: false };
    document.addEventListener("keydown", handleKeyDown, options);
    return () => document.removeEventListener("keydown", handleKeyDown, options);
  }, []);

  // Detect if Mac for keyboard shortcut display
  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutHint = isMac ? "⌘K" : "Ctrl+K";

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast({ title: t("logout_failed") || "שגיאה בהתנתקות" });
    }
  };

  return (
    <>
      <div className="absolute top-0 w-screen z-40">
        <TabBar />
      </div>
      <header className="flex h-20 shrink-0 items-center justify-start gap-2 border-b bg-white absolute top-12 w-screen z-50">
        <div className="flex items-center gap-2 px-4 w-full child:w-1/3">
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => navigate("/home")}
              className="flex aspect-square size-10 items-center justify-center rounded-md text-sidebar-primary-foreground cursor-pointer hover:opacity-80 transition-opacity"
              title={t("go_to_homepage") || "Go to homepage"}
            >
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={organization?.logo} alt={organization?.name} />
                <AvatarFallback className="rounded-md text-white bg-[var(--datatable-header)]">
                  <Hotel className="size-4" />
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
              {canEdit ? (
                editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded px-3 py-1.5 text-base w-56 max-w-full"
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
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 w-full max-w-[500px] rounded-lg border bg-background text-muted-foreground hover:bg-muted transition-colors shadow-sm"
              >
                <Search className="h-4 w-4 opacity-50" />
                <span className="flex-1 text-center text-base font-bold">
                  {t("search_in_system") || "Search pages..."}
                </span>
                <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  {shortcutHint}
                </kbd>
              </button>
              <CommandDialogDemo 
                open={commandPaletteOpen} 
                onOpenChange={setCommandPaletteOpen} 
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3">
            {showSeasons && (
              <Select 
                value={organization?.currentSeasonId || ""} 
                disabled={true}
              >
                <SelectTrigger 
                  className="w-[180px] h-9 border-muted bg-muted/30 transition-colors"
                >
                  <SelectValue placeholder={t("seasons:select_season") || "Select season"}>
                    {organization?.currentSeason?.name || 
                     seasons.find(s => s._id === organization?.currentSeasonId)?.name ||
                     t("seasons:no_season_selected") || 
                     "No season selected"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season._id} value={season._id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {user?.role === "system_admin" && (
              <button
                onClick={() => navigate("/organization-settings")}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors opacity-60 hover:opacity-100 ml-2"
                title={t("organization_settings") || "הגדרות ארגון"}
                aria-label={t("organization_settings") || "הגדרות ארגון"}
              >
                <Settings size={24} />
              </button>
            )}
            <span className="text-sm font-semibold">Version: {APP_VERSION}</span>
            <LanguagePicker />
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-md transition-colors opacity-60 hover:opacity-100"
              title={t("logout") || "התנתק"}
              aria-label={t("logout") || "התנתק"}
            >
              <LogOut size={18} className="text-red-600" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Topbar;
