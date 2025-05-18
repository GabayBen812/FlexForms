import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { useToast } from "@/hooks/use-toast";
import { Organization } from "@/types/api/organization";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import OrganizationSettingsOrgSelect from "./OrganizationSettingsOrgSelect";
import OrganizationSettingsForm from "./OrganizationSettingsForm";

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
const organizationFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  logo: z.string().url({ message: "Logo must be a valid URL." }),
  years: z
    .array(z.string().min(1, { message: "Year must not be empty." }))
    .min(1, { message: "At least one year is required." }),
  customStyles: z.any().optional(), // JSON validation can be enhanced as needed
});

function OrganizationSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  //@ts-ignore
  const { organizations } = useContext(OrganizationsContext);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization>(organizations[0]);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: { name: "", logo: "", years: [], customStyles: {} },
  });
  const onSubmit = async (data: OrganizationFormValues) => {
    try {
      // Replace with your API call
      console.log("Submitted data:", data);

      toast({
        title: "Success",
        description: "Organization details have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save organization details.",
        variant: "destructive",
      });
    }
  };
  const handleCancel = () => form.reset();
  return (
    <div className="flex w-full">
      <Card className="border shadow-sm rounded-md w-full">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="py-4 px-0">
            <CardHeader className="py-4 px-0">
              <CardTitle className="font-normal text-xl py-4 px-6">
                {t("settings")} {t("organizations")}
              </CardTitle>
              <Separator />
            </CardHeader>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrganizationSettingsOrgSelect
              selectedOrganization={selectedOrganization}
              setSelectedOrganization={setSelectedOrganization}
            />
            <OrganizationSettingsForm organization={selectedOrganization} />
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
    </div>
  );
}

export default OrganizationSettings;
