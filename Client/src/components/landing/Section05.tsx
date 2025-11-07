import logos from "@/assets/landing/logos.png";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type SocialMetric = {
  value: string;
  label: string;
};

export default function Section05() {
  const { t } = useTranslation();
  const metrics = t("landing.socialProof.metrics", {
    returnObjects: true,
  }) as SocialMetric[];
  const logosList = t("landing.socialProof.logos", {
    returnObjects: true,
  }) as string[];

  return (
    <section
      id="partners-grid"
      className="relative overflow-hidden bg-gradient-to-br from-pink-400 via-orange-300 to-emerald-300 py-24 text-right"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.1),_transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="flex flex-col items-center text-center md:items-end md:text-right"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-black">
            {t("landing.socialProof.badge")}
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 md:text-5xl">
            {t("landing.socialProof.title")}
          </h2>
          <p className="mt-4 max-w-4xl text-lg text-slate-800/80">
            {t("landing.socialProof.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-6 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.12,
              },
            },
          }}
        >
          {metrics.map((metric) => (
            <motion.article
              key={metric.label}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: "easeOut" },
                },
              }}
              className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-lg shadow-[0_30px_60px_rgba(15,23,42,0.12)]"
            >
              <div className="text-4xl font-black text-slate-900 md:text-5xl">
                {metric.value}
              </div>
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-700/80">
                {metric.label}
              </p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 flex flex-col gap-8 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-2xl text-sm leading-relaxed text-slate-800">
            {t("landing.socialProof.supportingText")}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4 text-right text-sm font-semibold uppercase tracking-[0.2em] text-slate-900/70">
            {logosList.map((logoName) => (
              <span
                key={logoName}
                className="rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-[0_10px_25px_rgba(15,23,42,0.12)]"
              >
                {logoName}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-16 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.12)] backdrop-blur-lg">
            <img
              src={logos}
              alt="Paradize customers"
              className="w-full max-w-3xl object-contain"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
