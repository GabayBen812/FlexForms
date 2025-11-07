import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type IndustryItem = {
  title: string;
  tagline: string;
  description: string;
};

export default function Section01() {
  const { t } = useTranslation();
  const industries = t("landing.industries.items", {
    returnObjects: true,
  }) as IndustryItem[];

  return (
    <section
      id="industries"
      className="relative overflow-hidden bg-slate-950 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.22),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-right">
        <motion.div
          className="flex flex-col items-center md:items-end md:text-right"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            {t("landing.nav.industries")}
          </div>
          <h2 className="mt-6 text-3xl font-black text-white md:text-4xl">
            <span className="bg-gradient-to-l from-emerald-200 via-teal-200 to-orange-200 bg-clip-text text-transparent">
              {t("landing.industries.title")}
            </span>
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-white/70">
            {t("landing.industries.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {industries.map((industry, index) => (
            <motion.article
              key={industry.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: "easeOut" },
                },
              }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-[0_25px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-400/15 via-orange-300/10 to-teal-300/15 opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-300/40 via-orange-300/40 to-emerald-300/40 shadow-[0_10px_25px_rgba(236,72,153,0.25)]" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                {industry.title}
              </h3>
              <p className="mt-2 text-sm text-emerald-100/80">
                {industry.tagline}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                {industry.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}