import { useState } from "react";
import { AuroraBackground } from "@/components/backgrounds/AroraBackground";
import { GalleryVerticalEnd } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/hooks/useOrganization";
import CreateOrganizationSuccess from "./CreateOrganizationSuccess";

function CreateOrganization() {
  const [companyName, setCompanyName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  //@ts-ignore
  const { createNewOrganization, isCreateNewOrganizationLoading } =
    useOrganization();
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const response = await createNewOrganization({
      name: companyName,
    });
    if (response.status === 201 && response.data) setIsSuccess(true);
    else setErrorMessage(response.error || "אירעה שגיאה, נסה שוב.");
  };

  return (
    <AuroraBackground className="min-h-[750px]">
      <div className="flex items-center justify-center w-full h-screen min-h-[750px] z-20 bg-transparent">
        {isSuccess && <CreateOrganizationSuccess />}
        {!isSuccess && (
          <div className="font-normal flex items-center bg-white py-12 px-4 rounded-lg min-w-[28rem] w-1/4 max-w-[36rem] aspect-square shadow-lg flex-col gap-6">
            <GalleryVerticalEnd className="size-8" />
            <h1 className="font-medium text-2xl">יצירת חברה</h1>
            <form
              className="flex flex-col items-center gap-6 w-3/4"
              onSubmit={onSubmit}
            >
              <Input
                className="w-full"
                name="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="שם החברה"
              />
              {errorMessage && (
                <p className="text-red-500 text-right font-normal">
                  {errorMessage}
                </p>
              )}
              <Button
                disabled={
                  companyName.length < 3 || isCreateNewOrganizationLoading
                }
                loading={isCreateNewOrganizationLoading}
                className="w-full"
              >
                יצירה
              </Button>
            </form>
          </div>
        )}
      </div>
    </AuroraBackground>
  );
}

export default CreateOrganization;
