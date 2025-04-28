import { Router, RequestHandler } from "express";
import { askAI } from "../controllers/ai.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
import { asyncHandler } from "../utils/asyncHandler";

export const aiRouter = Router();

aiRouter.post("/ask", verifyJWT as RequestHandler, asyncHandler(askAI));
