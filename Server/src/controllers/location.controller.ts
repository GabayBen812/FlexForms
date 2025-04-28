import { prismaClient } from "../prisma";
import { Response } from "express";
import { ExtendedRequest } from "../types/users/usersRequests";
import { getDynamicData } from "../utils/dynamicData";

export const createLocation = async (req: ExtendedRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, organizationId, roomNumber } = req.body;
  delete req.body.id;

  if (!userId || !organizationId || !name || typeof name !== "object") {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const location = await prismaClient.location.create({
      data: {
        name,
        roomNumber: roomNumber ?? null,
        organization: { connect: { id: organizationId } },
      },
    });

    return res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllLocations = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await prismaClient.location.findMany();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAllLocations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLocations = async (req: ExtendedRequest, res: Response) => {
  return getDynamicData(req, res, {
    model: "location",
    searchFields: [
      { path: "$.he", field: "name" },
      { path: "$.en", field: "name" },
    ],
    filters: ["roomNumber"],
    defaultSortField: "name",
  });
};

export const deleteLocation = async (req: ExtendedRequest, res: Response) => {
  //@ts-ignore
  const { locationId } = req.query;
  try {
    await prismaClient.location.delete({
      where: { id: Number(locationId) },
    });

    res.status(200).json({ message: "Location deleted" });
  } catch (error) {
    console.error("Error in deleteLocation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateLocation = async (req: ExtendedRequest, res: Response) => {
  const { name, organizationId, roomNumber, id } = req.body;

  try {
    await prismaClient.location.update({
      where: { id: Number(id) },
      data: {
        name,
        roomNumber: roomNumber ?? null,
        organization: { connect: { id: organizationId } },
      },
    });

    res.status(200).json({ message: "Location updated" });
  } catch (error) {
    console.error("Error in updateLocation:", error);
    res.status(500).json({ message: "Server error" });
  }
};
