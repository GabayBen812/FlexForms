import { RequestHandler, Router } from "express";
import { verifyJWT } from "../middlewares/JTW.middleware";
import {
  createOrUpdatePermission,
  getPermissions,
  updatePermission,
} from "../controllers/permission.controller";

export const permissionRouter: Router = Router();

const middlewares = [verifyJWT as RequestHandler];

permissionRouter.get("/", middlewares, getPermissions);
permissionRouter.post("/", middlewares, createOrUpdatePermission);
permissionRouter.put("/", middlewares, updatePermission);
