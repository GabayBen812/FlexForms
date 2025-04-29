import express from "express";
import { getCurrentUser } from "../controllers/users.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";

const router = express.Router();

router.get("/find", verifyJWT, getCurrentUser);

export default router;
