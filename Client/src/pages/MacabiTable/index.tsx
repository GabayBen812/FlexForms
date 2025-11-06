import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { MacabiClub } from "@/types/macabiClub/macabiClub";
import { FieldType } from "@/types/ui/data-table-types";
import { useEffect, useMemo, useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { InlineEditPopup } from "@/components/InlineEditPopup";
import { getClubColumns } from "@/components/tables/macabiClubColumns";
import { EditClubDialog } from "@/components/EditClubDialog";
import { AdvancedUpdateDialog } from "@/components/AdvancedUpdateDialog";
import ExcelImporterExporter from "@/components/ui/ExcelImporterExporter";
import CustomClubTable from "@/components/CustomClubTable";
import { StatCard } from "@/components/ui/StatCard"
import { useToast } from "@/hooks/use-toast";
import { CirclePlus, Search, Trash2, TrendingUp } from "lucide-react";

const usersApi = createApiService<MacabiClub>("/clubs");

export default function clubs() {
  const { t } = useTranslation();
   const { toast } = useToast();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { state } = useSidebar();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
    value: any;
    fieldType: FieldType;
    position: { x: number; y: number };
    options?: any;
    rowData: MacabiClub;
    table: any;
  } | null>(null);
  const sidebarIsCollapsed = state === "collapsed";
  const [excelData, setExcelData] = useState<MacabiClub[]>([]);
  const [currentVisibleRows, setCurrentVisibleRows] = useState<any[]>([]);
  const [clubsData, setClubsData] = useState<MacabiClub[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allClubs, setAllClubs] = useState<MacabiClub[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<MacabiClub | null>(null);
  const [isAdvancedUpdateOpen, setIsAdvancedUpdateOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "create">("edit");
  
  
  const handleEditRow = (row: MacabiClub) => {
    setEditingRow(row);
    setIsEditDialogOpen(true);
  };

  const columns = getClubColumns(t, handleEditRow);
  const visibleColumns = columns
    //@ts-ignore
    .filter((col) => !col.meta?.hidden)
    .map((column) => {
      if (column.id === "select" || column.id === "edit") {
        return column;
      }
      return {
        ...column,
        cell: (info: any) => {
          const meta = column.meta;
          const value = info.getValue();

          //@ts-ignore
          if (meta?.editable) {
            return (
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setEditingCell({
                    rowIndex: info.row.index,
                    columnId: info.column.id,
                    value,
                    //@ts-ignore
                    fieldType: meta.fieldType,
                    //@ts-ignore
                    options: meta.options,
                    rowData: info.row.original,
                    table: info.table,
                    position: { x: rect.left + rect.width / 2, y: rect.bottom },
                  });
                }}
              >
                {value?.toString?.() || ""}
              </div>
            );
          }

          return <div className="px-2 py-1">{value?.toString?.() || ""}</div>;
        },
      };
    });

  // useEffects

    useEffect(() => {
    if (!organization?._id) return;

    usersApi.fetchAll({ pageSize: 1000 }, false, organization._id)
    .then((res) => {
      setClubsData(res.data);
      setAllClubs(res.data);
      setCurrentVisibleRows(res.data);
      })
      .catch((err) => {
      console.error("Failed to fetch clubs:", err);
      });
      }, [organization?._id]);

  useEffect(() => {
  if (!searchTerm && Object.keys(advancedFilters).length === 0) {
    setClubsData(allClubs);
  } else {
    const filtered = allClubs.filter((club) => {
      // Simple search by club name
      const matchesSearchTerm = searchTerm
        ? club?.clubName?.toLowerCase()?.includes(searchTerm.toLowerCase())
        : true;

      // Advanced filters
      const matchesAdvancedFilters = Object.entries(advancedFilters).every(
        ([key, value]) => {
          if (!value) return true; // Skip empty filters
          
          const clubValue = club[key as keyof MacabiClub];
          if (clubValue === undefined) return false;
          
          // Handle different data types
          if (typeof clubValue === 'string') {
            return clubValue.toLowerCase().includes(value.toLowerCase());
          } else if (typeof clubValue === 'number') {
            return String(clubValue).includes(value as string);
          }
          return true;
        }
      );

      return matchesSearchTerm && matchesAdvancedFilters;
    });

    setClubsData(filtered);
  }
}, [searchTerm, advancedFilters, allClubs]);


    const table = useReactTable({
      data: clubsData,
      columns: visibleColumns,
      state: {
        rowSelection,
      },
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    });

const activeClubs = useMemo(() => {
  
    return clubsData.filter((club) => club.activeStatus === "פעיל");
  }, [clubsData]);

  const countSupllier = useMemo(() => {
    return activeClubs.filter(
      (club) => club["supportRequest"] === "יש"
    ).length;
  }, [activeClubs]);

  const countSupllierComplete = useMemo(() => {
    return activeClubs.filter(
      (club) => club["supportRequest"] === "הושלם"
    ).length;
  }, [activeClubs]);

  const countRightManagment = useMemo(() => {
    return activeClubs.filter(
      (club) => club["management2025"] === "יש"
    ).length;
  }, [activeClubs]);

  const percent = (count: number) =>
    activeClubs.length > 0 ? Math.round((count / activeClubs.length) * 100) + "%" : "0%";

    const selectedRows = table.getSelectedRowModel().rows;


  const fieldMap: Record<string, string> = {};
  columns.forEach((col) => {
    //@ts-ignore
    const accessor = col.accessorKey;
    const header = col.header?.toString?.();
    if (accessor && header) {
      fieldMap[header] = accessor;
    }
  });

// handle funcions
const handleEditCellSave = async (newValue) => {
  const columnId = editingCell.columnId;
  const rowData = editingCell.rowData;

  const updatedRow = {
    ...rowData,
    [columnId]: newValue,
  };

  try {
    await usersApi.update({
      ...updatedRow,
      id: updatedRow._id,
    });

    setClubsData((prev) =>
      prev.map((row) => (row._id === updatedRow._id ? updatedRow : row))
    );
    toast({
      title: t("changes_updated_successfully"),
      description: t("changes_updated_successfully"),
      duration: 1000,
      variant: "success",
    });
    

  } catch (error) {
    console.error("Failed to update row", error);
  }

  setEditingCell(null);
};

  const handleExcelSave = async (newData: Record<string, any>[]) => {
    for (const newclub of newData) {
      try {
        if (newclub._id) {
          await usersApi.update({ ...newclub, id: newclub._id });
          setClubsData((prev) =>
          prev.map((club) => (club._id === newclub._id ? { ...club, ...newclub } : club))
        );
        } else {
          newclub.organizationId = organization?._id;
        const response = await usersApi.create(newclub);
        const createdClub = response.data; 
        if (createdClub) {
          setClubsData((prev) => [...prev, createdClub]);
        }
       }
      } catch (error) {
        console.error("Failed to import row", newclub, error);
      }
    }
  };

const handleDeleteSelectedRows = async () => {
  const idsToDelete = selectedRows.map((row) => row.original._id);

  try {
    await usersApi.deleteMany(idsToDelete);
    setClubsData((prev) => prev.filter((row) => !idsToDelete.includes(row._id)));
    setRowSelection({});

    toast({
      title: t("rows_deleted_successfully"),
      variant: "success",
      duration: 1000,
    });
  } catch (error) {
    console.error("Failed to delete rows", error);
    toast({
      title: t("error_deleting_rows"),
      variant: "destructive",
    });
  }
};

const handleDialogSave = async (data: MacabiClub) => {
    try {
      if (dialogMode === "edit") {
        // Existing update logic
        await usersApi.update({ ...data, id: data._id });
        setClubsData(prev => prev.map(row => (row._id === data._id ? data : row)));
      } else {
        // New create logic
        data.organizationId = organization?._id;
        const response = await usersApi.create(data);
        const newClub = response.data;
        setClubsData(prev => [...prev, newClub]);
      }
      
      toast({
        title: t(dialogMode === "edit" 
          ? "changes_updated_successfully" 
          : "club_created_successfully"),
        variant: "success",
        duration: 1000,
      });
    } catch (error) {
      console.error("Operation failed", error);
    }
  };

  const handleBulkUpdate = async (field: string, value: any) => {
  const selectedIds = selectedRows.map(row => row.original._id);
  
  try {
    for (const id of selectedIds) {
      await usersApi.update({
        id,
        [field]: value
      });
    }
    setClubsData(prev => 
      prev.map(club => 
        selectedIds.includes(club._id) 
          ? { ...club, [field]: value } 
          : club
      )
    );
    
   toast({
        title: t("changes_updated_successfully"),
        description: t("changes_updated_successfully"),
        duration: 1000,
        variant: "success",
      });
  } catch (error) {
    console.error("Bulk update failed", error);
    toast({
      title: t("update_failed"),
      variant: "destructive",
    });
  }
};

const handleAddClubClick = () => {
    setDialogMode("create");
    setEditingRow({
      activeStatus: "פעיל",
      organizationId: organization?._id,
    } as MacabiClub);
    setIsEditDialogOpen(true);
  };



  return (
    <div className="mx-auto">
      <div className="overflow-x-auto">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <StatCard
            count={countSupllier}
            percent={percent(countSupllier)}
            label="בקשות שהוגשו"
            color="orange"
          />
          <StatCard
            count={countSupllierComplete}
            percent={percent(countSupllierComplete)}
            label="בקשות שהושלמו"
            color="green"
          />
          <StatCard
            count={countRightManagment}
            percent={percent(countRightManagment)}
            label="ניהול תקין 2025"
            color="red"
          />
        </div>
          <div className="bg-white shadow rounded-md px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-3 items-center ">
            <h4 className="flex items-center gap-1">
            {t("total_rows")}: <span>{table.getRowCount()}</span>
           </h4>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search_by_name", "חיפוש לפי שם עמותה")}
              className="border border-gray-300 rounded px-4 py-2 w-full max-w-sm"
            />
          <Button 
            variant="info" 
            onClick={() => setIsAdvancedOpen(true)}
          >
            {t("advanced_search")}
            <Search className="w-4 h-4 mr-2" strokeWidth={2.5}/>
          </Button>
          <Button 
  variant="info"
  onClick={handleAddClubClick}
>
  {t("add_club")}
  <CirclePlus className="w-4 h-4 mr-2" strokeWidth={2.5}/>
</Button>
          <AdvancedSearchModal
            open={isAdvancedOpen}
            onClose={() => setIsAdvancedOpen(false)}
            onApply={(filters) => {
            setAdvancedFilters(filters);
            setIsAdvancedOpen(false);
          }}
          columns={columns}
        />
        <Button 
          variant="destructive"
          onClick={handleDeleteSelectedRows}
          disabled={selectedRows.length === 0}
          className={
            selectedRows.length === 0
              ? "bg-gray-300 text-gray-600 cursor-not-allowed border-gray-300 shadow-none"
              : "bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          }
        >
          {t("delete_selected_rows", "מחק שורות נבחרות")}
          <Trash2 className="w-4 h-4 mr-2" />
        </Button>
        <Button
  variant="outline"
  onClick={() => setIsAdvancedUpdateOpen(true)}
  disabled={selectedRows.length === 0}
  className={
    selectedRows.length === 0
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : "bg-[#2977ff] hover:bg-[#1e5fd1] text-white hover:text-white"
  }
>
  {t("advanced_update")}
  <TrendingUp className="w-4 h-4 mr-2" />
</Button>

          <AdvancedUpdateDialog
            open={isAdvancedUpdateOpen}
            onOpenChange={setIsAdvancedUpdateOpen}
            columns={columns}
            onUpdate={handleBulkUpdate}
            selectedRowCount= {selectedRows.length}
          />
        </div>
        <div className="flex gap-2">
          
        <ExcelImporterExporter
            title={t("import_excel_title", "ייבוא קובץ עמותות")}
            subtitle={t("import_excel_subtitle", "אנא וודא שהעמודות תואמות לשדות" )}
            fields={columns
              .map((col) => ({
                visual_name: col.header?.toString?.() || "",
                technical_name: (col as any).accessorKey || col.id || "",
              }))
              .slice(1, -1)}
            onlyImport={false}
            onlyExport={false}
            excelData={currentVisibleRows}
            onSave={(data) => {
              handleExcelSave(data);
              setExcelData(data);
            }}
          />
          
        </div>
        </div>
        <div
          className="overflow-x-auto w-full"
          style={{
            maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "110px" : "20rem"})`,
          }}
        >
          <div className="max-h-[calc(100vh-15rem)] overflow-auto relative">
          <CustomClubTable
            table={table}
            setEditingCell={setEditingCell}/>
            </div>
          {editingCell && (
            <InlineEditPopup
              value={editingCell.value}
              fieldType={editingCell.fieldType}
              position={editingCell.position}
              options={editingCell.options}
              onClose={() => setEditingCell(null)}
              onSave= {handleEditCellSave}
            />
          )}
          <EditClubDialog
            open={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            rowData={editingRow}
            columns={columns}
            onSave={handleDialogSave}
          />
        </div>
      </div>
    </div>
  );
}
