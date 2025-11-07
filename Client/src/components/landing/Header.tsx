import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const gradientClasses =
  "absolute inset-0 opacity-90 bg-gradient-to-r from-pink-400 via-orange-300 to-teal-300 blur-3xl";

export default function Header() {
  const { t } = useTranslation();
  const logoSrc = "/paradize-logo.svg";

  const navItems = [
    { key: "product", href: "#product" },
    { key: "industries", href: "#industries" },
    { key: "workflow", href: "#workflow" },
    { key: "automation", href: "#automation" },
    { key: "partners", href: "#partners" },
    { key: "support", href: "#support" },
  ];

  return (
    <motion.header
      className="fixed top-0 w-full z-40"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 mt-4">
        <div className="relative overflow-hidden rounded-full border border-white/20 bg-black/70 backdrop-blur-xl">
          <span className={gradientClasses} aria-hidden="true" />
          <div className="relative flex items-center justify-between px-6 py-3 lg:px-8">
            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/" className="relative inline-flex items-center">
                <img
                  src={logoSrc}
                  className="h-9 w-9 rounded-full shadow-[0_6px_18px_rgba(255,255,255,0.35)] ring-1 ring-white/50"
                  alt="Paradize Logo"
                />
              </Link>
            </div>

            <nav className="hidden flex-1 justify-end lg:flex">
              <ul className="flex items-center gap-6 text-sm font-medium text-white">
                {navItems.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      className="relative inline-flex items-center gap-1 transition hover:opacity-80"
                    >
                      <span className="hidden sm:inline-flex h-1 w-1 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                      {t(`landing.nav.${item.key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <Link
              to="/login"
              className="ml-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-black via-slate-900 to-black px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)] hover:from-slate-900 hover:via-black hover:to-slate-900 transition"
            >
              {t("landing.nav.login")}
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
