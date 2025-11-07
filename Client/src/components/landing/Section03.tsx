import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type WorkflowStep = {
  title: string;
  description: string;
  time: string;
};

export default function Section03() {
  const { t } = useTranslation();
  const steps = t("landing.workflow.steps", {
    returnObjects: true,
  }) as WorkflowStep[];

  return (
    <section id="workflow" className="bg-white py-24 text-right">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 sm:px-6 lg:flex-row">
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-100 to-teal-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900">
            Paradize Flow
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 md:text-5xl">
            {t("landing.workflow.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("landing.workflow.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-1 flex-col gap-8"
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
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={{
                hidden: { opacity: 0, x: 35 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.45, ease: "easeOut" },
                },
              }}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
            >
              <div className="absolute inset-y-0 right-0 w-1 max-md:w-full max-md:h-1 bg-gradient-to-b from-pink-300 via-orange-300 to-teal-300 md:h-full" />
              <div className="relative flex flex-col gap-4 px-6 py-7 md:flex-row md:items-center md:gap-8">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 via-orange-300 to-emerald-300 text-lg font-bold text-slate-900 shadow-[0_12px_35px_rgba(236,72,153,0.25)]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {step.time}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <p className="md:max-w-xl text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}