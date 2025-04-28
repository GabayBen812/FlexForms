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
import { CirclePlus, Loader2, Pencil } from "lucide-react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Department } from "@/types/api/departments";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/supabase";

type FormData = z.infer<typeof departmentFormSchema>;

export const departmentFormSchema = z.object({
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
  department?: Department;
  onSubmitSuccess?: () => void;
}

function DepartmentForm({ mode, department, onSubmitSuccess }: Props) {
  const { organization, createNewDepartment } =
    useContext(OrganizationsContext);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "he">("he");
  const languages: { value: "en" | "he"; label: string }[] = [
    { value: "en", label: "English" },
    { value: "he", label: "עברית" },
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: department?.name || { he: "", en: "" },
      logo: "",
      organizationId: organization?.id,
    },
  });

  const formValues = form.watch();

  const handleFormSubmit = async (data: FormData) => {
    try {
      const uuid = crypto.randomUUID();
      let logoPath = department?.logo;
      if (data.logo && data.logo[0]) {
        const path = `${organization?.id}/departments/${uuid}.png`;
        const ImagePath = await uploadImage(data.logo[0], path);
        if (!ImagePath) return console.log("Failed to upload image");
        logoPath = ImagePath;
      }

      if (mode === "add") {
        await createNewDepartment({
          name: data.name,
          organizationId: Number(organization?.id),
          logo: logoPath || "",
        });
      } else if (mode === "edit" && department) {
        console.log("Editing department:", {
          ...department,
          ...data,
          logo: logoPath,
        });
      }

      setOpen(false);
      form.reset();
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Error in DepartmentForm:", error);
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
          <Button className="flex items-center" variant={"outline"}>
            <CirclePlus />
            {t("add_x", { x: t("department") })}
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
              {mode === "add" ? t("add_department") : t("edit_department")}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? t("creating_new_x", { x: t("department") })
                : t("editing_x", { x: t("department") })}
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
                    <span className="">{t("department")}</span>
                  </div>
                }
                type="text"
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
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
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
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

export default DepartmentForm;
