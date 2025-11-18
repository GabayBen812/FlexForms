import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FileText,
  CreditCard,
  Calculator,
  FileCheck,
  Mail,
  User,
  Users,
  Share2,
  Smartphone,
  Clock,
  BookOpen,
} from "lucide-react";

type Feature = {
  icon: string;
  title: string;
  description: string;
  color: string;
  details?: string[];
};

export default function KeyFeatures() {
  const { t } = useTranslation();
  const features = t("landing.keyFeatures.items", {
    returnObjects: true,
  }) as Feature[];

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    FileText,
    CreditCard,
    Calculator,
    FileCheck,
    Mail,
    User,
    Users,
    Share2,
    Smartphone,
    Clock,
    BookOpen,
  };

  const colorClasses: Record<string, string> = {
    peach: "from-peach-400 to-peach-600 text-peach-600",
    eduGreen: "from-eduGreen-400 to-eduGreen-600 text-eduGreen-600",
    eduBlue: "from-eduBlue-400 to-eduBlue-600 text-eduBlue-600",
  };

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-white via-peach-50/30 to-white py-24"
    >
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-peach-100/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 h-96 w-96 rounded-full bg-eduBlue-100/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
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
          <div className="inline-flex items-center gap-2 rounded-full border border-eduGreen-200 bg-eduGreen-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-eduGreen-600">
            {t("landing.keyFeatures.badge")}
          </div>
          <h2 className="mt-6 text-3xl font-black text-gray-900 md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500 bg-clip-text text-transparent">
              {t("landing.keyFeatures.title")}
            </span>
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
            {t("landing.keyFeatures.subtitle")}
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
          {features.map((feature, index) => {
            const IconComponent =
              iconMap[feature.icon] || FileText;
            const colorClass =
              colorClasses[feature.color] || colorClasses.peach;

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
                <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-gray-300 hover:shadow-xl">
                  <motion.div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <IconComponent className={`h-6 w-6 ${colorClass.split(" ")[2]}`} />
                  </motion.div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                  {feature.details && (
                    <ul className="mt-3 space-y-1 text-xs text-gray-500">
                      {feature.details.map((detail: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

