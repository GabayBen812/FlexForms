import { useTranslation } from "react-i18next";
import { APP_VERSION } from "@/version";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-background w-full overflow-x-hidden shrink-0">
      <div className="w-full max-w-full px-4 py-4">
        <div className="flex flex-row items-center justify-center gap-4 flex-wrap text-sm text-muted-foreground text-center">
          <span>
            © {new Date().getFullYear()} {t("footer.app_name") || "Paradize"}. {t("footer.all_rights_reserved") || "All rights reserved."}
          </span>
          <span className="hidden md:inline">•</span>
          <span>{t("footer.version") || "Version"} {APP_VERSION}</span>
          <span className="hidden md:inline">•</span>
          <a 
            href="mailto:support@paradize.co" 
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            aria-label={t("footer.support") || "Support"}
          >
            <Mail size={16} />
            <span className="hidden sm:inline">{t("footer.support") || "Support"}</span>
          </a>
          <a 
            href="tel:+972729009000" 
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            aria-label={t("footer.contact") || "Contact"}
          >
            <Phone size={16} />
            <span className="hidden sm:inline">{t("footer.contact") || "Contact"}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

