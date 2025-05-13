import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/Providers/AuthProvider.tsx";
import { OrganizationsProvider } from "./Providers/OrganizationsProvider";
import { Toaster } from "@/components/ui/toaster";
import Router from "@/Router";
import "@/i18n";
import "@/assets/styles/index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OrganizationsProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </OrganizationsProvider>
    </QueryClientProvider>
  </StrictMode>
);
