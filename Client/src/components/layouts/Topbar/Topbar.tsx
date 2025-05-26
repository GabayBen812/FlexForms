import { useOrganization } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { CommandDialogDemo } from "./WebSearch";
import LanguagePicker from "@/components/LanguagePicker";
import { APP_VERSION } from "@/version";

function Topbar() {
  const { organization, isOrganizationFetching } = useOrganization();

  if (!organization || isOrganizationFetching) {
    return null;
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-start gap-2 border-b bg-white absolute w-screen z-50">
      <div className="flex items-center gap-2 px-4 w-full child:w-1/3">
        <div className="flex gap-2 items-center">
          <div className="flex aspect-square size-10 items-center justify-center rounded-md text-sidebar-primary-foreground ">
            <Avatar className="rounded-lg size-10">
              <AvatarImage src={organization?.logo} alt={organization?.name} />
              <AvatarFallback className="rounded-md text-white bg-[var(--datatable-header)]">
                <Hotel className="size-4" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
            <h1
              className="truncate font-bold text-xl"
              style={{ color: "var(--primary)" }}
            >
              {organization?.name}
            </h1>
          </div>
        </div>
        <div className="relative h-20">
          <div className="h-fit justify-center absolute top-5 w-full flex items-center z-50">
            <CommandDialogDemo />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end">
          <span className="text-sm font-semibold">Version: {APP_VERSION}</span>
          <LanguagePicker />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
