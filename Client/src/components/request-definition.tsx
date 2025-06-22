import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createApiService } from "@/api/utils/apiFactory";
import { Organization } from "@/types/api/organization";

const usersApi = createApiService<Organization>("/organizations");

type RequestDefinitionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
};

type RequestType = {
  id: string;
  name: string;
};

export function RequestDefinitionDialog({ open, onClose, onSave }: RequestDefinitionDialogProps) {
  const { t } = useTranslation();
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [requestDefinitions, setRequestDefinitions] = useState<Record<string, any>>({});
  const [requestType, setRequestType] = useState("");
  const [requestName, setRequestName] = useState("");
  const [fields, setFields] = useState<{ name: string; type: string; choices?: string[] }[]>([]);
  const [rawChoices, setRawChoices] = useState<string[]>([]);

  useEffect(() => {
  if (!open) return;

  const fetchDefinitions = async () => {
    const res = await usersApi.fetch(); 
    if (res?.data?.requestDefinitions) {
      const defs = res.data.requestDefinitions;

     const types = Object.entries(defs)
  .map(([id, def]) => ({
    id,
    name: def.type,
  }))
  .filter((t) => t.name && t.name.trim() !== "");
    console.log("Request types fetched:", types);
      setRequestTypes(types);
      setRequestDefinitions(defs);
    }
  };
  console.log("Request types fetcheddd:", requestTypes);

  fetchDefinitions();
  
}, [open]);

useEffect(() => {
    if (!requestType) {
      setFields([]);
      return;
    }

    const def = requestDefinitions[requestType];
    if (def && def.fields) {
      const newFields = Object.entries(def.fields).map(([fieldName, fieldDef]: [string, any]) => ({
        name: fieldName,
        type: fieldDef.type,
        choices: fieldDef.choices,
      }));
      setFields(newFields);
    } else {
      setFields([]);
    }
  }, [requestType, requestDefinitions]);

  const handleAddField = () => {
  if (!requestType) return; // הגנה
  setFields([...fields, { name: "", type: "FIELD_TEXT" }]);
};


  const handleSubmit = () => {
    const data = {
      requestName,
      requestType,
      fields,
    };
  console.log("Submitting request definition:", data);
    onSave(data);
    resetForm();
    onClose();
  };

  const resetForm = () => {
  setRequestType("");
  setRequestName("");
  setFields([]);
};

  return (
   <Dialog open={open} onOpenChange={(value) => {
        if (!value) {
          resetForm(); 
          onClose(); 
        }
      }}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {t("define_requests", "הגדר בקשות")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full border rounded px-3 py-3 text-base"
          >
            <option value="">{t("select_request_type", "בחר סוג בקשה")}</option>
            {requestTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          {fields.length === 0 && (
          <input
            type="text"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            placeholder={t("request_name", "שם בקשה")}
            className="w-full border rounded p-3 bg-gray-100"
          />
          )}

{fields.map((field, index) => (
  <div key={index} className="flex flex-col gap-2 border rounded p-2">
    <div className="flex items-center gap-4">
      <input
        type="text"
        value={field.name}
        onChange={(e) => {
          const newFields = [...fields];
          newFields[index].name = e.target.value;
          setFields(newFields);
        }}
        placeholder={t("field_name", "שם שדה")}
        className="flex-1 border rounded p-2"
      />
      <select
        value={field.type}
        onChange={(e) => {
          const newFields = [...fields];
          newFields[index].type = e.target.value;
          if (e.target.value === "FIELD_SELECT" && !newFields[index].choices) {
            newFields[index].choices = [];
          }
          if (e.target.value !== "FIELD_SELECT") {
            delete newFields[index].choices;
          }
          setFields(newFields);
        }}
        className="w-40 border rounded p-2"
      >
        <option value="FIELD_TEXT">טקסט</option>
        <option value="FIELD_NUMBER">מספר</option>
        <option value="FIELD_DATE">תאריך</option>
        <option value="FIELD_SELECT">בחירה</option>
      </select>
    </div>

    {field.type === "FIELD_SELECT" && (
      <textarea
  value={rawChoices[index] ?? field.choices?.join("\n") ?? ""}
  onChange={(e) => {
    const newRaw = [...rawChoices];
    newRaw[index] = e.target.value;
    setRawChoices(newRaw);

    const newFields = [...fields];
    newFields[index].choices = e.target.value
      .split("\n")
      .map((opt) => opt.trim())
      .filter(Boolean); 
    setFields(newFields);
  }}
  placeholder={t("field_choices_placeholder", "כתוב אופציה חדשה בכל שורה")}
  className="border rounded p-2 w-full resize-y"
  rows={3}
/>
    )}
  </div>
))}

         <Button
            type="button"
            variant="outline"
            onClick={handleAddField}
            disabled={!requestType}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            {t("add_field", "הוסף שדה לבקשה")}
          </Button>
        </div>

        <DialogFooter className="mt-6 flex justify-center">
          <Button onClick={handleSubmit} className="flex gap-2">
            <Save className="w-4 h-4" />
            {t("save", "שמור")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
