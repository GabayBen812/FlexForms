import { useTranslation } from "react-i18next";
import { useViewSeason } from "@/hooks/useViewSeason";
import { useOrganization } from "@/hooks/useOrganization";
import { useQuery } from "@tanstack/react-query";
import { fetchSeasons } from "@/api/seasons";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Banner component that displays when a system_admin is viewing a different season
 * than the organization's current season.
 * 
 * Shows a prominent notice with the season name and a button to return to current season.
 */
export function SeasonViewBanner() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const { viewSeasonId, setViewSeasonId, isViewingDifferentSeason } = useViewSeason();

  // Fetch seasons to get the name of the season being viewed
  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons"],
    queryFn: fetchSeasons,
    enabled: isViewingDifferentSeason,
  });

  // Don't render if not viewing a different season
  if (!isViewingDifferentSeason) {
    return null;
  }

  const viewingSeason = seasons.find(s => s._id === viewSeasonId);
  const currentSeason = seasons.find(s => s._id === organization?.currentSeasonId);

  const handleReturnToCurrent = () => {
    if (organization?.currentSeasonId) {
      setViewSeasonId(organization.currentSeasonId);
    }
  };

  return (
    <div className="w-full bg-amber-50 border-b-2 border-amber-200 py-3 px-4 flex items-center justify-center gap-3 shadow-sm z-30">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-semibold text-amber-900">
            {t("viewing_different_season", { seasonName: viewingSeason?.name || "" })}
          </span>
          <span className="text-sm text-amber-700">
            {t("not_current_season_notice")}
          </span>
        </div>
        <Button
          onClick={handleReturnToCurrent}
          variant="outline"
          size="sm"
          className="ltr:ml-4 rtl:mr-4 bg-white hover:bg-amber-100 border-amber-300 text-amber-900 shrink-0"
        >
          <X className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
          {t("return_to_current_season")}
          {currentSeason && ` (${currentSeason.name})`}
        </Button>
      </div>
    </div>
  );
}


