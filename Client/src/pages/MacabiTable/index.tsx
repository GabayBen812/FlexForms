import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { MacabiClub } from "@/types/macabiClub/macabiClub";

const usersApi = createApiService<MacabiClub>("/clubs");

export default function clubs() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  const columns: ColumnDef<MacabiClub>[] = [
    { accessorKey: "name", header: t("club_name") },
    { accessorKey: "number", header: t("club_number") },
    { accessorKey: "serviceAgreementDate", header: t("תאריך הסכם שירותים") },
    { accessorKey: "serviceDeclarationDate", header: t("תאריך הצהרה על קבלת שירותים") },
    { accessorKey: "associationEstablished", header: t("הקמת עמותה") },
    { accessorKey: "joinDate", header: t("תאריך הצטרפות למכבי") },
    { accessorKey: "supportDeclaration", header: t("תצהיר לתמיכה ממכבי") },
    { accessorKey: "representative", header: t("נציג גוף") },
    { accessorKey: "supplier", header: t("ספק") },
    { accessorKey: "activeStatus", header: t("פעיל/לא פעיל") },
    { accessorKey: "management2025", header: t("ניהול תקין 2025") },
    { accessorKey: "managementStatus", header: t("סטטוס ניהול תקין") },
    { accessorKey: "israeliPlayerRequest", header: t("הגשת בקשה שחקן ישראלי") },
    { accessorKey: "budget2024", header: t("תקצוב 2024") },
    { accessorKey: "budget2025", header: t("תקצוב 2025") },
    { accessorKey: "manager", header: t("מנהל") },
    { accessorKey: "generalNotes", header: t("הערות כלליות") },
    { accessorKey: "supportRequest", header: t("בקשת תמיכה שוטף") },
    { accessorKey: "declarationK001", header: t("הצהרה בתנאי סף K001") },
    { accessorKey: "advanceK002", header: t("מקדמה K002") },
    { accessorKey: "supportSummaryZ62", header: t("ריכוז תמיכות Z62") },
    { accessorKey: "digitalSupportCommitmentZ61", header: t("התחייבות לקבלת תמיכה Z61 דיגיטלי") },
    { accessorKey: "digitalDeclarationZ60", header: t("הצהרת מוח Z60 דיגיטלי") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];
  const visibleColumns = columns.filter(
    (col) => !(col.meta?.hidden)
  );

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("clubs")}</h1>
      <div className="overflow-x-auto">
      <DataTable<MacabiClub>
        fetchData={(params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return usersApi.fetchAll(params, false, organization._id);
        }}
        columns={visibleColumns}
        searchable
        showAddButton
        isPagination
        defaultPageSize={10}
        idField="_id"
        onRowClick={(user) => {
          
        }}
      />
      </div>
    </div>
  );
}
