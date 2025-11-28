import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import Topbar from "./Topbar/Topbar";
import { NavigationLoader } from "@/components/routes/NavigationLoader";
import { TabsProvider } from "@/contexts/TabsContext";
import { TabsNavigationListener } from "@/components/routes/TabsNavigationListener";
import { Footer } from "./Footer/Footer";

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
            <div className="flex flex-col mt-28 min-h-[calc(100svh-7rem)] overflow-x-hidden">
              <div className="w-full overflow-y-auto overflow-x-hidden p-4 flex-1 min-h-0">
                {children}
              </div>
              <Footer />
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
