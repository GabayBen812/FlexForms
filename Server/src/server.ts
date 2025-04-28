require("dotenv").config();
import { PrismaClient } from "@prisma/client";
import express, { Express } from "express";
import { usersRouter } from "./routes/user.routes";
import { authRouter } from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import cors from "cors"; // Import the CORS middleware
import { organizationRouter } from "./routes/organization.routes";
import { departmentRouter } from "./routes/departments.routes";
import { locationRouter } from "./routes/locations.routes";
import { callsRouter } from "./routes/calls.routes";
import { rolesRouter } from "./routes/role.routes";
import { permissionRouter } from "./routes/permission.routes";
import { aiRouter } from "./routes/ai.routes";


const app: Express = express();
const port: Number = Number(process.env.PORT) || 3101;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/organizations", organizationRouter);
app.use("/departments", departmentRouter);
app.use("/locations", locationRouter);
app.use("/calls", callsRouter);
app.use("/roles", rolesRouter);
app.use("/permissions", permissionRouter);
app.use("/ai", aiRouter);
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
