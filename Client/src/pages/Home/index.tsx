import { useContext } from "react";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";

export default function Home() {
  const { organization } = useContext(OrganizationsContext);

  return (
    <div className="flex justify-center items-center h-screen">
      <h1 className="text-2xl font-semibold">
        ברוך הבא ל-FlexForms: {organization?.name || "טוען..."}
      </h1>
    </div>
  );
}
