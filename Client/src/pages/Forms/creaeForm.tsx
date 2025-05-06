import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useOrganization } from "@/hooks/useOrganization";
import { useEffect } from "react";
import apiClient from "@/api/apiClient";


function CreateForm() {
 const { organization, isOrganizationFetching } = useOrganization();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState<string>();
  const [fields, setFields] = useState([{ label: "", type: "text" }]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (organization?._id) {
      setOrganizationId(organization._id);
    }
    console.log("🔍 Organization data:", organization);
  }, [organization]);;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log("title:", title);
    console.log("organizationId:", organizationId);
    console.log("organizationName:", organization?.name);
    if (!title || !organizationId ) {
      alert(" חובה למלא את שם הארגון!");
      return;
    }

    const formPayload = {
      title,
      description,
      organizationId,
      fields,
      isActive,
    };

    try {
        
        const response = await apiClient.post("/forms", formPayload);
  
        if (response.status === 200 || response.status === 201) {
          alert("הטופס נוצר בהצלחה!");
        } else {
          alert("אירעה שגיאה ביצירת הטופס");
        }
     
    } catch (error) {
      console.error("שגיאה:", error);
      alert("אירעה שגיאה, נסה שוב מאוחר יותר");
    }
  };

  
  return (
    <div>
      <h1 className="text-2xl font-semibold">יצירת טופס חדש</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>כותרת הטופס:</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
   <Button type="submit">צור טופס</Button>
      </form>
    </div>
  );
};

export default CreateForm;
