import { RequestHandler, Router } from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
} from "../controllers/organization.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
export const organizationRouter: Router = Router();

organizationRouter.post("/", verifyJWT as RequestHandler, createOrganization);
organizationRouter.get("/", verifyJWT as RequestHandler, getOrganizations);
organizationRouter.put("/", verifyJWT as RequestHandler, updateOrganization);

organizationRouter.get("/find", verifyJWT as RequestHandler, getOrganization);
