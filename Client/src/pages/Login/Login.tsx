import { useEffect, useState } from "react";
import { AuroraBackground } from "@/components/backgrounds/AroraBackground";
import Step1 from "./components/Step1";
import { LoginSteps } from "@/types/login/login";
import Step2 from "./components/Step2";
import { useLocation } from "react-router-dom";
import { GalleryVerticalEnd } from "lucide-react";
import { decryptData } from "@/lib/crypto-js";
import LoginFooter from "./components/LoginFooter";
import { Toaster } from "sonner";

function Login() {
  const [step, setStep] = useState<LoginSteps>(1);
  const location = useLocation();
  useEffect(() => {
    if (location.search) {
      const searchParams = new URLSearchParams(location.search);
      const encryptedData = searchParams.get("d");
      const data = decryptData(encryptedData || "") as {
        step: LoginSteps;
        gmail: string;
      };
      if (data && data.step) setStep(data.step);
    } else setStep(1);
  }, [location.search]);
  return (
    <AuroraBackground className="min-h-[750px]">
      <Toaster />
      <div className="flex items-center justify-center w-full h-screen min-h-[750px] z-20 bg-transparent">
        <div className="font-normal flex items-center bg-white py-12 px-4 rounded-lg min-w-[28rem] w-1/4 max-w-[36rem] aspect-square shadow-lg flex-col gap-6">
          <GalleryVerticalEnd className="size-8" />
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          <LoginFooter />
        </div>
      </div>
    </AuroraBackground>
  );
}

export default Login;
