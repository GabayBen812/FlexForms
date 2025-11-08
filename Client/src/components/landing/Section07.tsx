import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type IntegrationItem = {
  title: string;
  description: string;
};

export default function Section07() {
  const { t } = useTranslation();
  const items = t("landing.integrations.items", {
    returnObjects: true,
  }) as IntegrationItem[];

  return (
    <section
      id="partners"
      className="relative overflow-hidden bg-black py-24 text-right text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.25),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(45,212,191,0.28),_transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="flex flex-col items-center text-center md:items-end md:text-right"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            Integrations
          </div>
          <h2 className="mt-6 text-3xl font-black text-white md:text-5xl">
            {t("landing.integrations.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-white/70">
            {t("landing.integrations.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-6 md:grid-cols-3"
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
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.45)] backdrop-blur-lg"
            >
              <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-300/20 via-orange-300/15 to-emerald-300/20 opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative">
                <h3 className="text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 flex justify-center md:justify-end"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <a
            href="#cta"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            {t("landing.integrations.cta")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}


