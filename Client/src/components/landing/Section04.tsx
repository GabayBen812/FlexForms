import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type ValuePillar = {
  title: string;
  description: string;
};

export default function Section04() {
  const { t } = useTranslation();
  const pillars = t("landing.value.pillars", {
    returnObjects: true,
  }) as ValuePillar[];

  return (
    <section
      id="value"
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-950 py-24 text-right"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-emerald-300 via-teal-300 to-orange-300 opacity-30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-1/3 h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-pink-300 via-orange-200 to-teal-200 opacity-30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-start">
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            Paradize Trust
          </div>
          <h2 className="mt-6 text-3xl font-black text-white md:text-5xl">
            {t("landing.value.title")}
          </h2>
          <p className="mt-4 text-lg text-white/70">
            {t("landing.value.subtitle")}
          </p>
          <motion.a
            href="#cta"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-400 via-orange-300 to-green-300 px-8 py-3 text-base font-semibold text-slate-900 shadow-[0_18px_48px_rgba(236,72,153,0.35)] transition hover:scale-[1.02]"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {t("landing.value.cta")}
          </motion.a>
        </motion.div>

        <motion.div
          className="flex flex-1 flex-col gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.title}
              variants={{
                hidden: { opacity: 0, y: 35 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-lg"
            >
              <div className="absolute inset-0 opacity-0 transition duration-500 hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 via-orange-200/15 to-emerald-200/20" />
              </div>
              <div className="relative">
                <h3 className="text-2xl font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
