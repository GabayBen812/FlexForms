import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import apiClient from "@/api/apiClient";
import { useTranslation } from "react-i18next";
import { showError } from "@/utils/swal";

export default function CreateForm() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");
  const [organization_id, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (organization?._id) {
      setOrganizationId(organization._id);
    }
  }, [organization]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError(t("required_field"));
      return;
    }

    if (!organization_id) {
      showError(t("error"));
      return;
    }

    setIsLoading(true);

    const payload = {
      title: title.trim(),
      description: "",
      paymentSum: 0,
      isActive: true,
      organizationId: organization_id,
      seasonId: organization?.currentSeasonId,
      fields: [],
    };

    try {
      const res = await apiClient.post("/forms", payload);
      if (res.status === 200 || res.status === 201) {
        navigate(`/activity/${res.data.code}/edit`);
      } else {
        showError(t("form_created_fail"));
      }
    } catch (err) {
      console.error(err);
      showError(t("error"));
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
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={t("form_title")}
        className="w-full max-w-2xl text-3xl px-6 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim()}
        className="px-12 py-4 text-xl font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? t("saving") || "Saving..." : t("save") || "Save"}
      </button>
    </div>
  );
}
