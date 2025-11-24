import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { useTranslation } from "react-i18next";
import { showError } from "@/utils/swal";
import { coursesApi } from "@/api/courses";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";

export default function CreateCourse() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError(t("required_field"));
      return;
    }

    if (!organization?._id) {
      showError(t("error"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await coursesApi.create({
        name: name.trim(),
        organizationId: organization._id,
      });

      // Check for errors first
      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create course";
        showError(errorMessage);
        return;
      }

      // Check if response is successful
      if ((res.status === 200 || res.status === 201) && res.data && res.data._id) {
        navigate(`/courses/${res.data._id}/manage`);
      } else {
        const errorMessage = res.error || t("error") || "Failed to create course";
        showError(errorMessage);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as any)?.response?.data?.message 
        || (err as any)?.error 
        || t("error") 
        || "An error occurred";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-6">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={t("course_name")}
        className="w-full max-w-2xl text-3xl px-6 py-4"
        autoFocus
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !name.trim()}
        size="lg"
      >
        {isLoading ? t("saving") || "Saving..." : t("save") || "Save"}
      </Button>
    </div>
  );
}

