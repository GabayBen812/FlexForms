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
    <Button variant={"accentGhost"} onClick={onToggleAddRow}>
      <PlusCircle />
      {t("add")}
    </Button>
  ) : null;
};
