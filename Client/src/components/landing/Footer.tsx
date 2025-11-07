import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black py-12 text-right text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl text-sm leading-relaxed text-white/70">
          {t("landing.footer.tagline")}
        </div>
        <div className="flex flex-col items-end gap-2 text-sm text-white/60">
          <span>{t("landing.footer.contact")}</span>
          <span>{t("landing.footer.support")}</span>
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
        {t("landing.footer.rights", { year })}
      </div>
    </footer>
  );
}
