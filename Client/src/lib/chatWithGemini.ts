// export async function chatWithGemini(prompt: string): Promise<string> {
//     const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
//     const instruction = `הנחיה: אתה עוזר אישי במערכת CRM לניהול בתי מלון. המשתמש שמדבר איתך הוא מנהל בכיר במלון. מותר לך לענות רק על שאלות שקשורות למערכת, לתפקוד שלה, לתקלות, למחלקות, למשתמשים ולעבודה השוטפת של המלון. אסור לך לענות על שום שאלה אחרת שלא קשורה למערכת. אם נשאלת שאלה שאינה רלוונטית, הסבר שאתה נועד רק לעזרה בשימוש במערכת CRM.`;
  
//     const res = await fetch(
//       "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 { text: `${instruction}\n\nשאלה: ${prompt}` }
//               ]
//             }
//           ]
//         }),
//       }
//     );
  
//     if (!res.ok) {
//       const err = await res.json();
//       console.error("Gemini error:", err);
//       return "אירעה שגיאה בשרת.";
//     }
  
//     const data = await res.json();
//     return data?.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי להבין.";
//   }
  
const BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:3101";

export async function chatWithGemini(prompt: string, orgId: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/ai/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ prompt, orgId }),
  });

  if (!res.ok) {
    console.error("Server error:", await res.text());
    return "אירעה שגיאה בשרת.";
  }

  const data = await res.json();
  return data.response || "לא הצלחתי להבין.";
}
