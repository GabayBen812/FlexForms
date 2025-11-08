import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type FeatureItem = {
  title: string;
  highlight: string;
  description: string;
};

export default function Section02() {
  const { t } = useTranslation();
  const features = t("landing.features.items", {
    returnObjects: true,
  }) as FeatureItem[];

  return (
    <section
      id="automation"
      className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-16 h-72 w-72 rounded-full bg-gradient-to-br from-orange-200 via-pink-200 to-emerald-200 opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[380px] w-[380px] rounded-full bg-gradient-to-tr from-teal-300 via-emerald-200 to-orange-200 opacity-20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="text-center md:text-right"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            {t("landing.nav.automation")}
          </div>
          <h2 className="mt-6 text-3xl font-black text-white md:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-lg text-white/70">
            {t("landing.features.subtitle")}
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
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 35 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_35px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition"
            >
              <div className="absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 via-orange-200/15 to-emerald-200/20" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-gradient-to-br from-pink-400/40 via-orange-300/40 to-teal-200/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Paradize Core
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-emerald-100">
                  {feature.highlight}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  {feature.description}
                </p>
              </div>
              <div className="relative mt-8 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-300 via-orange-300 to-emerald-300"
                  initial={{ width: "0%" }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


