import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Cta() {
  const { t } = useTranslation();

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-gradient-to-br from-peach-50 via-eduGreen-50 to-eduBlue-50 py-24"
    >
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-peach-200/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-eduBlue-200/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="flex flex-col gap-10 rounded-4xl border-2 border-white bg-white/80 p-10 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-3xl text-center md:text-right">
            <h2 className="text-3xl font-black text-gray-900 md:text-5xl">
              <span className="bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500 bg-clip-text text-transparent">
                {t("landing.cta.title")}
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t("landing.cta.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row md:items-end">
            <Link
              to="/create-organization"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-peach-400 via-eduGreen-400 to-eduBlue-400 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-peach-200/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-peach-300/50"
            >
              <span className="relative z-10">{t("landing.cta.primaryCta")}</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Link>
            <a
              href="#hero"
              className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-peach-300 hover:bg-peach-50 hover:text-peach-600"
            >
              {t("landing.cta.secondaryCta")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
