import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { ValidationPipe, BadRequestException } from "@nestjs/common";
import * as dotenv from "dotenv";
dotenv.config();

async function bootstrap() {
  console.log("MONGODB_URI =", JSON.stringify(process.env.MONGODB_URI));

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          return Object.values(constraints).join(', ');
        });
        console.error('Validation errors:', JSON.stringify(errors, null, 2));
        return new BadRequestException({
          message: messages.join('; '),
          errors,
        });
      },
    })
  );

  const explicitOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:8081",
    "https://www.Paradize-erp.com",
    "https://Paradize-erp.com",
  ]);

  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => explicitOrigins.add(value));
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => explicitOrigins.add(value));
  }

  app.enableCors({
    origin: (origin, callback) => {
      console.log("Incoming request from origin:", origin);
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (explicitOrigins.has(origin)) return callback(null, true);
      // Allow all Vercel preview and production URLs
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow Firebase Storage
      if (origin.startsWith("https://firebasestorage"))
        return callback(null, true);

      console.log("CORS blocked for origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const port = 3101;
  console.log("Listening on port:", port);
  console.log("Listening on CLIENT_URL:", process.env.CLIENT_URL);
  console.log("Listening on NODE_ENV:", process.env.NODE_ENV);
  console.log("Listening on MONGODB_URI:", process.env.MONGODB_URI);
  await app.listen(port);
}
bootstrap();
