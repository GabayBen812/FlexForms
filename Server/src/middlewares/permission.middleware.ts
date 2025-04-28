import { Response, NextFunction } from "express";
import { ExtendedRequest } from "../types/users/usersRequests";

export const checkPermission = (
  resource: string,
  action: "canView" | "canCreate" | "canUpdate" | "canDelete"
) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const userRoles = user.organizationRoles;

      const hasPermission = userRoles.some((orgRole) =>
        orgRole.permissions.some(
          (perm) => perm.resource === resource && perm[action]
        )
      );
      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};
