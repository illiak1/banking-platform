// backend/src/main.ts

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { PrismaService } from '../prisma/prisma.service';

dotenv.config(); // Load environment variables from .env file

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect Prisma service to the database
  const prisma = app.get(PrismaService);
  await prisma.$connect();

  await app.listen(3000); // Start the server on port 3000
  console.log('Backend running on http://localhost:3000');
}

bootstrap();