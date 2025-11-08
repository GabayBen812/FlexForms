import paymentIntegrationsIllustration from "@/assets/landing/features-02.png";
import cardVaultIllustration from "@/assets/landing/features-03.png";
import revenueOpsIllustration from "@/assets/landing/features-04.png";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type PaymentCardTranslation = {
  badge: string;
  title: string;
  description: string;
  imageKey: string;
  imageAlt: string;
  features: string[];
};

type PaymentMetric = {
  value: string;
  label: string;
};

type PaymentCta = {
  primary: string;
  secondary: string;
};

type PaymentAccountingTranslation = {
  title: string;
  description: string;
  items: string[];
};

const cardImageMap: Record<string, string> = {
  integrations: paymentIntegrationsIllustration,
  vault: cardVaultIllustration,
  control: revenueOpsIllustration,
};

export default function SectionPayments() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const cards = (
    t("landing.payments.cards", { returnObjects: true }) as PaymentCardTranslation[]
  ).map((card) => ({
    ...card,
    imageSrc:
      cardImageMap[card.imageKey as keyof typeof cardImageMap] ??
      paymentIntegrationsIllustration,
  }));

  const metrics = t("landing.payments.metrics", {
    returnObjects: true,
  }) as PaymentMetric[];

  const cta = t("landing.payments.cta", {
    returnObjects: true,
  }) as PaymentCta;

  const accounting = t("landing.payments.accounting", {
    returnObjects: true,
  }) as PaymentAccountingTranslation;

  return (
    <section
      id="payments"
      className="relative overflow-hidden bg-gradient-to-br from-black via-slate-950 to-slate-900 py-24 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-300 via-teal-300 to-orange-300 opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-pink-300 via-orange-200 to-teal-200 opacity-25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className={cn(
            "flex flex-col items-center text-center",
            isRTL
              ? "md:items-end md:text-right"
              : "md:items-start md:text-left",
          )}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            {t("landing.payments.badge")}
          </div>
          <h2 className="mt-6 text-3xl font-black md:text-5xl">
            <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-orange-200 bg-clip-text text-transparent">
              {t("landing.payments.title")}
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-white/75 md:max-w-3xl">
            {t("landing.payments.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid w-full gap-6 sm:grid-cols-3"
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
          {metrics.map((metric) => (
            <motion.div
              key={metric.value}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_22px_45px_rgba(0,0,0,0.35)] backdrop-blur-lg"
            >
              <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-300/15 via-orange-300/10 to-teal-300/15 opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative">
                <div className="text-3xl font-black md:text-4xl">
                  {metric.value}
                </div>
                <p className="mt-3 text-sm text-white/70">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 grid gap-6 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.12,
              },
            },
          }}
        >
          {cards.map((card) => (
            <motion.article
              key={card.title}
              variants={{
                hidden: { opacity: 0, y: 32 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: "easeOut" },
                },
              }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-400/15 via-orange-300/10 to-teal-200/15 opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="relative flex flex-col gap-6">
                <span className="self-start rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  {card.badge}
                </span>
                <div
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                  style={{ aspectRatio: "16 / 10" }}
                >
                  <motion.img
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    className="h-full w-full object-cover opacity-90"
                    initial={{ scale: 1.05 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/40"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  />
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {card.description}
                  </p>
                  <ul className="mt-5 flex flex-col gap-3 text-sm text-white/75">
                    {card.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-300 via-teal-300 to-orange-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="mt-14 rounded-3xl border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200">
                {accounting.title}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {accounting.description}
              </h3>
            </div>
            <ul className="grid flex-1 gap-4 text-sm text-white/80 sm:grid-cols-2">
              {accounting.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-pink-300 via-orange-300 to-emerald-300 shadow-[0_0_12px_rgba(236,72,153,0.5)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-col items-center justify-center gap-4 text-center md:flex-row"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <Link
            to="/payments"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-orange-300 to-emerald-300 px-8 py-3 text-base font-semibold text-black shadow-[0_18px_48px_rgba(236,72,153,0.35)] transition hover:scale-[1.02]"
          >
            {cta.primary}
          </Link>
          <a
            href="#cta"
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3 text-base font-semibold text-white transition hover:bg-white/20"
          >
            {cta.secondary}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

