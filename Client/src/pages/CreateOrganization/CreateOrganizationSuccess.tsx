import { Button } from "@/components/ui/button";
import { encryptData } from "@/lib/crypto-js";
import { useNavigate } from "react-router-dom";

function CreateOrganizationSuccess() {
  const navigate = useNavigate();
  const handleLoginClick = () => {
    const encryptedData = encryptData({ step: 2 });
    navigate(`/login?d=${encryptedData}`);
  };

  return (
    <div className="flex items-center justify-center z-50 ">
      <div className="font-normal flex items-center py-12 px-4 rounded-lg min-w-[28rem] w-1/4 max-w-[36rem] shadow-lg flex-col gap-6 text-center">
        <h1 className="font-medium text-2xl">🎉 הארגון נוצרה בהצלחה! 🎉</h1>
        <p className="text-lg text-muted-foreground">
          הארגון החדשה שלך נוצרה בהצלחה! תוכל כעת להיכנס ולנהל אותה.
        </p>
        <Button className="w-full" onClick={handleLoginClick}>
          מעבר למסך ההתחברות
        </Button>
      </div>
    </div>
  );
}

export default CreateOrganizationSuccess;
