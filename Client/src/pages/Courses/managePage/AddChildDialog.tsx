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

  // Fetch kids
  const { data: kidsData = [], isLoading: isLoadingKids } = useQuery({
    queryKey: ["kids-search", organization?._id, searchQuery],
    queryFn: async () => {
      if (!organization?._id) return [];

      if (!isUnifiedContacts) {
        const response = await kidsApi.fetchAll(
          searchQuery
            ? {
                firstname: searchQuery,
                lastname: searchQuery,
              }
            : {},
          false,
          organization._id
        );
        return (response.data || []) as Kid[];
      }

      // Use contacts API
      const response = await fetchContacts({
        type: "kid",
        ...(searchQuery
          ? {
              firstname: searchQuery,
              lastname: searchQuery,
            }
          : {}),
        page: 1,
        pageSize: 50,
      });

      if (response.error || !response.data) {
        return [];
      }

      return response.data.data || [];
    },
    enabled: !!organization?._id && open,
  });

  // Filter out already enrolled kids and map to options
  const kidOptions = useMemo(() => {
    const filtered = kidsData.filter((kid) => {
      const kidId = (kid as Kid)._id || (kid as Contact)._id;
      return !enrolledKidIds.has(kidId);
    });

    return filtered.map((kid) => {
      const kidId = (kid as Kid)._id || (kid as Contact)._id;
      const firstname = (kid as Kid).firstname || (kid as Contact).firstname;
      const lastname = (kid as Kid).lastname || (kid as Contact).lastname;
      return {
        id: kidId || "",
        name: `${firstname} ${lastname}`,
        firstname,
        lastname,
      };
    });
  }, [kidsData, enrolledKidIds]);

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
                    className="cursor-pointer"
                  >
                    {kid.name}
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

