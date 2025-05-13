import LanguagePicker from "@/components/LanguagePicker";
import { CardFooter } from "@/components/ui/card";
function LoginFooter() {
  return (
    <CardFooter className="text-xs text-gray-500 flex justify-center space-x-4 font-normal">
      <LanguagePicker />
    </CardFooter>
  );
}

export default LoginFooter;
