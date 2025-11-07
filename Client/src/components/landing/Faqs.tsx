import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type FaqItem = {
  question: string;
  answer: string;
};

export default function Faqs() {
  const { t } = useTranslation();
  const items = t("landing.faqs.items", {
    returnObjects: true,
  }) as FaqItem[];

  return (
    <section className="bg-white py-24 text-right">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="text-center md:text-right"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
            {t("landing.faqs.title")}
          </h2>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-6 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {items.map((item) => (
            <motion.div
              key={item.question}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: "easeOut" },
                },
              }}
              className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50/60 p-8 shadow-[0_25px_55px_rgba(15,23,42,0.08)]"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
