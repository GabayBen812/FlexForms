import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "מייל לא נמצא" });

  const isMatch = await bcrypt.compare(password, user.password ? user.password : "");
  if (!isMatch) return res.status(401).json({ error: "סיסמה שגויה" });

  const token = jwt.sign(
    { UserInfo: { id: user._id, email: user.email } },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "2h" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 2,
  });

  return res.status(200).json({ message: "התחברת בהצלחה" });
};
