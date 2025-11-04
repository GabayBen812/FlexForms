// Router.jsx
import { RouterProvider } from "react-router-dom";
import { router } from "@/utils/routes/router"; // Adjust the path based on your folder structure
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function Router() {
  const { i18n } = useTranslation();

  
  useEffect(() => {
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

  return <RouterProvider router={router} />;
}

export default Router;
