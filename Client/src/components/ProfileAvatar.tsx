import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultAvatar from "@/assets/landing/defaultAvatar.png";
import { cn } from "@/lib/utils";

const PROFILE_IMAGE_KEYS = [
  "profileImage",
  "profileImageUrl",
  "profilePicture",
  "profilePictureUrl",
  "avatar",
  "avatarUrl",
  "photo",
  "photoUrl",
  "image",
  "imageUrl",
];

const sizeClasses: Record<ProfileAvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

type ProfileAvatarSize = "sm" | "md" | "lg";

export interface ProfileAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: ProfileAvatarSize;
  className?: string;
}

export const ProfileAvatar = ({
  name,
  imageUrl,
  size = "md",
  className,
}: ProfileAvatarProps) => {
  const initials = getInitials(name);
  const resolvedSrc = imageUrl && imageUrl.trim().length > 0 ? imageUrl : defaultAvatar;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={resolvedSrc} alt={name || "Profile picture"} />
      <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export const getProfileImageUrl = (
  record?: { dynamicFields?: Record<string, unknown> } | null,
): string | undefined => {
  if (!record) {
    return undefined;
  }

  const candidateRecord = record as Record<string, unknown>;
  const dynamicFields = record.dynamicFields && typeof record.dynamicFields === "object"
    ? (record.dynamicFields as Record<string, unknown>)
    : undefined;

  for (const key of getCandidateKeys()) {
    const value = candidateRecord[key];
    const resolved = normalizeValue(value);
    if (resolved) {
      return resolved;
    }
  }

  if (dynamicFields) {
    for (const key of getCandidateKeys()) {
      const value = dynamicFields[key];
      const resolved = normalizeValue(value);
      if (resolved) {
        return resolved;
      }
    }

    for (const value of Object.values(dynamicFields)) {
      const resolved = normalizeValue(value);
      if (resolved) {
        return resolved;
      }
    }
  }

  return undefined;
};

const getCandidateKeys = (): string[] => {
  const lower = PROFILE_IMAGE_KEYS.map((key) => key.toLowerCase());
  const snake = PROFILE_IMAGE_KEYS.map((key) => toSnakeCase(key));
  const kebab = PROFILE_IMAGE_KEYS.map((key) => toKebabCase(key));
  return Array.from(new Set([...PROFILE_IMAGE_KEYS, ...lower, ...snake, ...kebab]));
};

const normalizeValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "url" in value &&
    typeof (value as Record<string, unknown>).url === "string"
  ) {
    const candidate = (value as Record<string, unknown>).url as string;
    return candidate.trim().length > 0 ? candidate : undefined;
  }

  return undefined;
};

const getInitials = (name?: string | null): string => {
  if (!name) {
    return "??";
  }

  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "??";
  }

  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`;

  return initials.toUpperCase();
};

const toSnakeCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

const toKebabCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();



