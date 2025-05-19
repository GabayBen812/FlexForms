import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/ui/completed/data-table';
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { columns } from "./rooms/columns";
import { CreateRoomDialog } from "./rooms/CreateRoomDialog";
import { EditRoomDialog } from "./rooms/EditRoomDialog";
import { DeleteRoomDialog } from "./rooms/DeleteRoomDialog";

export default function Rooms() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { isEnabled: hasAccess } = useFeatureFlag("ff_is_show_rooms");

  const { data: rooms = [], isLoading: queryLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await apiClient.get("/rooms");
      return response.data;
    },
    enabled: !!hasAccess,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: t("success"),
        description: t("roomDeleted"),
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!hasAccess) {
    navigate("/");
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("rooms")}</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add_room")}
        </Button>
      </div>

      <DataTable
        columns={columns({
          onEdit: (room) => {
            setSelectedRoom(room);
            setIsEditDialogOpen(true);
          },
          onDelete: (room) => {
            setSelectedRoom(room);
            setIsDeleteDialogOpen(true);
          },
        })}
        data={rooms}
        isLoading={queryLoading}
      />

      <CreateRoomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedRoom && (
        <>
          <EditRoomDialog
            room={selectedRoom}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
          <DeleteRoomDialog
            room={selectedRoom}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={() => deleteMutation.mutate(selectedRoom._id)}
          />
        </>
      )}
    </div>
  );
} 