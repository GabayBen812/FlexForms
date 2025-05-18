import { useRef, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { useOrganization } from "@/hooks/useOrganization";
import { handleLogoUpload } from "@/lib/formUtils";
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
  //@ts-ignore
  const { updateOrganization, refetchOrganization } = useOrganization();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!organization) return;

    let logoPath: string | undefined =
      typeof organization.logo === "string" ? organization.logo : undefined;

    if (data.logo && data.logo instanceof File) {
      logoPath = await handleLogoUpload(data.logo, `${organization.id}/logo`);
    }

    // Add this later, something like this:
    // const fullImagePath = `${process.env.NEXT_PUBLIC_CDN_URL}/${logoPath}`;
    const fullImagePath = ""

    const updated = await updateOrganization({
      organizationId: organization.id,
      name: data.name,
      logo: fullImagePath,
      customStyles: {
        ...organization.customStyles,
        accentColor: data.theme,
      },
    });

    if (updated) {
      await refetchOrganization();
      reset({ ...data, logo: undefined });
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex border-b border-border pb-6 items-center gap-4">
        <div className="w-72">
          <h2 className="font-semibold">{t("organization_name")}</h2>
          <p className="text-sm text-secondary">{t("choose_org_name")}</p>
        </div>
        <div className="flex flex-col gap-1 w-full max-w-sm">
          <Input placeholder="ארגון לדוגמה" {...register("name")} />
          {errors.name && (
            <span className="text-sm text-red-500">{errors.name.message}</span>
          )}
        </div>
      </div>

      {/* Theme */}
      <div className="flex border-b border-border pb-4 items-center">
        <div className="w-72">
          <h2 className="font-semibold">{t("theme")}</h2>
          <p className="text-sm text-secondary">{t("select_theme")}</p>
        </div>
        <div className="flex gap-4 items-center">
          {themeColors.map((color) => (
            <div
              key={color}
              onClick={() => setValue("theme", color, { shouldDirty: true })}
              className={`size-8 rounded-lg cursor-pointer border-2 transition-transform transform 
                ${
                  theme === color
                    ? "scale-110 border-primary"
                    : "border-transparent hover:scale-110"
                }`}
              style={{ backgroundColor: resolveTheme(color).accent }}
            />
          ))}
        </div>
      </div>

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
