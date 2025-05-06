import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useOrganization } from "@/hooks/useOrganization";
import { useEffect } from "react";
import apiClient from "@/api/apiClient";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { t } from "i18next";
import { z } from "zod";
import { array } from "zod";


function CreateForm() {
 const { organization, isOrganizationFetching } = useOrganization();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState<string>();
  const [fields, setFields] = useState([{ label: "", type: "text" }]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (organization?._id) {
      setOrganizationId(organization._id);
    }
    console.log("Organization data:", organization);
  }, [organization]);;

  const handleSubmit = async (data: any) => {
    
    console.log("data from form:", data);
    console.log("organizationId:", organizationId);
    console.log("organizationName:", organization?.name);
    if (!data.title || !organizationId) {
      alert(" חובה למלא את שם הארגון!");
      return;
    }

    const formPayload = {
      ...data,
      organizationId,
      isActive,
    };

    try {
        
        const response = await apiClient.post("/forms", formPayload);
  
        if (response.status === 200 || response.status === 201) {
          alert("הטופס נוצר בהצלחה!");
        } else {
          alert("אירעה שגיאה ביצירת הטופס");
        }
     
    } catch (error) {
      console.error("שגיאה:", error);
      alert("אירעה שגיאה, נסה שוב מאוחר יותר");
    }
  };
  const FormFields: FieldConfig[] = [
      { name: "title", label: t("form_title"), type: "text" },
      { name: "description", label: t("form_description")+(" (אופציונלי)"), type: "text" },
      { name: "fields", label: t("form_fields"), type: "array" }
    ];
    const formSchema = z.object({
        title: z.string().min(1),
        description: z.string(),
        });
        
  
  return (
    <div>
      
      <DynamicForm
            mode="create"
            headerKey="form"
            fields={FormFields}
            validationSchema={formSchema}
            onSubmit= {handleSubmit}
          />
    </div>
  );
};

export default CreateForm;
