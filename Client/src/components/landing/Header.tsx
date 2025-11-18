import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Header() {
  const { t } = useTranslation();
  const logoSrc = "/paradize-logo.svg";

  return (
    <motion.header
      className="fixed top-0 w-full z-40"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-4">
        <div className="relative overflow-hidden rounded-full border border-gray-200 bg-white/80 backdrop-blur-xl shadow-lg">
          <div className="relative flex items-center justify-between px-6 py-3 lg:px-8">
            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/" className="relative inline-flex items-center">
                <img
                  src={logoSrc}
                  className="h-9 w-9 rounded-full shadow-md ring-1 ring-gray-200"
                  alt="Paradize Logo"
                />
              </Link>
            </div>

            <Link
              to="/login"
              className="ml-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-peach-400 via-eduGreen-400 to-eduBlue-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
            >
              {t("landing.nav.login")}
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
