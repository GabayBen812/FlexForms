import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { AnalyticsProvider } from "@/app/providers/AnalyticsProvider";
import { OrganizationsProvider } from "@/app/providers/OrganizationsProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import Router from "@/Router";
import "@/i18n";
import "@/assets/styles/index.css";
import "sweetalert2/dist/sweetalert2.min.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <OrganizationsProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <Router />
                <Toaster />
              </AnalyticsProvider>
            </AuthProvider>
          </OrganizationsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
