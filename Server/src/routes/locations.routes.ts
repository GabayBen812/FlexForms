import { Router, RequestHandler } from "express";
import {
  createLocation,
  getAllLocations,
  getLocations,
  deleteLocation,
  updateLocation,
} from "../controllers/location.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const middlewares = [verifyJWT as RequestHandler];
export const locationRouter = Router();

locationRouter.get("/", middlewares, asyncHandler(getLocations));
locationRouter.get("/find", middlewares, asyncHandler(getLocations));
locationRouter.post("/", middlewares, asyncHandler(createLocation));
locationRouter.delete("/", middlewares, asyncHandler(deleteLocation));
locationRouter.put("/", middlewares, asyncHandler(updateLocation));
