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
import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type AccountFormValues = z.infer<typeof accountFormSchema>;

const accountFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

function AccountInformationFrom() {
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const { updateUser } = useUser();
  const { t } = useTranslation();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) form.reset({ name: user.name, email: user.email });
  }, [user, form]);

  const onSubmit = async (data: AccountFormValues) => {
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

  const handleCancel = () => {
    if (user) form.reset({ name: user.name, email: user.email });
  };
  return (
    <Card className="border shadow-sm rounded-md w-full max-w-[750px]">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader className="py-4 px-0">
          <CardTitle className="font-normal text-xl py-4 px-6">
            {t("account_information")}
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-12 gap-6 items-center">
              <label className="col-span-4 rtl:order-2 rtl:text-right">
                {t("name")}
              </label>
              <div className="col-span-8">
                <Input {...form.register("name")} type="text" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-12 gap-6 items-center">
              <label className="col-span-4 rtl:order-2 rtl:text-right">
                {t("email")}
              </label>
              <div className="col-span-8">
                <Input {...form.register("email")} type="email" />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
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

export default AccountInformationFrom;
