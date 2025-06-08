import { ColumnDef } from "@tanstack/react-table";
import { MacabiClub } from "@/types/macabiClub/macabiClub";
import { selectionColumn } from "./selectionColumns"; 
import { FieldType } from "@/types/ui/data-table-types";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function getClubColumns(t: (key: string) => string
,
  onEdit: (row: MacabiClub) => void
): ColumnDef<MacabiClub>[] {
  return [ 
  selectionColumn,
  
    {
      id: "edit",
      header: "#", 
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          title={t("edit_club")}
        >
          <Pencil  className="w-4 h-4" />
        </Button>
      ),
      size: 70,
      meta: { className: "text-center", editable: false },
    },

    {
      accessorKey: "clubName",
      header: t("club_name"),
      size: 200,
      meta: { 
        className: 'w-[140px] max-w-[140px] break-words whitespace-normal',
        fieldType: "TEXT",
        editable: false },
    },
    {
      accessorKey: "clubNumber",
      header: t("club_number"),
      size: 150,
      meta: { fieldType: "TEXT", editable: false },
    },
    {
      accessorKey: "serviceAgreementDate",
      header: t("תאריך הסכם שירותים"),
      
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "serviceDeclarationDate",
      header: t("תאריך הצהרה על קבלת שירותים"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "clubEstablished",
      header: t("הקמת עמותה"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "joinDate",
      header: t("תאריך הצטרפות למכבי"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "supportDeclaration",
      header: t("תצהיר לתמיכה ממכבי"),
      meta: { fieldType: "SELECT", editable: true ,
      options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
        }
    },
    {
      accessorKey: "representative",
      header: t("נציג גוף"),
      meta: { fieldType: "SELECT", editable: true,
      options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
       },
    },
    {
      accessorKey: "supplier",
      header: t("ספק"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
       },
    },
    {
      accessorKey: "activeStatus",
      header: t("פעיל/לא פעיל"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
      { label: t("פעיל"), value: "פעיל" },
      { label: t("לא פעיל"), value: "לא פעיל" },],
        },
    },
    {
      accessorKey: "management2025",
      header: t("ניהול תקין 2025"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
       },
    },
    {
      accessorKey: "managementStatus",
      header: t("סטטוס ניהול תקין"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "israeliPlayerRequest",
      header: t("הגשת בקשה שחקן ישראלי"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "budget2024",
      header: t("תקצוב 2024"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "budget2025",
      header: t("תקצוב 2025"),
      meta: { fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "manager",
      header: t("מנהל"),
      meta: { fieldType: "SELECT", editable: true, 
        options: [
        { label: "לירון", value: "לירון" },
        { label: "אורית", value: "אורית" },
        { label: "אור", value: "אור" },
        { label: "לירון/אורית", value: "לירון/אורית" },
        { label: "לירון/אור", value: "לירון/אור" },
        { label: "אור/אורית", value: "אור/אורית" },
        { label: "לירון/אור/אורית", value: "לירון/אור/אורית" },],
       },
    },
    {
      accessorKey: "generalNotes",
      header: t("הערות כלליות"),
      
      meta: { 
        className: 'w-[140px] max-w-[140px] break-words whitespace-normal',
        fieldType: "TEXT", editable: true },
    },
    {
      accessorKey: "supportRequest",
      header: t("בקשת תמיכה שוטף"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
        { label: "יש", value: "יש" },
        { label: "אין", value: "אין" },
        { label: "לא זכאי", value: "לא זכאי" },
        { label: "הושלם", value: "הושלם" },
        { label: "ממתין לחתימות", value: "ממתין לחתימות" }],
       },
    },
    {
      accessorKey: "declarationK001",
      header: t("הצהרה בתנאי סף K001"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
       },
    },
    {
      accessorKey: "advanceK002",
      header: t("מקדמה K002"),
      meta: { fieldType: "SELECT", editable: true ,
        options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
      },
    },
    {
      accessorKey: "supportSummaryZ62",
      header: t("ריכוז תמיכות Z62"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },],
       },
    },
    {
      accessorKey: "digitalSupportCommitmentZ61",
      header: t("התחייבות לקבלת תמיכה Z61 דיגיטלי"),
      meta: { fieldType: "SELECT", editable: true,
        options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },
      { label: t("ממתין לחתימות"), value: "ממתין לחתימות" },],
       },
    },
    {
      accessorKey: "digitalDeclarationZ60",
      header: t("הצהרת מוח Z60 דיגיטלי"),
      meta: { fieldType: "SELECT", editable: true,
         options: [
      { label: t("יש"), value: "יש" },
      { label: t("אין"), value: "אין" },
      { label: t("ממתין לחתימות"), value: "ממתין לחתימות" },],
       },
    },
    {
      accessorKey: "organizationId",
      header: "",
      meta: { hidden: true },
    },
  ];
}
