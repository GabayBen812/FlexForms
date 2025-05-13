// components/data-table/data-table-add-button.tsx
import { LucidePlusCircle, PlusCircle, PlusCircleIcon } from "lucide-react";
import { Button } from "../../button";
import { useTranslation } from "react-i18next";

interface DataTableAddButtonProps {
  onToggleAddRow: () => void;
  showAddButton?: boolean;
}

export const DataTableAddButton = ({
  onToggleAddRow,
  showAddButton,
}: DataTableAddButtonProps) => {
  const { t } = useTranslation();
  return showAddButton ? (
    <div className="flex justify-center mt-4">
    <Button
     variant={"accentGhost"} 
     onClick={onToggleAddRow}
     className="text-xl px-10 py-6 gap-3"
     >
      <PlusCircle />
      {t("add")}
    </Button>
    </div>
  ) : null;
};
