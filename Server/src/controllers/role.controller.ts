import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";

export const createRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, organizationId } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Valid role name is required" });
    }

    if (!organizationId || typeof organizationId !== "number") {
      return res
        .status(400)
        .json({ error: "Valid organization ID is required" });
    }

    const organization = await prismaClient.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Create the role
    const role = await prismaClient.role.create({
      data: {
        name,
        organizationId,
      },
    });

    return res.status(201).json(role);
  } catch (error) {
    console.error("Error creating role:", error);
    return res.status(500).json({ error: "Failed to create role" });
  }
};

export const getRolesByOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const organizationId = parseInt(req.query.id);
  if (isNaN(organizationId))
    return res.status(400).json({ message: "Invalid organization ID" });
  try {
    const roles = await prismaClient.role.findMany({
      where: { organizationId },
      include: {
        permissions: true,
      },
    });
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error in getRoles:", error);
    return res.status(500).json({ error: "Failed to fetch roles" });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, id: roleId } = req.body;

    if (isNaN(roleId))
      return res.status(400).json({ error: "Invalid role ID" });

    if (!name)
      return res.status(400).json({ error: "Valid role name is required" });

    // Check if role exists
    const existingRole = await prismaClient.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) return res.status(404).json({ error: "Role not found" });

    const updatedRole = await prismaClient.role.update({
      where: { id: roleId },
      data: { name },
    });

    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: "Failed to update role" });
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const roleId = Number(req.query.id);

    if (isNaN(roleId))
      return res.status(400).json({ error: "Invalid role ID" });

    const role = await prismaClient.role.findUnique({
      where: { id: roleId },
      include: { organizationRoles: true },
    });

    if (!role) return res.status(404).json({ error: "Role not found" });

    if (role.organizationRoles.length > 0)
      return res.status(400).json({
        error: "Cannot delete role that is assigned to users",
      });

    await prismaClient.permission.deleteMany({
      where: { roleId },
    });

    // Delete the role
    await prismaClient.role.delete({
      where: { id: roleId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting role:", error);
    return res.status(500).json({ error: "Failed to delete role" });
  }
};

export const getRoleById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const roleId = Number(req.query.id);

  if (isNaN(roleId))
    return res.status(400).json({ message: "Invalid role ID" });
  try {
    const role = await prismaClient.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
      },
    });
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.status(200).json(role);
  } catch (error) {
    console.error("Error in getRole:", error);
    return res.status(500).json({ error: "Failed to fetch role" });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { organizationId, page, pageSize, search, sortField, sortDirection } =
      req.query;

    const organizationIdNumber = Number(organizationId);
    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSizeNumber = pageSize
      ? parseInt(pageSize as string, 10)
      : undefined;
    const skip =
      pageNumber && pageSizeNumber
        ? (pageNumber - 1) * pageSizeNumber
        : undefined;
    const take = pageSizeNumber;

    const whereClause = {
      organizationId: organizationIdNumber,
      ...(search && {
        name: {
          path: "$.he",
          string_contains: search as string,
          mode: "insensitive",
        },
      }),
    };

    const orderByClause = sortField
      ? { [sortField as string]: sortDirection || "asc" }
      : undefined;

    console.log("whereClause:", whereClause);

    const [totalCount, rolesWithUserCount] = await prismaClient.$transaction([
      prismaClient.role.count({
        where: whereClause,
      }),
      prismaClient.role.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          organizationId: true,
          organizationRoles: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              organizationRoles: true,
            },
          },
        },
        skip,
        take,
        orderBy: orderByClause,
      }),
    ]);

    const formattedRoles = rolesWithUserCount.map((role) => ({
      ...role,
      userCount: role._count.organizationRoles,
    }));

    res.status(200).json({
      data: formattedRoles,
      totalCount,
    });
  } catch (error) {
    console.error("Error in getRoles:", error);
    res.status(500).json({ message: "Server error" });
  }
};
