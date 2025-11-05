import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/Sidebar/Sidebar";
import { GetDirection } from "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import Topbar from "./Topbar/Topbar";
interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col relative">
      <Topbar />
      <SidebarProvider className="flex-row-reverse">
        <SidebarInset>
          <div className="flex flex-col gap-4 mt-16 h-[calc(100svh-theme(spacing.16))]">
            <div className="w-full overflow-y-auto p-4 min-h-full ">
              {children}
            </div>
            {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
          </div>
        </SidebarInset>
        <AppSidebar
          className="h-[calc(100svh-theme(spacing.16))] top-[calc(theme(spacing.16))]"
          side={GetDirection() ? "right" : "left"}
        />
        <Toaster />
      </SidebarProvider>
    </div>
  );
};
