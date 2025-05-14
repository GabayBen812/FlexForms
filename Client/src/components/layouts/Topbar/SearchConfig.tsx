import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export const useSearchConfig = () => {
  const { isEnabled: hasRoomsAccess } = useFeatureFlag("rooms");

  const config = [
    // ... existing items ...
    
    hasRoomsAccess && {
      title: "Rooms",
      href: "/rooms",
      description: "Manage organization rooms",
      icon: "DoorOpen",
    },
    
    // ... existing items ...
  ].filter(Boolean);

  return config;
}; 