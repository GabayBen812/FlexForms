import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 py-12 text-right text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <h3 className="text-lg font-bold text-white mb-4">
            {t("landing.footer.title")}
          </h3>
          <p className="text-sm leading-relaxed text-gray-400">
            {t("landing.footer.tagline")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-4 md:items-start">
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">
              {t("landing.footer.contactTitle")}
            </h4>
            <p className="text-sm text-gray-400">{t("landing.footer.contact")}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">
              {t("landing.footer.supportTitle")}
            </h4>
            <p className="text-sm text-gray-400">{t("landing.footer.support")}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 md:items-start">
          <Link
            to="/login"
            className="text-sm font-semibold text-white hover:text-peach-400 transition-colors"
          >
            {t("landing.footer.login")}
          </Link>
          <Link
            to="/create-organization"
            className="text-sm font-semibold text-white hover:text-peach-400 transition-colors"
          >
            {t("landing.footer.getStarted")}
          </Link>
        </div>
      </div>
      <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
        {t("landing.footer.rights", { year })}
      </div>
    </footer>
  );
}
