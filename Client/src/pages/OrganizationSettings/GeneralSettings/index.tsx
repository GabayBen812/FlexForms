import { useRef, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Hotel, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useOrganization } from "@/hooks/useOrganization";
import { uploadFile } from "@/lib/imageUtils";
import { updateOrganization } from "@/api/organizations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { resolveTheme } from "@/lib/themeUtils";

const themeColors = ["blue", "dark", "green", "red", "gray"] as const;

const schema = z.object({
  name: z.string().min(1, "שדה חובה"),
  logo: z.any().optional(),
  theme: z.enum(themeColors),
});

type FormValues = z.infer<typeof schema>;

export default function GeneralSettings() {
  const { organization } = useContext(OrganizationsContext);
  const { resolvedTheme, setTheme } = useContext(ThemeContext);
  const { refetchOrganization } = useOrganization();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization?.name || "",
      logo: undefined,
      theme:
        (organization?.customStyles?.accentColor as FormValues["theme"]) ||
        "blue",
    },
  });

  const logoPreview = watch("logo");
  const theme = watch("theme");

  useEffect(() => {
    const accentColor = organization?.customStyles?.accentColor;
    const resolvedColor = resolveTheme(accentColor).accent;
    const resolvedTablesColor = resolveTheme(accentColor).datatableHeader;
    const resolveColorPrimary = resolveTheme(accentColor).primary;
    const resolvedBackgroundColor = resolveTheme(accentColor).background;
    const resolvedTabsBg = resolveTheme(accentColor).tabsBg;
    document.documentElement.style.setProperty("--accent", resolvedColor);
    document.documentElement.style.setProperty(
      "--sidebar-accent",
      resolvedColor
    );
    document.documentElement.style.setProperty(
      "--datatable-header",
      resolvedTablesColor
    );
    document.documentElement.style.setProperty(
      "--primary",
      resolveColorPrimary
    );
    document.documentElement.style.setProperty(
      "--background",
      resolvedBackgroundColor
    );
    document.documentElement.style.setProperty("--border", resolvedTabsBg);
  }, [organization]);

  const onSubmit = async (data: FormValues) => {
    if (!organization?._id) {
      toast({
        title: "Error",
        description: "Organization information is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload logo to Supabase if it's a File object
      let logoUrl = typeof organization.logo === "string" ? organization.logo : undefined;

      if (data.logo && data.logo instanceof File) {
        try {
          const timestamp = Date.now();
          const uuid = crypto.randomUUID();
          const filename = data.logo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          // Use the same pattern as kids profile images
          const path = `uploads/organizations/profile-images/${timestamp}_${uuid}_${filename}`;
          console.log("Uploading logo to path:", path);
          logoUrl = await uploadFile(data.logo, path);
          console.log("Logo uploaded successfully, URL:", logoUrl);
        } catch (uploadError) {
          console.error("Error uploading logo:", uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload logo. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Update organization with the logo URL
      const updateResult = await updateOrganization(organization._id, {
        name: data.name,
        logo: logoUrl,
        customStyles: {
          ...organization.customStyles,
          accentColor: data.theme,
        },
      });

      if (updateResult.status === 200) {
        // Invalidate and refetch organization data to update the UI
        await queryClient.invalidateQueries({ queryKey: ["organization"] });
        await refetchOrganization();
        reset({ ...data, logo: undefined });
        
        toast({
          title: t("success"),
          description: "Organization settings have been updated.",
        });
      } else {
        throw new Error("Failed to update organization");
      }
    } catch (error: unknown) {
      console.error("Error updating organization:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to update organization settings: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const onReset = () => {
    reset({
      name: organization?.name || "",
      theme:
        (organization?.customStyles?.accentColor as FormValues["theme"]) ||
        "blue",
      logo: undefined,
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isDarkMode = resolvedTheme === "dark";

  const handleDarkModeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Name */}

      {/* Image */}
      <div className="flex border-b border-border pb-4 items-center gap-4">
        <div className="w-72">
          <h2 className="font-semibold">{t("picture")}</h2>
          <p className="text-sm text-secondary">{t("update_org_picture")}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Avatar
            className="rounded-2xl size-16 cursor-pointer transition-transform transform hover:scale-110"
            onClick={triggerFileInput}
          >
            <AvatarImage
              src={
                logoPreview instanceof File
                  ? URL.createObjectURL(logoPreview)
                  : organization?.logo
              }
              alt={organization?.name}
            />
            <AvatarFallback className="flex justify-center items-center rounded-2xl text-white bg-[var(--datatable-header)] size-16">
              <Hotel className="size-10" />
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue("logo", file, { shouldDirty: true });
              }
            }}
          />
        </div>
      </div>

      {/* Dark Mode */}
      <div className="flex border-b border-border pb-4 items-center gap-4">
        <div className="w-72">
          <h2 className="font-semibold">{t("dark_mode")}</h2>
          <p className="text-sm text-secondary">{t("toggle_dark_mode")}</p>
        </div>
        <div className="flex gap-4 items-center">
          {isDarkMode ? (
            <Moon className="size-5 text-primary" />
          ) : (
            <Sun className="size-5 text-primary" />
          )}
          <Switch checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          disabled={!isDirty}
          onClick={onReset}
          type="button"
        >
          {t("reset")}
        </Button>
        <Button loading={isSubmitting} disabled={!isDirty} type="submit">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
