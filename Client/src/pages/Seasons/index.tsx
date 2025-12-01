import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronUp, ChevronDown, Trash2, Edit2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useNavigate } from "react-router-dom";
import {
  fetchSeasons,
  createSeason,
  updateSeason,
  reorderSeason,
  deleteSeason,
  type Season,
} from "@/api/seasons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function SeasonsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");

  const { isEnabled: hasAccess, isLoading: isFeatureFlagLoading } = useFeatureFlag("IS_SHOW_SEASONS");

  const { data: seasons = [], isLoading: queryLoading } = useQuery({
    queryKey: ["seasons"],
    queryFn: fetchSeasons,
    enabled: !!hasAccess,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createSeason(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({
        title: t("success"),
        description: t("seasons:season_created"),
      });
      setCreateDialogOpen(false);
      setNewSeasonName("");
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error?.response?.data?.message || error.message || t("seasons:failed_to_create"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateSeason(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({
        title: t("success"),
        description: t("seasons:season_updated"),
      });
      setEditingId(null);
      setEditingName("");
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error?.response?.data?.message || error.message || t("seasons:failed_to_update"),
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) => reorderSeason(id, newOrder),
    onMutate: async ({ id, newOrder }) => {
      await queryClient.cancelQueries({ queryKey: ["seasons"] });
      const previousSeasons = queryClient.getQueryData<Season[]>(["seasons"]);

      if (previousSeasons) {
        const seasonIndex = previousSeasons.findIndex((s) => s._id === id);
        if (seasonIndex === -1) return { previousSeasons };

        const season = previousSeasons[seasonIndex];
        const optimisticSeasons = [...previousSeasons];

        // Remove the season from its current position
        optimisticSeasons.splice(seasonIndex, 1);

        // Insert at new position
        const normalizedOrder = Math.max(0, Math.min(newOrder, optimisticSeasons.length));
        optimisticSeasons.splice(normalizedOrder, 0, { ...season, order: normalizedOrder });

        // Update orders
        optimisticSeasons.forEach((s, idx) => {
          s.order = idx;
        });

        queryClient.setQueryData(["seasons"], optimisticSeasons);
      }

      return { previousSeasons };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSeasons) {
        queryClient.setQueryData(["seasons"], context.previousSeasons);
      }
      toast({
        title: t("error"),
        description: t("seasons:failed_to_reorder"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSeason(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({
        title: t("success"),
        description: t("seasons:season_deleted"),
      });
      setDeleteDialogOpen(false);
      setSeasonToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error?.response?.data?.message || error.message || t("seasons:failed_to_delete"),
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (season: Season) => {
    setEditingId(season._id);
    setEditingName(season.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) {
      toast({
        title: t("error"),
        description: t("seasons:name_required"),
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ id: editingId, name: editingName.trim() });
  };

  const handleMoveUp = (season: Season) => {
    if (season.order > 0) {
      reorderMutation.mutate({ id: season._id, newOrder: season.order - 1 });
    }
  };

  const handleMoveDown = (season: Season) => {
    if (season.order < seasons.length - 1) {
      reorderMutation.mutate({ id: season._id, newOrder: season.order + 1 });
    }
  };

  const handleDeleteClick = (season: Season) => {
    setSeasonToDelete(season);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (seasonToDelete) {
      deleteMutation.mutate(seasonToDelete._id);
    }
  };

  const handleCreateSeason = () => {
    if (!newSeasonName.trim()) {
      toast({
        title: t("error"),
        description: t("seasons:name_required"),
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newSeasonName.trim());
  };

  if (isFeatureFlagLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">{t("common:loading")}...</div>
      </div>
    );
  }

  if (!hasAccess) {
    navigate("/");
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("seasons:seasons")}</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("seasons:add_season")}
        </Button>
      </div>

      {queryLoading ? (
        <div className="text-center py-10">{t("common:loading")}...</div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {t("seasons:no_seasons")}
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="divide-y">
            {seasons.map((season, index) => (
              <div
                key={season._id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveUp(season)}
                    disabled={season.order === 0 || reorderMutation.isPending}
                    className="h-8 w-8"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveDown(season)}
                    disabled={season.order === seasons.length - 1 || reorderMutation.isPending}
                    className="h-8 w-8"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1">
                  {editingId === season._id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="max-w-xs"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-lg font-medium">{season.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId !== season._id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(season)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(season)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("seasons:create_season")}</DialogTitle>
            <DialogDescription>{t("seasons:create_season_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("seasons:season_name")}</Label>
              <Input
                id="name"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSeason();
                }}
                placeholder={t("seasons:season_name_placeholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t("common:cancel")}
            </Button>
            <Button onClick={handleCreateSeason} disabled={createMutation.isPending}>
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("seasons:delete_season")}</DialogTitle>
            <DialogDescription>
              {t("seasons:delete_season_confirmation", { name: seasonToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t("common:cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

