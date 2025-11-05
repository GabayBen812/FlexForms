import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { OrganizationsProvider } from "@/app/providers/OrganizationsProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import Router from "@/Router";
import "@/i18n";
import "@/assets/styles/index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OrganizationsProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </OrganizationsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
