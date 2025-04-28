import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import { CreateUserRequest } from "../types/users/usersRequests";
import {
  generateTokensAndSetCookie,
  getValidUsername,
} from "../utils/authUtils";
import { ExtendedRequest } from "../types/users/usersRequests";
import bcrypt from "bcrypt";
import { getDynamicData } from "../utils/dynamicData";
export const getAllUsers = async (
  req: ExtendedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await prismaClient.user.findMany({
      include: {
        organizationRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsersWithRoles = async (
  req: ExtendedRequest,
  res: Response
): Promise<void> => {
  return getDynamicData(req, res, {
    model: "user",
    defaultSortField: "id",
    include: {
      organizationRoles: {
        include: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    searchFields: [
      { path: "", field: "username" },
      { path: "", field: "email" },
      { path: "", field: "name" },
    ],
    filters: ["userType"],
  });
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    username,
    name,
    email,
    userType,
    password,
    organizationId,
    roleName,
    logo
  }: CreateUserRequest = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  try {
    const existingUser = await prismaClient.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const validUsername = await getValidUsername(username, email);

    const newUser = await prismaClient.user.create({
      data: {
        username: validUsername,
        name,
        email,
        userType,
        password: hashedPassword,
        logo: logo ? logo : "",
      },
    });

    const role = await prismaClient.role.findFirst({
      where: {
        organizationId,
        name: {
          path: ["en"],
          equals: roleName,
        },
      },
    });

    if (!role) {
      res.status(400).json({ message: "Role not found for this organization" });
    }

    const roleId = role ? role.id : undefined;
    if (roleId) {
      await prismaClient.organizationRole.create({
        data: {
          userId: newUser.id,
          organizationId,
          roleId: roleId,
        },
      });

      generateTokensAndSetCookie(res, newUser);
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({ user: userWithoutPassword });
    }
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminUpdateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, password, logo } = req.body;

  if (!id) {
    res.status(400).json({ message: "Missing user ID" });
    return;
  }

  try {
    const data: any = {};

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (logo !== undefined) data.logo = logo;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }

    const updatedUser = await prismaClient.user.update({
      where: { id: Number(id) },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        userType: true,
        logo: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in adminUpdateUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUser = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.user;

  try {
    const result = await prismaClient.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        userType: true,
        password: false,
      },
    });
    if (!result) res.status(404).json({ message: "User not found" });
    else res.status(200).json(result);
  } catch (error) {
    console.error("Error in getUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateUser = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.user;
  const { name, email, password, oldPassword } = req.body;

  try {
    if (!name && !email && !password)
      return res.status(400).json({ message: "No fields to update provided" });

    // Fetch the user's current data
    const currentUser = await prismaClient.user.findUnique({
      where: { id: Number(id) },
    });

    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    // Check if the email is already in use by another user
    if (email) {
      const existingUser = await prismaClient.user.findFirst({
        where: { email, id: { not: Number(id) } },
      });

      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });
    }

    // Construct the data object dynamically
    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;

    // Handle password update
    if (password) {
      if (!oldPassword) {
        return res
          .status(400)
          .json({ message: "Old password is required to update password" });
      }

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        currentUser.password
      );

      if (!isOldPasswordValid)
        return res.status(400).json({ message: "Old password is incorrect" });

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }

    // Perform the update
    const updatedUser = await prismaClient.user.update({
      where: { id: Number(id) },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        userType: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Missing user ID" });
    return;
  }

  try {
    const userId = Number(id);

    await prismaClient.organizationRole.deleteMany({
      where: { userId },
    });

    const deleted = await prismaClient.user.delete({
      where: { id: userId },
    });

    res
      .status(200)
      .json({ message: "User deleted successfully", deletedUserId: deleted.id });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
