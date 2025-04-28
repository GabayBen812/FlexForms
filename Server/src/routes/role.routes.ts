import { RequestHandler, Router } from "express";

import { verifyJWT } from "../middlewares/JTW.middleware";
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
  getRolesByOrganization
} from "../controllers/role.controller";
const middlewares = [verifyJWT as RequestHandler];
export const rolesRouter: Router = Router();
rolesRouter.get("/by-org", middlewares, getRolesByOrganization);
rolesRouter.post("/", middlewares, createRole);
rolesRouter.get("/", middlewares, getRoles);
rolesRouter.get("/:id", middlewares, getRoleById);
rolesRouter.put("/", middlewares, updateRole);
rolesRouter.delete("/", middlewares, deleteRole);