import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Zap, Shield, TrendingUp } from "lucide-react";

type Benefit = {
  icon: string;
  title: string;
  description: string;
  color: string;
};

export default function Benefits() {
  const { t } = useTranslation();
  const benefits = t("landing.benefits.items", {
    returnObjects: true,
  }) as Benefit[];

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    CheckCircle2,
    Zap,
    Shield,
    TrendingUp,
  };

  const colorClasses: Record<string, string> = {
    peach: "from-peach-400 to-peach-600 border-peach-200",
    eduGreen: "from-eduGreen-400 to-eduGreen-600 border-eduGreen-200",
    eduBlue: "from-eduBlue-400 to-eduBlue-600 border-eduBlue-200",
  };

  return (
    <section
      id="benefits"
      className="relative overflow-hidden bg-gradient-to-b from-white via-eduGreen-50/30 to-white py-24"
    >
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-peach-200/30 to-eduGreen-200/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-peach-200 bg-peach-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-peach-600">
            {t("landing.benefits.badge")}
          </div>
          <h2 className="mt-6 text-3xl font-black text-gray-900 md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500 bg-clip-text text-transparent">
              {t("landing.benefits.title")}
            </span>
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
            {t("landing.benefits.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
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
          {benefits.map((benefit, index) => {
            const IconComponent =
              iconMap[benefit.icon] || CheckCircle2;
            const colors = colorClasses[benefit.color] || colorClasses.peach;

            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: "easeOut" },
                  },
                }}
                className="group"
              >
                <div className="relative h-full overflow-hidden rounded-2xl border-2 bg-white p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colors.split(" ")[0]} ${colors.split(" ")[1]} opacity-0 transition-opacity duration-500 group-hover:opacity-5`}
                  />
                  <div className="relative">
                    <motion.div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colors.split(" ")[0]} ${colors.split(" ")[1]} shadow-md`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="h-7 w-7 text-white" />
                    </motion.div>
                    <h3 className="mt-5 text-lg font-bold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

