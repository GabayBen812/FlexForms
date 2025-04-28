import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import { chatWithGemini } from "../utils/gemini";
import { getAnalysisPrompt, getFallbackPrompt, getFinalAnswerPrompt } from "../prompts/ai.prompts";
import { normalizeTypes, replaceOrgIdRecursively } from "../utils/aiUtils";

export const askAI = async (req: Request, res: Response) => {
  try {
    const { prompt, orgId } = req.body;
    if (!orgId) return res.status(400).json({ message: "Missing organization ID" });

    const analysisPrompt = getAnalysisPrompt(orgId, prompt);
    // console.log("🧠 ANALYSIS PROMPT:\n", analysisPrompt);

    // console.log("✅ orgId:", orgId, "| 🗨️ prompt:", prompt);

    const parseResponse = await chatWithGemini(analysisPrompt, true);
    // console.log("📥 GEMINI RESPONSE:\n", parseResponse);
    


    let parsed;
    try {
      parsed = JSON.parse(parseResponse);
    } catch {
      return res.json({ response: "לא הצלחתי להבין את הבקשה." });
    }

    if (parsed.skip) {
      const fallbackPrompt = getFallbackPrompt(prompt);
      const fallbackAnswer = await chatWithGemini(fallbackPrompt);
      return res.json({ response: fallbackAnswer });
    }

    if (!parsed.model || !parsed.action || !parsed.where) {
      console.log("Invalid AI response structure:", parsed);
      return res.status(400).json({ message: "Invalid query structure from AI response" });
    }

    const safeWhere = normalizeTypes(replaceOrgIdRecursively(parsed.where, orgId));

    if (Array.isArray(parsed.select)) {
      parsed.select = parsed.select.reduce((acc: any, field: string) => {
        acc[field] = true;
        return acc;
      }, {});
    }

    // console.log("🔍 Prisma Query:", {
    //   model: parsed.model,
    //   action: parsed.action,
    //   where: safeWhere,
    //   select: parsed.select,
    // });
    

    const result = await (prismaClient as any)[parsed.model][parsed.action]({
      where: safeWhere,
      select: parsed.select,
    });

    const finalPrompt = getFinalAnswerPrompt(prompt, result);
    // console.log("🧾 Final Answer Prompt:\n", finalPrompt);

    const answer = await chatWithGemini(finalPrompt);
    // console.log("🗣️ Final Gemini Answer:\n", answer);

    res.json({ response: answer });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ message: "AI failed" });
  }
};