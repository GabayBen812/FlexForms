import { RequestHandler, Router } from "express";
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getUsersWithRoles,
  adminUpdateUser,
} from "../controllers/users.controller";

import { verifyJWT } from "../middlewares/JTW.middleware";
export const usersRouter: Router = Router();

const middlewares = [verifyJWT as RequestHandler];

usersRouter.get("/", middlewares, getAllUsers);
usersRouter.post("/", createUser);
usersRouter.put("/", middlewares, updateUser);
usersRouter.delete("/:id", deleteUser);
usersRouter.get("/find", middlewares, getUser);
usersRouter.get("/roles", middlewares, getUsersWithRoles);
usersRouter.put("/:id", adminUpdateUser);