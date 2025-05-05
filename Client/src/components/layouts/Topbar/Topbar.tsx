import { useOrganization } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";

function Topbar() {
  const { organization, isOrganizationFetching } = useOrganization();

  if (!organization || isOrganizationFetching) {
    console.log("organization", organization);
    console.log("isOrganizationFetching", isOrganizationFetching);
    
    
    return null
  };
  
  console.log("ORG:", organization);

  return (
    <header className="...">
      <div className="flex items-center gap-2 px-4 w-full child:w-1/3">
        <div className="flex gap-2 items-center">
          <Avatar className="rounded-lg size-10">
            <AvatarImage src={organization?.logo} alt={organization?.name} />
            <AvatarFallback className="rounded-md text-white bg-[var(--datatable-header)]">
              <Hotel className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-sm leading-tight">
            <h1 className="truncate font-bold text-xl" style={{ color: "var(--primary)" }}>
              {organization?.name || "טוען..."}
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
