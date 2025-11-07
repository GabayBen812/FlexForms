import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import heroIllustration from "@/assets/landing/hero-illustration.svg";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Login() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const stats = t("landing.hero.stats", { returnObjects: true }) as Array<{
    value: string;
    label: string;
  }>;

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");
  const { isLoginLoading, login } = auth;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);
    const { password, mail } = Object.fromEntries(formData);

    const response = await login({
      email: String(mail).trim().toLowerCase(),
      password: String(password),
    });

    if (!response || response.status !== 200) {
      setErrorMessage(response?.error || t("landing.login.error.generic"));
      return;
    }

    // Wait for the cookie to be set before refetching user data
    await new Promise((res) => setTimeout(res, 200));
    await queryClient.invalidateQueries({ queryKey: ["user"] });
    await queryClient.refetchQueries({ queryKey: ["user"] });

    // Only navigate after successful login
    navigate("/home");
  };

  const logoSrc = "/paradize-logo.svg";

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-pink-300 via-orange-300 to-emerald-300 opacity-40 blur-3xl" />
        <div className="absolute bottom-[-160px] left-1/4 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-sky-400 via-teal-300 to-emerald-200 opacity-35 blur-3xl" />
      </div>
      <img
        src={heroIllustration}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen"
      />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 pt-14 sm:px-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <img
              src={logoSrc}
              alt="Paradize"
              className="h-10 w-10 rounded-full ring-1 ring-white/50"
            />
            <span className="text-lg font-semibold">Paradize</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full grow items-center justify-center px-4 pb-16 pt-12 sm:px-6">
        <motion.div
          className="grid w-full max-w-5xl gap-10 rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_55px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:grid-cols-[minmax(0,460px)_minmax(0,260px)] lg:p-12"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col">
            <div className="flex flex-col gap-3 text-right text-white">
              <span className="inline-flex items-center gap-2 self-end rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/75">
                {t("landing.login.badge")}
              </span>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                <span className="bg-gradient-to-l from-emerald-200 via-teal-200 to-pink-200 bg-clip-text text-transparent">
                  {t("landing.login.title")}
                </span>
              </h1>
              <p className="text-sm text-white/70 md:text-base">
                {t("landing.login.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-4 text-right">
              <Input
                name="mail"
                placeholder={t("landing.login.emailPlaceholder")}
                icon={<Mail className="text-white/60" />}
                className="h-12 rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40"
              />
              <Input
                name="password"
                placeholder={t("landing.login.passwordPlaceholder")}
                type="password"
                icon={<Lock className="text-white/60" />}
                className="h-12 rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40"
              />
              {errorMessage && (
                <p className="text-sm font-medium text-rose-300">{errorMessage}</p>
              )}
              <Button
                type="submit"
                loading={isLoginLoading}
                className="mt-2 inline-flex w-full justify-center rounded-full border border-white/20 bg-gradient-to-r from-pink-400 via-orange-300 to-emerald-300 px-6 py-3 text-base font-semibold text-slate-900 shadow-[0_30px_65px_rgba(236,72,153,0.35)] hover:scale-[1.01]"
              >
                {t("landing.login.submit")}
              </Button>
            </form>

            <p className="mt-6 text-sm text-white/60">
              {t("landing.login.support")}
            </p>
          </div>

          <div className="hidden flex-col justify-between gap-6 text-right text-white/80 lg:flex">
            <motion.div
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_30px_65px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            >
              <h3 className="text-lg font-semibold text-white">
                Paradize Insights
              </h3>
              <p className="mt-3 text-sm text-white/65">
                {t("landing.value.subtitle")}
              </p>
            </motion.div>
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-[0_25px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                >
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="mt-2 text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
