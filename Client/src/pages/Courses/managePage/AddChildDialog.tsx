import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useOrganization } from "@/hooks/useOrganization";
import { fetchContacts } from "@/api/contacts";
import { createApiService } from "@/api/utils/apiFactory";
import { Kid } from "@/types/kids/kid";
import { Contact } from "@/types/contacts/contact";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { courseEnrollmentsApi } from "@/api/course-enrollments";
import { CourseEnrollment } from "@/types/courses/CourseEnrollment";
import { ProfileAvatar, getProfileImageUrl } from "@/components/ProfileAvatar";

interface AddChildDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (kidId: string) => void;
  courseId: string;
}

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

export function AddChildDialog({ open, onClose, onSelect, courseId }: AddChildDialogProps) {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const { isEnabled: isUnifiedContacts } = useFeatureFlag("FF_CONTACTS_UNIFIED");

  // Fetch enrolled kids to exclude them
  const { data: enrollments = [] } = useQuery<CourseEnrollment[]>({
    queryKey: ["course-enrollments", courseId],
    queryFn: async () => {
      if (!organization?._id) return [];
      const response = await courseEnrollmentsApi.fetchAll(
        { courseId },
        false,
        organization._id
      );
      return (response.data || []) as CourseEnrollment[];
    },
    enabled: !!organization?._id && !!courseId && open,
  });

  const resolveKidId = (kidId: CourseEnrollment["kidId"]) => {
    if (typeof kidId === "string") {
      return kidId;
    }
    return kidId?._id ?? "";
  };

  const enrolledKidIds = useMemo(() => {
    const ids = enrollments
      .map((enrollment) => resolveKidId(enrollment.kidId))
      .filter((id): id is string => Boolean(id));

    return new Set(ids);
  }, [enrollments]);

  // Fetch all kids (no search filter - we'll do client-side filtering)
  const { data: kidsData = [], isLoading: isLoadingKids } = useQuery({
    queryKey: ["kids-search", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];

      if (!isUnifiedContacts) {
        const response = await kidsApi.fetchAll(
          {},
          false,
          organization._id
        );
        return (response.data || []) as Kid[];
      }

      // Use contacts API - fetch more results for better search
      const response = await fetchContacts({
        type: "kid",
        page: 1,
        pageSize: 200,
      });

      if (response.error || !response.data) {
        return [];
      }

      return response.data.data || [];
    },
    enabled: !!organization?._id && open,
  });

  // Filter out already enrolled kids, apply search filter, and map to options
  const kidOptions = useMemo(() => {
    // First filter out enrolled kids
    const filtered = kidsData.filter((kid) => {
      const kidId = (kid as Kid)._id || (kid as Contact)._id;
      return !enrolledKidIds.has(kidId);
    });

    // Then apply search filter using "includes" logic
    const searchFiltered = searchQuery
      ? filtered.filter((kid) => {
          const firstname = (kid as Kid).firstname || (kid as Contact).firstname || "";
          const lastname = (kid as Kid).lastname || (kid as Contact).lastname || "";
          const fullName = `${firstname} ${lastname}`.trim().toLowerCase();
          const idNumber = ((kid as Kid).idNumber || (kid as Contact).idNumber || "").toLowerCase();
          const query = searchQuery.toLowerCase();
          
          return fullName.includes(query) || idNumber.includes(query);
        })
      : filtered;

    // Map to options with all needed data
    return searchFiltered.map((kid) => {
      const kidId = (kid as Kid)._id || (kid as Contact)._id;
      const firstname = (kid as Kid).firstname || (kid as Contact).firstname || "";
      const lastname = (kid as Kid).lastname || (kid as Contact).lastname || "";
      const profileImageUrl = getProfileImageUrl(kid as Kid | Contact);
      const idNumber = (kid as Kid).idNumber || (kid as Contact).idNumber;
      
      return {
        id: kidId || "",
        name: `${firstname} ${lastname}`.trim(),
        firstname,
        lastname,
        profileImageUrl,
        idNumber,
      };
    });
  }, [kidsData, enrolledKidIds, searchQuery]);

  const handleSelect = (kidId: string) => {
    onSelect(kidId);
  };

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("add_child") || "Add Child"}</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border">
          <CommandInput
            placeholder={t("search_child_name") || "Search child name..."}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoadingKids ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t("loading") || "Loading..."}
              </div>
            ) : kidOptions.length === 0 ? (
              <CommandEmpty>
                {searchQuery
                  ? t("no_children_found") || "No children found"
                  : t("start_typing_to_search") || "Start typing to search"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {kidOptions.map((kid) => (
                  <CommandItem
                    key={kid.id}
                    onSelect={() => handleSelect(kid.id)}
                    className="cursor-pointer text-lg py-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <ProfileAvatar
                        name={kid.name}
                        imageUrl={kid.profileImageUrl}
                        size="md"
                      />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="font-medium">{kid.name}</span>
                        {kid.idNumber && (
                          <span className="text-sm text-muted-foreground">
                            {kid.idNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

