import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Cta() {
  const { t } = useTranslation();

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-black py-24 text-right text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.28),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.22),_transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="flex flex-col gap-10 rounded-4xl border border-white/10 bg-white/5 p-10 shadow-[0_45px_85px_rgba(0,0,0,0.45)] backdrop-blur-xl md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-white md:text-5xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mt-4 text-lg text-white/70">
              {t("landing.cta.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-4 sm:flex-row">
            <Link
              to="/create-organization"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-orange-300 to-emerald-300 px-8 py-3 text-base font-semibold text-black shadow-[0_25px_55px_rgba(236,72,153,0.35)] transition hover:scale-[1.02]"
            >
              {t("landing.cta.primaryCta")}
            </Link>
            <a
              href="#support"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/20"
            >
              {t("landing.cta.secondaryCta")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
