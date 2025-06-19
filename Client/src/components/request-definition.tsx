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

  useEffect(() => {
  if (!open) return;

  const fetchDefinitions = async () => {
    const res = await usersApi.fetch(); // קורא ל־/organizations/find
    if (res?.data?.requestDefinitions) {
      const defs = res.data.requestDefinitions;

      const types = Object.entries(defs).map(([id, def]) => ({
        id,
        name: def.type,
      }));
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
      // def.fields כאן הוא אובייקט: שם השדה => { type, choices? }
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
    setFields([...fields, ""]);
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = value;
    setFields(newFields);
  };

  const handleSubmit = () => {
    const data = {
      requestType,
      requestName,
      fields,
    };
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            className="w-full border rounded p-2"
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
  <div key={index} className="flex justify-between items-center gap-4 border rounded p-2">
    <input
      type="text"
      value={field.name}
      onChange={(e) => {
        const newFields = [...fields];
        newFields[index].name = e.target.value;
        setFields(newFields);
      }}
      placeholder={t("field_name", "שם שדה")}
      className="flex-grow border rounded p-2"
    />
    <span className="ml-4 whitespace-nowrap text-gray-600">{field.type}</span>
  </div>
))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddField}
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
