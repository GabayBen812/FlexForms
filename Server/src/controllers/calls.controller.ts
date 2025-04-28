import { prismaClient } from "../prisma";
import { Request, Response, RequestHandler } from "express";
import { deleteImage } from "../utils/supabaseUtils";
import { getDynamicData } from "../utils/dynamicData";
import { ExtendedRequest } from "../types/users/usersRequests";

export const createNewCallCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { name, organizationId, logo, departmentId } = req.body;
  if (!name)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const callCategory = await prismaClient.callCategory.create({
      data: {
        name,
        organization: { connect: { id: organizationId } },
        logo: logo || "",
        department: { connect: { id: departmentId } },
      },
    });

    res.status(200).json(callCategory);
  } catch (error) {
    console.error("Error in createNewCallCategory:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCallCategories = async (
  req: ExtendedRequest,
  res: Response
) => {
  return getDynamicData(req, res, {
    model: "callCategory",
    searchFields: [
      { path: "$.he", field: "name" },
      { path: "$.en", field: "name" },
    ],
    include: { department: true },
    defaultSortField: "name",
  });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.query;

  try {
    // Fetch the category to get the logo
    const category = await prismaClient.callCategory.findUnique({
      where: { id: Number(id) },
      select: { logo: true }, // Only fetch the logo field
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Delete the logo if it exists
    if (category.logo) {
      await deleteImage(category.logo);
    }

    // Delete the category
    await prismaClient.callCategory.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: ExtendedRequest, res: Response) => {
  const { name, logo, id, departmentId } = req.body;
  try {
    const result = await prismaClient.callCategory.update({
      where: { id: Number(id) },
      data: {
        name,
        logo: logo || "",
        department: { connect: { id: departmentId } },
      },
    });
    if (!result) res.status(404).json({ message: "Category not updated" });
    else res.status(200).json({ message: "Category updated" });
  } catch (error) {
    console.error("Error in updateCategory:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCalls: RequestHandler = async (req, res) => {
  const { organizationId } = req.query;

  if (!organizationId) {
    res.status(400).json({ message: "Missing organizationId" });
    return;
  }

  try {
    const calls = await prismaClient.call.findMany({
      where: { organizationId: Number(organizationId) },
    });

    res.status(200).json(calls); // ✅ Don't return this
  } catch (error) {
    console.error("Error in getCalls:", error);
    res.status(500).json({ message: "Server error" });
  }
};
