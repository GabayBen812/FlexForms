require("dotenv").config();
import express, { Express } from "express";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/users.routes";
import cookieParser from "cookie-parser";
import cors from "cors";

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
app.use("/users", userRouter);
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
