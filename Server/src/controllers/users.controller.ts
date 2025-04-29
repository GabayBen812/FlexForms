import { Request, Response } from "express";

export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  res.status(200).json({ user: req.user });
};
