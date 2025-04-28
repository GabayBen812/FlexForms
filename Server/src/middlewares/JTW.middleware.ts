import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";

export const verifyJWT = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.url, "req.url");

    const token = req.cookies?.access_token || req.headers?.authorization;

    if (!token) return res.status(401).json({ message: "Unauthorized JWT" });

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      return res.status(500).json({
        message: "Internal Server Error: Missing access token secret",
      });
    }

    jwt.verify(token, secret, async (err: any, decoded: any) => {
      if (err)
        return res.status(403).json({ message: "Forbidden: Invalid Token" });

      const userId = decoded.UserInfo?.id;
      if (!userId)
        return res.status(401).json({ message: "Unauthorized: No user ID" });

      // const userRoles = await prismaClient.organizationRole.findMany({
      //   where: { userId },
      //   include: {
      //     role: { include: { permissions: true } },
      //   },
      // });

      req.user = {
        id: userId,
        email: decoded.UserInfo?.email,
        name: decoded.UserInfo?.name,
        username: decoded.UserInfo?.username,
        organizationRoles: [],
        // organizationRoles: userRoles.map((orgRole) => ({
        //   organizationId: orgRole.organizationId,
        //   roleId: orgRole.roleId,
        //   permissions: orgRole.role.permissions,
        // })),
      };

      next();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
