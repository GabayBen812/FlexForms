import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { AuthContext } from "@/contexts/AuthContext";
import { Mail, Lock } from "lucide-react";
import { encryptData } from "@/lib/crypto-js";
import { useNavigate } from "react-router-dom";
function Step1() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const auth = useContext(AuthContext);

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  const { isLoginLoading, login } = auth;
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const { password, mail } = Object.fromEntries(formData);

    const response = await login({
      email: String(mail),
      password: String(password),
    });
    if (response && response.status === 202 && response.data) {
      const encryptedData = encryptData({ step: 2 });
      navigate(`/login?d=${encryptedData}`);
    } else setErrorMessage(response?.error || "אירעה שגיאה, נסה שוב.");
  };

  return (
    <>
      <form
        className="flex flex-col items-center gap-6 w-full"
        onSubmit={handleSubmit}
      >
        <h1 className="font-medium text-3xl">ברוכים הבאים</h1>
        <div className="w-3/4 flex flex-col gap-4">
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
          <Button
            type="submit"
            loading={isLoginLoading}
            className="bg-black hover:bg-opacity-25"
          >
            המשך
          </Button>
        </div>
      </form>
    </>
  );
}

export default Step1;
