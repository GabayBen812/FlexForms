import { prismaClient } from "../prisma";
import { Request, Response } from "express";
import { generateTokensAndSetCookie } from "../utils/authUtils";
import bcrypt from "bcrypt";
export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const foundUser = await prismaClient.user.findFirst({ where: { email } });
    if (!foundUser) return res.status(401).json({ message: "User not found" });
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return res.status(401).json({ message: "סיסמה לא נכונה" });
    const { accessToken, refreshToken } = generateTokensAndSetCookie(
      res,
      foundUser
    );
    const { password: _, ...userWithoutPassword } = foundUser;

    const organization = await prismaClient.organization.findFirst({
      where: {
        organizationRoles: {
          some: { userId: Number(userWithoutPassword.id) },
        },
      },
    });

    return res
      .status(202)
      .json({ accessToken, organization, user: userWithoutPassword });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  const cookies = req.cookies;
  if (!cookies.jwt) return res.sendStatus(204);
  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.status(202).json({ message: "Cookie cleared" });
};
