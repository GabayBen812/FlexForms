import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  console.log('MONGODB_URI =', JSON.stringify(process.env.MONGODB_URI));

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow all Vercel preview and production URLs
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow localhost for local dev
      if (origin === 'http://localhost:5173') return callback(null, true);
      // Otherwise, block
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const port = 3101;
  console.log('Listening on port:', port);
  console.log('Listening on CLIENT_URL:', process.env.CLIENT_URL);
  console.log('Listening on NODE_ENV:', process.env.NODE_ENV);
  console.log('Listening on MONGODB_URI:', process.env.MONGODB_URI);
  await app.listen(port);
}
bootstrap();
