import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { GraduationCap, Users, BookOpen, Sparkles, Phone } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleDialogToggle = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setPhoneNumber("");
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-white pt-32 pb-24 md:pt-40 md:pb-32"
    >
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-peach-200/40 via-peach-300/30 to-transparent blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[-120px] left-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-eduGreen-200/40 via-eduBlue-200/30 to-transparent blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-eduBlue-200/30 via-peach-200/20 to-eduGreen-200/30 blur-3xl"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Content */}
          <motion.div
            className="flex-1 text-center lg:text-right"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-peach-200 bg-peach-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-peach-600 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Sparkles className="h-3 w-3 text-peach-500" />
              {t("landing.hero.badge")}
            </motion.div>

            <h1 className="text-4xl font-black leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500 bg-clip-text text-transparent">
                Paradize
              </span>
              <br />
              <span className="text-gray-700 text-3xl md:text-4xl lg:text-5xl">
                {t("landing.hero.title")}
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-gray-600 md:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            <p className="mt-4 text-base text-gray-500">
              {t("landing.hero.description")}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-eduGreen-200 bg-eduGreen-50/50 px-4 py-2 text-sm font-semibold text-eduGreen-700">
              <span className="h-2 w-2 rounded-full bg-eduGreen-500 animate-pulse" />
              {t("landing.hero.support24")}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-end">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-end">
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-peach-400 via-eduGreen-400 to-eduBlue-400 px-12 py-5 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-200"
                >
                  {t("landing.hero.primaryCta")}
                </Button>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogToggle}>
                <DialogContent className="bg-white text-gray-900">
                  <DialogHeader>
                    <div className="flex flex-col gap-2 text-right">
                      <DialogTitle className="text-2xl font-bold">
                        {t("landing.hero.contactDialog.title")}
                      </DialogTitle>
                      <DialogDescription className="text-base text-gray-500">
                        {t("landing.hero.contactDialog.description")}
                      </DialogDescription>
                    </div>
                  </DialogHeader>
                  <DialogBody>
                    <div className="flex flex-col gap-4">
                      <Label
                        htmlFor="contact-phone"
                        className="text-sm font-semibold text-gray-700"
                      >
                        {t("landing.hero.contactDialog.phoneLabel")}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="contact-phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(event) => setPhoneNumber(event.target.value)}
                          placeholder={t(
                            "landing.hero.contactDialog.phonePlaceholder"
                          )}
                          className="h-20 rounded-3xl border-2 border-gray-200 bg-gray-50 text-center text-2xl font-semibold tracking-wide text-gray-800 focus:border-peach-300 focus:bg-white focus:text-gray-900 focus:ring-0"
                        />
                      </div>
                    </div>
                  </DialogBody>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button className="w-full rounded-full bg-gradient-to-r from-peach-400 via-eduGreen-400 to-eduBlue-400 py-6 text-lg font-semibold text-white shadow-lg shadow-peach-200/60 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-peach-300/60">
                        {t("landing.hero.contactDialog.submit")}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Right Side - Educational Graphics */}
          <motion.div
            className="relative flex w-full max-w-lg items-center justify-center lg:w-auto"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Main Circle Container */}
              <div className="relative h-96 w-96 md:h-[500px] md:w-[500px]">
                {/* Central Icon */}
                <motion.div
                  className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-peach-400 via-eduGreen-400 to-eduBlue-400 p-6 shadow-2xl">
                    <GraduationCap className="h-16 w-16 text-white" />
                  </div>
                </motion.div>

                {/* Floating Icons Around */}
                {[
                  { icon: Users, colorClass: "text-peach-500", angle: 0, delay: 0 },
                  { icon: BookOpen, colorClass: "text-eduGreen-500", angle: 120, delay: 0.2 },
                  { icon: GraduationCap, colorClass: "text-eduBlue-500", angle: 240, delay: 0.4 },
                ].map(({ icon: Icon, colorClass, angle, delay }) => {
                  const radius = 180;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <motion.div
                      key={angle}
                      className="absolute left-1/2 top-1/2 z-20"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: delay + 0.5, duration: 0.5 }}
                    >
                      <motion.div
                        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl"
                        style={{
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        }}
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: delay,
                        }}
                      >
                        <Icon className={`h-10 w-10 ${colorClass}`} />
                      </motion.div>
                    </motion.div>
                  );
                })}

                {/* Decorative Circles */}
                <motion.div
                  className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-peach-200/30"
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-eduGreen-200/30"
                  animate={{ rotate: [360, 0] }}
                  transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-eduBlue-200/30"
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
