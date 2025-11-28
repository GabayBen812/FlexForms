import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import Topbar from "./Topbar/Topbar";
import { NavigationLoader } from "@/components/routes/NavigationLoader";
import { TabsProvider } from "@/contexts/TabsContext";
import { TabsNavigationListener } from "@/components/routes/TabsNavigationListener";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <TabsProvider>
      <div className="flex h-screen flex-col relative">
        <Topbar />
        <SidebarProvider className="flex-row-reverse">
          <SidebarInset>
            <div className="flex flex-col gap-4 mt-28 h-[calc(100svh-7rem)]">
              <div className="w-full overflow-y-auto p-4 min-h-full ">
                {children}
              </div>
              {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
            </div>
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
        <NavigationLoader />
        <TabsNavigationListener />
      </div>
    </TabsProvider>
  );
};
