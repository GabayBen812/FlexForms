// export async function chatWithGemini(prompt: string): Promise<string> {
//     const apiKey = process.env.GEMINI_API_KEY;
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: prompt }] }],
//         }),
//       }
//     );
  
//     const data = await response.json();
//     return data?.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי להבין.";
//   }
  

export async function chatWithGemini(prompt: string, raw?: boolean): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
  
    const data = await response.json();
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
    if (!text) return "לא הצלחתי להבין.";
  
    if (raw) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return jsonMatch[0];
      return text;
    }
  
    return text;
  }
  