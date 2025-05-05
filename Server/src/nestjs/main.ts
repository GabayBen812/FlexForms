import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  console.log('MONGODB_URI =', JSON.stringify(process.env.MONGODB_URI));

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT || 3101);
}
bootstrap();
