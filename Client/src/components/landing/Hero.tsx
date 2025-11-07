import heroIllustration from "@/assets/landing/hero-illustration.svg";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type HeroStat = {
  value: string;
  label: string;
};

export default function Hero() {
  const { t } = useTranslation();
  const stats = t("landing.hero.stats", { returnObjects: true }) as HeroStat[];

  return (
    <section
      id="product"
      className="relative overflow-hidden bg-black text-white"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -top-16 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-pink-300 via-orange-300 to-teal-300 opacity-60 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-emerald-300 via-teal-300 to-orange-400 opacity-40 blur-3xl" />
        <img
          src={heroIllustration}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 pt-32 pb-24 md:flex-row md:items-center md:justify-between">
        <motion.div
          className="max-w-xl text-center md:max-w-2xl md:text-right"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
            {t("landing.hero.badge")}
          </div>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-pink-300 via-orange-200 to-teal-200 bg-clip-text text-transparent drop-shadow-[0_18px_30px_rgba(120,81,255,0.25)]">
              {t("landing.hero.title")}
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80 md:text-xl">
            {t("landing.hero.subtitle")}
          </p>
          <motion.div
            className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-6 text-base text-white/70 shadow-[0_25px_80px_rgba(253,164,175,0.15)] backdrop-blur"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            {t("landing.hero.highlight")}
          </motion.div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-end">
            <Link
              to="/create-organization"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-orange-300 to-emerald-300 px-8 py-3 text-base font-semibold text-black shadow-[0_20px_45px_rgba(236,72,153,0.35)] transition hover:scale-[1.02]"
            >
              {t("landing.hero.primaryCta")}
            </Link>
            <a
              href="#support"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3 text-base font-semibold text-white transition hover:bg-white/20"
            >
              <span>{t("landing.hero.secondaryCta")}</span>
              <span className="text-xs text-emerald-200">
                {t("landing.hero.secondaryCtaHint")}
              </span>
            </a>
          </div>
        </motion.div>

        <motion.div
          className="relative flex w-full max-w-md flex-col gap-5 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl md:w-auto"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute -top-16 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-pink-300 via-orange-300 to-teal-300 opacity-60 blur-3xl" />
          <div className="relative">
            <motion.div
              className="grid grid-cols-1 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.15 },
                },
              }}
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: "easeOut" },
                    },
                  }}
                >
                  <div className="text-3xl font-black text-white md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
