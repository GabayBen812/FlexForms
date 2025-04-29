import express from "express";
import { loginUser } from "../controllers/auth.controller";

const router = express.Router();

router.post("/login", (req, res) => {
  void loginUser(req, res);
});

export default router;
