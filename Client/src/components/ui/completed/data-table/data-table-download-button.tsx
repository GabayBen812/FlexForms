import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { withFeatureFlag } from "@/components/withFeatureFlag";
import { useContext } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { Organization } from "@/types/api/organization";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface DataTableDownloadButtonProps<TData> {
  table: Table<TData>;
}

type OrganizationWithFlags = Organization & { featureFlagIds?: string[] };


function DataTableDownloadButtonBase<TData>({
  table,
}: DataTableDownloadButtonProps<TData>) {
  const { organization } = useContext(OrganizationsContext) as { organization?: OrganizationWithFlags };
  
  console.log("organization", organization);
  
  const { isEnabled, isLoading } = useFeatureFlag("ff_is_show_download_csv");

  console.log("isEnabled", isEnabled);
  console.log("isLoading", isLoading);
  

  if (isLoading || !isEnabled) return null;

  const handleDownload = () => {
    const headers = table.getAllColumns()
      .filter(column => column.getCanHide() && column.getIsVisible())
      .map(column => column.columnDef.header as string);

    const rows = table.getRowModel().rows.map(row => {
      return row.getAllCells()
        .filter(cell => cell.column.getCanHide() && cell.column.getIsVisible())
        .map(cell => {
          const value = cell.getValue();
          // Handle special cases like dates, objects, etc.
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return value?.toString() ?? '';
        });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="default"
      size="icon"
      className="h-9 w-9 bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200 border border-green-400/20 backdrop-blur-sm rounded-lg"
      onClick={handleDownload}
      title="Download CSV"
    >
      <FileDown className="h-4 w-4 text-white" strokeWidth={2.5} />
    </Button>
  );
}

export const DataTableDownloadButton = withFeatureFlag(DataTableDownloadButtonBase, {
  featureFlag: 'ff_is_show_download_csv',
  fallback: null
}); 