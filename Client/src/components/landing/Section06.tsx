
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type SupportItem = {
  title: string;
  description: string;
};

export default function Section06() {
  const { t } = useTranslation();
  const items = t("landing.supportSection.items", {
    returnObjects: true,
  }) as SupportItem[];

  return (
    <section
      id="support"
      className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50 py-24 text-right"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="flex flex-col items-center text-center md:items-end md:text-right"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Paradize Care
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 md:text-5xl">
            {t("landing.supportSection.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            {t("landing.supportSection.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-6 md:grid-cols-2"
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
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: "easeOut" },
                },
              }}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)]"
            >
              <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-200/20 via-orange-200/15 to-emerald-200/20 opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative">
                <h3 className="text-xl font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
