import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Combobox } from "@/components/ui/combobox";
import { DialogDescription } from "@radix-ui/react-dialog";
import { CirclePlus, Pencil } from "lucide-react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Department } from "@/types/api/departments";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/supabase";
import { DepartmentsDropdown } from "@/components/ui/completed/dropdowns/DepartmentsDropdown";
import { CallCategory } from "@/types/api/calls";

type FormData = z.infer<typeof callSettingsFormSchema>;

export const callSettingsFormSchema = z.object({
  name: z.object({
    he: z.string().min(2, "Hebrew name must be at least 2 characters"),
    en: z
      .string()
      .min(2, "English name must be at least 2 characters")
      .optional(),
  }),
  logo: z.any().optional(),
  organizationId: z.number().optional(),
});

interface Props {
  mode: "add" | "edit";
  callCategory?: CallCategory;
  onSubmitSuccess?: () => void;
}

function CallSettingsForm({ mode, callCategory, onSubmitSuccess }: Props) {
  const { organization, createNewCallCategory, departments } =
    useContext(OrganizationsContext);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "he">("he");
  const languages: { value: "en" | "he"; label: string }[] = [
    { value: "en", label: "English" },
    { value: "he", label: "עברית" },
  ];
  const [selectedDepartment, setSelectedDepartment] = useState<
    Department | undefined
  >(departments[callCategory?.departmentId] || departments?.[0]);

  const form = useForm<FormData>({
    resolver: zodResolver(callSettingsFormSchema),
    defaultValues: {
      name: callCategory?.name || { he: "", en: "" },
      logo: "",
      organizationId: organization?.id,
    },
  });

  const formValues = form.watch();

  const handleFormSubmit = async (data: FormData) => {
    try {
      const uuid = crypto.randomUUID();
      let logoPath = callCategory?.logo;
      if (data.logo && data.logo[0]) {
        const path = `${organization?.id}/calls/categories/${uuid}.png`;
        const ImagePath = await uploadImage(data.logo[0], path);
        if (!ImagePath) return console.log("Failed to upload image");
        logoPath = ImagePath;
      }

      if (mode === "add") {
        await createNewCallCategory({
          name: data.name,
          organizationId: Number(organization?.id),
          logo: logoPath || "",
          departmentId: selectedDepartment?.id || 0,
        });
      } else if (mode === "edit" && callCategory) {
        console.log("Editing department:", {
          ...callCategory,
          ...data,
          logo: logoPath,
        });
      }

      setOpen(false);
      form.reset();
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Error in CallSettingsForm:", error);
    }
  };

  const handleCancel = () => {
    form.reset({
      name: department?.name || { he: "", en: "" },
      logo: "",
      organizationId: organization?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "add" ? (
          <Button
            className="flex items-center ltr:flex-row-reverse rtl:flex-row"
            variant={"outline"}
          >
            <CirclePlus />
            {t("add_x", { x: t("call_type") })}
          </Button>
        ) : (
          <Button tooltip={t("edit_department")} variant={"outline"}>
            <Pencil />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] lg:min-w-[500px]">
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="py-2">
              {mode === "add"
                ? t("add_x", { x: t("call_type") })
                : t("editing_x", { x: t("call_type") })}
            </DialogTitle>
            <DialogDescription>
              {
                mode === "add"
                  ? t("creating_new_x", { x: t("call_type") }) // "יצירת סוג פניה חדש"
                  : t("editing_x", { x: t("call_type") }) // "עריכת סוג פניה"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 flex flex-col gap-2">
            <div className="flex">
              <div className="bg-muted border border-border rtl:border-l-transparent ltr:border-r-transparent flex justify-center items-center px-2">
                {t("language")}
              </div>
              <Combobox<"en" | "he">
                onChange={setSelectedLanguage}
                value={selectedLanguage}
                options={languages}
                label={t("language")}
                className="w-fit p-2 rtl:rounded-r-none ltr:rounded-l-none"
              />
            </div>
            <div>
              <Input
                {...form.register(`name.${selectedLanguage}` as Path<FormData>)}
                value={formValues.name[selectedLanguage] || ""}
                label={
                  <div className="flex gap-1 ltr:flex-row-reverse ltr:justify-end">
                    <span>{t("name")}</span>
                    <span className="">{t("call_type")}</span>
                  </div>
                }
                type="text"
              />
            </div>

            <div className="grid w-full  items-center gap-1.5">
              <Label>
                <div className="flex gap-1 ltr:flex-row-reverse ltr:justify-end">
                  <span className="">{t("department")}</span>
                </div>
              </Label>
              <DepartmentsDropdown
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
              />
            </div>
            <div className="grid w-full  items-center gap-1.5">
              <Label htmlFor="picture">{t("picture")}</Label>
              <Input {...form.register("logo")} id="picture" type="file" />
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button
              type="submit"
              disabled={
                formValues.name.he.length < 2 || form.formState.isSubmitting
              }
              loading={form.formState.isSubmitting}
            >
              {t("save")}
            </Button>
            <Button
              onClick={handleCancel}
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CallSettingsForm;
