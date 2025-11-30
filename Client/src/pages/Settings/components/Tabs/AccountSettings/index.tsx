import { useContext, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { updateOrganization } from "@/api/organizations";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/imageUtils";

const AccountSettingsSchema = z.object({
  logo: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "Max file size is 5MB.",
    }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type AccountSettingsValues = z.infer<typeof AccountSettingsSchema>;

function AccountSettings() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useContext(AuthContext);
  const { organization } = useContext(OrganizationsContext);
  const queryClient = useQueryClient();

  const {
    register,
    setValue,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AccountSettingsValues>({
    resolver: zodResolver(AccountSettingsSchema),
    defaultValues: {
      logo: typeof organization?.logo === "string" ? undefined : organization?.logo,
      name: organization?.name || "",
      email: user?.email || "",
    },
  });

  const logo = watch("logo");

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const onReset = () => {
    reset({
      logo: typeof organization?.logo === "string" ? undefined : organization?.logo,
      name: organization?.name || "",
      email: user?.email || "",
    });
  };

  const onSubmit = async (data: AccountSettingsValues) => {
    try {
      if (!organization?._id || !user?.organizationId) {
        toast({
          title: "Error",
          description: "Organization or user information is missing.",
          variant: "destructive",
        });
        return;
      }

      // Upload logo to Supabase if it's a File object
      let logoUrl = organization.logo;
      if (data.logo instanceof File) {
        try {
          console.log("✅ NEW CODE VERSION - Using uploadFile directly");
          const timestamp = Date.now();
          const uuid = crypto.randomUUID();
          const filename = data.logo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          // Use the same pattern as kids profile images
          const path = `uploads/organizations/profile-images/${timestamp}_${uuid}_${filename}`;
          console.log("✅ Uploading logo to path:", path);
          logoUrl = await uploadFile(data.logo, path);
          console.log("✅ Logo uploaded successfully, URL:", logoUrl);
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

      // Update organization with the logo URL (not the File object)
      console.log("Updating organization with:", { name: data.name, logo: logoUrl });
      const updateResult = await updateOrganization(organization._id, { 
        name: data.name,
        logo: logoUrl 
      });

      if (updateResult.status !== 200) {
        throw new Error("Failed to update organization");
      }

      // Invalidate and refetch organization data to update the UI
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
      await queryClient.refetchQueries({ queryKey: ["organization"] });

      // Reset form to new values to mark as not dirty
      reset({
        logo: undefined,
        name: data.name,
        email: data.email,
      });

      toast({
        title: t("success"),
        description: "Organization settings have been updated.",
      });
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
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex ltr:items-start rtl:items-start flex-col gap-6 w-full"
    >
      {/* <div className="border-b border-border pb-2 w-full">
        <h1 className="text-lg font-semibold text-primary">
          {t("account_information")}
        </h1>
        <p className="text-sm text-secondary">{t("edit_general_settings")}</p>
      </div> */}
      <div className="flex border-b border-border pb-6 items-center gap-6 w-full">
        <div className="w-72">
          <h2 className="font-semibold text-lg">{t("picture")}</h2>
          <p className="text-sm text-secondary">{t("update_org_picture")}</p>
          {errors.logo && (
            <p className="text-sm text-red-500 mt-2">{errors.logo.message}</p>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <Avatar
            className="rounded-2xl size-16 cursor-pointer transition-transform transform hover:scale-110"
            onClick={triggerFileInput}
          >
            <AvatarImage
              src={
                logo instanceof File
                  ? URL.createObjectURL(logo)
                  : typeof organization?.logo === "string"
                    ? organization.logo
                    : undefined
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
                setValue("logo", file, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
          />
        </div>
      </div>
      <div className="flex border-b border-border pb-6 items-center gap-4 w-full">
        <div className="w-72">
          <h2 className="font-semibold">{t("name")}</h2>
          <p className="text-sm text-secondary">{t("choose_org_name")}</p>
        </div>
        <div className="flex flex-col gap-1 w-full max-w-sm">
          <Input placeholder={t("name")} {...register("name")} />
          {errors.name && (
            <span className="text-sm text-red-500">{errors.name.message}</span>
          )}
        </div>
      </div>
      <div className="flex border-b border-border pb-6 items-center gap-4 w-full">
        <div className="w-72">
          <h2 className="font-semibold">{t("email")}</h2>
          <p className="text-sm text-secondary">{t("choose_org_name")}</p>
        </div>
        <div className="flex flex-col gap-1 w-full max-w-sm">
          <Input disabled placeholder={t("email")} {...register("email")} />
          {errors.name && (
            <span className="text-sm text-red-500">{errors.name.message}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end w-full">
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

export default AccountSettings;
