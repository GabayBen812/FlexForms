import { prismaClient } from "../prisma";
import { Response } from "express";
import { ExtendedRequest } from "../types/users/usersRequests";
export const createOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const userId = req.user?.id;
  const { name } = req.body;

  if (!userId)
    return res.status(400).json({ message: "Missing required fields: userId" });
  if (!name)
    return res.status(400).json({ message: "Missing required fields: name" });

  try {
    const result = await prismaClient.$transaction(async (prisma) => {
      const existingOrganization = await prisma.organization.findFirst({
        where: {
          name,
          ownerId: userId,
        },
      });
      if (existingOrganization) {
        throw new Error("שם הארגון כבר קיים תחת המשתמש הזה");
      }

      // ✅ Step 2: Create the organization
      const organization = await prisma.organization.create({
        data: {
          name,
          ownerId: userId,
          customStyles: {}, // Default empty JSON
          logo: "",
          years: [],
        },
      });

      const role = await prisma.role.create({
        data: {
          name: { he: "מנהל", en: "Owner" },
          organizationId: organization.id,
        },
      });

      await prisma.organizationRole.create({
        data: {
          organizationId: organization.id,
          userId,
          roleId: role.id,
        },
      });

      const allPermissions = [
        "organizations",
        "departments",
        "calls",
        "callCategories",
        "site",
      ];
      const permissionsData = allPermissions.map((resource) => ({
        roleId: role.id,
        resource,
        canView: true,
        canUpdate: true,
        canCreate: true,
      }));

      await prisma.permission.createMany({ data: permissionsData });

      return { organization, role };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating organization:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the organization" });
  }
};

export const updateOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const { organizationId, name, customStyles, logo, years } = req.body;

    if (!organizationId)
      return res.status(400).json({ message: "organizationId is required" });

    // Ensure the user is authorized to update the organization
    const organization = await prismaClient.organization.findUnique({
      where: { id: organizationId },
      include: { owner: true },
    });

    if (!organization)
      return res.status(404).json({ message: "Organization not found" });

    if (organization.ownerId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to update this organization",
      });
    }

    // Update the organization
    const updatedOrganization = await prismaClient.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        ...(customStyles && { customStyles }),
        ...(logo && { logo }),
        ...(years && { years }),
      },
    });

    return res.status(200).json({
      message: "Organization updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the organization" });
  }
};

export const getOrganizations = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const id = req.user?.id;
  if (!id) return res.status(400).json({ message: "id is required" });

  const organizations = await prismaClient.organization.findMany({
    where: { organizationRoles: { some: { userId: Number(id) } } },
  });

  return res.status(200).json(organizations);
};

export const getOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const id = req.user?.id;
  const orgId = Number(req.query.organizationId);

  if (!id) return res.status(400).json({ message: "id is required" });
  if (!orgId) return res.status(400).json({ message: "orgId is required" });

  const organization = await prismaClient.organization.findFirst({
    where: { id: orgId, AND: { organizationRoles: { some: { userId: id } } } },
  });
  if (!organization)
    return res.status(404).json({ message: "Organization not found" });

  const result = {
    ...organization,
  };
  return res.status(200).json(result);
};
