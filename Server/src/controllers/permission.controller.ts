import { json, Request, Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { Permission } from "@prisma/client";

export const createOrUpdatePermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { roleId, resource, canView, canUpdate, canCreate, canDelete } =
      req.body;

    // Validate inputs
    if (!roleId || typeof roleId !== "number")
      return res.status(400).json({ error: "Valid role ID is required" });

    if (!resource || typeof resource !== "string")
      return res.status(400).json({ error: "Valid resource name is required" });

    const permissions = {
      canView: Boolean(canView ?? false),
      canUpdate: Boolean(canUpdate ?? false),
      canCreate: Boolean(canCreate ?? false),
      canDelete: Boolean(canDelete ?? false),
    };

    const role = await prismaClient.role.findUnique({
      where: { id: roleId },
    });

    if (!role) return res.status(404).json({ error: "Role not found" });

    // Check if permission already exists for this role and resource
    const existingPermission = await prismaClient.permission.findFirst({
      where: {
        roleId,
        resource,
      },
    });

    let permission;

    if (existingPermission) {
      permission = await prismaClient.permission.update({
        where: { id: existingPermission.id },
        data: permissions,
      });

      return res.status(200).json(permission);
    } else {
      permission = await prismaClient.permission.create({
        data: {
          roleId,
          resource,
          ...permissions,
        },
      });

      return res.status(201).json(permission);
    }
  } catch (error) {
    console.error("Error managing permission:", error);
    return res.status(500).json({ error: "Failed to manage permission" });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const permissionId = Number(req.params.id);

    if (isNaN(permissionId))
      return res.status(400).json({ error: "Invalid permission ID" });

    // Check if permission exists
    const permission = await prismaClient.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    // Delete the permission
    await prismaClient.permission.delete({
      where: { id: permissionId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting permission:", error);
    return res.status(500).json({ error: "Failed to delete permission" });
  }
};

export const getPermissions = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const { roleId } = req.query;
  if (!roleId) return res.status(400).json({ error: "Invalid role ID" });
  try {
    const permissions = await prismaClient.permission.findMany({
      where: { roleId: Number(roleId) },
    });
    return res.status(200).json(permissions);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

export const updatePermission = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const { id, canCreate, canDelete, canUpdate, canView, resource } =
    req.body as Permission;
  if (!id) return res.status(400).json({ error: "Invalid permission ID" });
  try {
    const updatedPermission = await prismaClient.permission.update({
      where: { id: id },
      data: {
        canCreate,
        canDelete,
        canUpdate,
        canView,
        resource,
      },
    });
    return res.status(200).json(updatedPermission);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update permission" });
  }
};
