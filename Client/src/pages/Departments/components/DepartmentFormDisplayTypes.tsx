import { Button } from "@/components/ui/button";
import { Grid, TableProperties } from "lucide-react";

interface Props {}

function DepartmentFormDisplayTypes() {
  return (
    <div>
      <Button variant={"outline"} className="rounded-l-none">
        <TableProperties />
      </Button>
      <Button variant={"outline"} className="rounded-r-none">
        <Grid />
      </Button>
    </div>
  );
}

export default DepartmentFormDisplayTypes;
