// import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Mail, Lock } from "lucide-react";
import footerSvg from "@/assets/landing/footer.svg";
import heroIllustration from "@/assets/landing/hero-illustration.svg";
import logoNoBG from "@/assets/landing/logoNoBG.svg";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  const queryClient = useQueryClient();
  // const { t } = useTranslation();

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");
  const { isLoginLoading, login } = auth;

  useEffect(() => {
    if (!auth.isUserLoading && auth.isAuthenticated) {
      navigate("/home");
    }
  }, [auth.isAuthenticated, auth.isUserLoading, navigate]);

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
      setErrorMessage(response?.error || "אירעה שגיאה, נסה שוב.");
      return;
    }

    // Wait for the cookie to be set before refetching user data
    await new Promise(res => setTimeout(res, 200));
    await queryClient.invalidateQueries({ queryKey: ["user"] });
    await queryClient.refetchQueries({ queryKey: ["user"] });
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Toaster />
      {/* HEADER */}
      <header className="absolute w-full z-30">
        <div className="relative w-full h-20 overflow-hidden">
          <div className="absolute top-0 bg-gradient-to-tr from-blue-600 to-blue-500 w-full h-20 -z-10" />
          <img
            src={heroIllustration}
            alt="hero"
            width={960}
            height={960}
            className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 -mt-40 ml-20 pointer-events-none -z-10 max-w-none mix-blend-lighten"
          />
        </div>
        <div className="absolute w-full h-20 top-10 flex justify-center items-end">
          <div className="bg-blue-950 border-2 border-slate-400 rounded-lg p-3 flex items-center justify-center text-white gap-2">
            <h1 className="text-2xl">FlexForm</h1>
            <img src={logoNoBG} alt="logo" className="w-10" />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="grow w-full flex flex-col justify-between">
        <section className="w-full">
          <div className="pt-36 pb-12">
            <div className="flex pt-12 lg:pt-0 justify-center">
              <div className="w-full max-w-[480px] bg-white p-6 shadow-2xl">
                <div className="space-y-4 flex flex-col justify-center items-center">
                  <h1>התחברו באמצעות מייל וסיסמה</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <Input
                    name="mail"
                    placeholder="מייל"
                    icon={<Mail className="text-[#606876]" />}
                  />
                  <Input
                    name="password"
                    placeholder="סיסמה"
                    type="password"
                    icon={<Lock className="text-[#606876]" />}
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-right font-normal">
                      {errorMessage}
                    </p>
                  )}
                  <div className="text-right">
                    <Button
                      type="submit"
                      loading={isLoginLoading}
                      className="btn-sm inline-flex items-center text-blue-50 bg-blue-500 hover:bg-blue-600"
                    >
                      התחבר
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <footer className="h-32 justify-center flex w-full relative">
          <img
            src={footerSvg}
            alt="footer"
            className="absolute md:-top-[20%] h-60"
          />
        </footer>
      </main>
    </div>
  );
}
