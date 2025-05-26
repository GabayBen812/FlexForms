import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Users, DoorOpen, Settings } from "lucide-react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export default function QuickActions() {
  const navigate = useNavigate();
  const { isEnabled: roomsFF } = useFeatureFlag("ff_is_show_rooms");
  const { isEnabled: paymentsFF } = useFeatureFlag("is_show_payments");
  const { isEnabled: usersFF } = useFeatureFlag("ff_is_show_users");
  const { user } = useContext(AuthContext);
  const canManageUsers = usersFF || user?.role === "admin" || user?.role === "system_admin";

  return (
    <div className="flex flex-wrap gap-3 justify-center my-6">
      {roomsFF && (
        <Button variant="outline" onClick={() => navigate("/rooms/new")}
          className="flex items-center gap-2">
          <DoorOpen className="w-4 h-4" />
          הוסף חדר
        </Button>
      )}
      {canManageUsers && (
        <Button variant="outline" onClick={() => navigate("/users/new")}
          className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          הוסף משתמש
        </Button>
      )}
      <Button variant="outline" onClick={() => navigate("/settings")}
        className="flex items-center gap-2">
        <Settings className="w-4 h-4" />
        הגדרות
      </Button>
    </div>
  );
} 