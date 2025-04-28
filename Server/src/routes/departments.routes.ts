import { RequestHandler, Router } from "express";
import {
  createDepartment,
  getAllDepartments,
  getDepartments,
  deleteDepartment,
  updateDepartment,
} from "../controllers/department.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
const middlewares = [verifyJWT as RequestHandler];
export const departmentRouter: Router = Router();
// prefix /departments
departmentRouter.get("/", middlewares, getDepartments);
departmentRouter.post("/", middlewares, createDepartment);
departmentRouter.delete("/", middlewares, deleteDepartment);
departmentRouter.put("/", middlewares, updateDepartment);
