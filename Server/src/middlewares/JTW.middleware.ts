import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const verifyJWT: RequestHandler = (req, res, next) => {
  try {
    const token =
      req.cookies?.jwt || req.cookies?.access_token || req.headers?.authorization;
      

    if (!token) {
      res.status(401).json({ message: "Missing token" });
      return;
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      res.status(500).json({ message: "Missing secret" });
      return;
    }

    const decoded = jwt.verify(token, secret) as {
      UserInfo?: { id: string; email: string };
    };

    const userInfo = decoded?.UserInfo;
    if (!userInfo?.id || !userInfo?.email) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.user = {
      id: userInfo.id,
      email: userInfo.email,
    };

    next();
  } catch (err) {
    res.status(403).json({ message: "Token verification failed" });
  }
};
