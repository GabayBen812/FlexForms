import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { AuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(6, {
      message: "Current password must be at least 6 characters.",
    }),
    newPassword: z.string().min(6, {
      message: "New password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Confirm password must be at least 6 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

function AccountPasswordForm() {
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const { updateUser } = useUser();
  const { t } = useTranslation();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      if (!user) return;
      const { currentPassword, newPassword } = data;
      const response = await updateUser({
        id: user.id,
        password: newPassword,
        oldPassword: currentPassword,
      });
      console.log(response, "response");
      if (response.status !== 200) {
        toast({
          title: "Error",
          description: `${response.error}`,
          variant: "destructive",
        });
        form.setError("currentPassword", { message: response.error });
      } else {
        toast({
          title: t("success"),
          description: "Your password has been updated.",
        });
        form.reset();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to update password. Please try again. \n ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
  };

  return (
    <Card className="border shadow-sm rounded-md w-full max-w-[750px]">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader className="py-4 px-0">
          <CardTitle className="font-normal text-xl py-4 px-6">
            {t("password")}
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-12 gap-6 items-center">
              <label className="col-span-4 rtl:order-2 rtl:text-right">
                {t("current_password")}
              </label>
              <div className="col-span-8">
                <Input {...form.register("currentPassword")} type="password" />
                {form.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-12 gap-6 items-center">
              <label className="col-span-4 rtl:order-2 rtl:text-right">
                {t("new_password")}
              </label>
              <div className="col-span-8">
                <Input {...form.register("newPassword")} type="password" />
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-12 gap-6 items-center">
              <label className="col-span-4 rtl:order-2 rtl:text-right">
                {t("confirm_password")}
              </label>
              <div className="col-span-8">
                <Input {...form.register("confirmPassword")} type="password" />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex ltr:flex-row-reverse rtl:flex-row  w-full gap-4 px-6">
          <Button
            type="submit"
            disabled={!form.formState.isDirty || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!form.formState.isDirty || form.formState.isSubmitting}
          >
            {t("cancel")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default AccountPasswordForm;
