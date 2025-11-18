import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

type Step = {
  number: string;
  title: string;
  description: string;
};

export default function HowItWorks() {
  const { t } = useTranslation();
  const steps = t("landing.howItWorks.steps", {
    returnObjects: true,
  }) as Step[];

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-b from-white via-eduBlue-50/30 to-white py-24"
    >
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/4 h-96 w-96 rounded-full bg-eduGreen-100/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-peach-100/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-eduBlue-200 bg-eduBlue-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-eduBlue-600">
            {t("landing.howItWorks.badge")}
          </div>
          <h2 className="mt-6 text-3xl font-black text-gray-900 md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500 bg-clip-text text-transparent">
              {t("landing.howItWorks.title")}
            </span>
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
            {t("landing.howItWorks.subtitle")}
          </p>
        </motion.div>

        <div className="mt-16">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center md:flex-row">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                >
                  <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105">
                    <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-peach-400 to-peach-600 text-lg font-black text-white shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="mt-4 text-center text-lg font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-center text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </motion.div>

                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden md:block mx-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.2 + 0.3,
                      duration: 0.5,
                    }}
                  >
                    <ArrowRight className="h-8 w-8 text-gray-400" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

