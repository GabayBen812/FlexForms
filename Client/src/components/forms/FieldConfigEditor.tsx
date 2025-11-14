import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { FieldConfig } from "./DynamicForm";
import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface Props {
  field: FieldConfig;
  onChange: (updated: FieldConfig) => void;
}

export default function FieldConfigEditor({ field, onChange }: Props) {
  const { t } = useTranslation();
  // Default to textarea for now since CKEditor has initialization issues
  const [useRichEditor, setUseRichEditor] = useState(false);
  const editorKeyRef = useRef(0);
  const [editorError, setEditorError] = useState(false);

  // Force re-render when field changes (only for terms field)
  useEffect(() => {
    if (field.type === "terms") {
      editorKeyRef.current += 1;
      setEditorError(false);
    }
  }, [field.name, field.type]);

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const handleOptionInput = (value: string) => {
    // If the input ends with a comma, create a new option
    if (value.endsWith(",")) {
      const optionLabel = value.slice(0, -1).trim();
      if (optionLabel) {
        const newOption = {
          label: optionLabel,
          value: slugify(optionLabel),
        };
        const newOptions = [...(field.config?.options || []), newOption];
        onChange({
          ...field,
          config: { ...field.config, options: newOptions },
        });
      }
      return ""; // Clear the input after creating an option
    }
    return value;
  };

  const removeOption = (indexToRemove: number) => {
    const newOptions = (field.config?.options || []).filter(
      (_, i) => i !== indexToRemove
    );
    onChange({ ...field, config: { ...field.config, options: newOptions } });
  };

  if (field.type === "select" || field.type === "multiselect") {
    return (
      <div className="mt-2 space-y-2">
        <label className="font-semibold">
          {t("select_options")}:
          {field.type === "multiselect" && (
            <span className="text-sm text-gray-500 ml-2">
              ({t("multiple_selection_enabled")})
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {field.config?.options?.map((opt: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="hover:text-blue-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Input
          placeholder={t("type_and_comma")}
          onChange={(e) => {
            const newValue = handleOptionInput(e.target.value);
            if (newValue !== e.target.value) {
              e.target.value = newValue;
            }
          }}
          className="mt-2"
        />
        <div className="mt-4">
          <label className="font-semibold flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!field.isRequired}
              onChange={(e) =>
                onChange({ ...field, isRequired: e.target.checked })
              }
            />
            {t("required_field")}
          </label>
        </div>
      </div>
    );
  }

  if (field.type === "terms") {
    // Default to textarea - works reliably
    if (!useRichEditor || editorError) {
      return (
        <div className="mt-2 space-y-2 min-h-[200px]">
          <label className="font-semibold">{t("terms_text")}</label>
          <textarea
            value={field.config?.text || ""}
            onChange={(e) => {
              onChange({ ...field, config: { ...field.config, text: e.target.value } });
            }}
            className="w-full min-h-[300px] p-3 border rounded-md resize-y font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder={t("terms_text") || "Enter terms here..."}
            rows={12}
          />
          {!editorError && (
            <button
              type="button"
              onClick={() => setUseRichEditor(true)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
            >
              Use rich text editor (experimental)
            </button>
          )}
          <div className="mt-4">
            <label className="font-semibold flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!field.isRequired}
                onChange={(e) =>
                  onChange({ ...field, isRequired: e.target.checked })
                }
              />
              {t("required_field")}
            </label>
          </div>
        </div>
      );
    }

    // Rich text editor with CKEditor
    return (
      <div className="mt-2 space-y-2 min-h-[200px]">
        <label className="font-semibold">{t("terms_text")}</label>
        <div className="border rounded overflow-hidden" style={{ minHeight: '300px' }}>
          <CKEditor
            key={`terms-${field.name}-${editorKeyRef.current}`}
            editor={ClassicEditor}
            data={field.config?.text || ""}
            onReady={(editor) => {
              console.log('CKEditor is ready', editor);
              setEditorError(false);
            }}
            onChange={(event, editor) => {
              const data = editor.getData();
              onChange({ ...field, config: { ...field.config, text: data } });
            }}
            onError={(error, { willEditorRestart }) => {
              console.error('CKEditor error:', error, willEditorRestart);
              setEditorError(true);
            }}
            config={{
              toolbar: [
                'heading',
                '|',
                'bold',
                'italic',
                'link',
                'bulletedList',
                'numberedList',
                '|',
                'outdent',
                'indent',
                '|',
                'blockQuote',
                'insertTable',
                'undo',
                'redo'
              ],
              placeholder: t("terms_text") || 'Enter terms here...',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setUseRichEditor(false)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
        >
          Switch to simple text editor
        </button>
        <div className="mt-4">
          <label className="font-semibold flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!field.isRequired}
              onChange={(e) =>
                onChange({ ...field, isRequired: e.target.checked })
              }
            />
            {t("required_field")}
          </label>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-2">
        <label className="font-semibold flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!field.isRequired}
            onChange={(e) =>
              onChange({ ...field, isRequired: e.target.checked })
            }
          />
          {t("required_field")}
        </label>
      </div>
    </div>
  );
}
