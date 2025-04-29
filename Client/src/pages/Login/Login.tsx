import { AuroraBackground } from "@/components/backgrounds/AroraBackground";
import Step1 from "./components/Step1";
import { GalleryVerticalEnd } from "lucide-react";
import LoginFooter from "./components/LoginFooter";
import { Toaster } from "sonner";

function Login() {
  return (
    <AuroraBackground className="min-h-[750px]">
      <Toaster />
      <div className="flex items-center justify-center w-full h-screen min-h-[750px] z-20 bg-transparent">
        <div className="font-normal flex items-center bg-white py-12 px-4 rounded-lg min-w-[28rem] w-1/4 max-w-[36rem] aspect-square shadow-lg flex-col gap-6">
          <GalleryVerticalEnd className="size-8" />
          <Step1 />
          <LoginFooter />
        </div>
      </div>
    </AuroraBackground>
  );
}

export default Login;
