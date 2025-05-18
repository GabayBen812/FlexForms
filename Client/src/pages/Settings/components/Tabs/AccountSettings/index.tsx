import { useContext, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { updateUser } from "@/api/users";
import { toast } from "@/hooks/use-toast";

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
      logo: typeof user?.logo === "string" ? undefined : user?.logo,
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const logo = watch("logo");

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const onReset = () => {
    reset({
      logo: typeof user?.logo === "string" ? undefined : user?.logo,
      name: user?.name || "",
      email: user?.email || "",
    });
  };

  const onSubmit = async (data: AccountSettingsValues) => {
    try {
      if (!user) return;
      await updateUser({ ...data, id: user.id });
      toast({
        title: t("success"),
        description: "Your account has been updated.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to update account information.",
        variant: "destructive",
      });
    }
  };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex ltr:items-start rtl:items-start flex-col gap-6 w-full"
    >
      <div className="border-b border-border pb-2 w-full">
        <h1 className="text-lg font-semibold text-primary">
          {t("account_information")}
        </h1>
        <p className="text-sm text-secondary">{t("edit_general_settings")}</p>
      </div>
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
                  : typeof user?.logo === "string"
                    ? user.logo
                    : undefined
              }
              alt={user?.name}
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
