import { RequestHandler, Router } from "express";
import {
  createNewCallCategory,
  deleteCategory,
  getCallCategories,
  getCalls,
  updateCategory,
} from "../controllers/calls.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
export const callsRouter: Router = Router();

callsRouter.post(
  "/categories",
  verifyJWT as RequestHandler,
  createNewCallCategory
);
callsRouter.get("/categories", verifyJWT as RequestHandler, getCallCategories);

callsRouter.delete("/categories", verifyJWT as RequestHandler, deleteCategory);

callsRouter.put("/categories", verifyJWT as RequestHandler, updateCategory);

callsRouter.get("/", verifyJWT as RequestHandler, getCalls);
