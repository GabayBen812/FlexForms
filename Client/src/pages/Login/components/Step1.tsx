import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { AuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

function Step1() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");
  const { isLoginLoading, login } = auth;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const { password, mail } = Object.fromEntries(formData);

    const response = await login({
      email: String(mail),
      password: String(password),
    });

    if (!response || response.status !== 200) {
      setErrorMessage(response?.error || "אירעה שגיאה, נסה שוב.");
    }

    if (response && response.status === 200) {
      // Wait for the cookie to be set before navigating
      await new Promise((res) => setTimeout(res, 200));
      navigate("/home");
    } else {
      setErrorMessage(response?.error || "אירעה שגיאה, נסה שוב.");
    }
  };

  return (
    <form
      className="flex flex-col items-center gap-6 w-full"
      onSubmit={handleSubmit}
    >
      <h1 className="font-semibold text-2xl text-center leading-tight">
        Paradise
        <br />
        <span className="text-sm font-normal text-gray-600">
          מערכת ניהול טפסים והרשמות דיגיטליות
        </span>
      </h1>
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
          <p className="text-red-500 text-right font-normal">{errorMessage}</p>
        )}
        <Button
          type="submit"
          loading={isLoginLoading}
          className="bg-black hover:bg-opacity-25"
        >
          התחברות
        </Button>
      </div>
    </form>
  );
}

export default Step1;
