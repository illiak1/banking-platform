// backend/src/main.ts

import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as dotenv from 'dotenv';
import { PrismaService } from '../prisma/prisma.service';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

dotenv.config(); // Load environment variables from .env file

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy backend/.env.example to backend/.env and fill it in.`,
    );
  }
  return value;
}

async function bootstrap() {
  // Fail loudly at boot. A missing JWT_SECRET used to surface much later as an
  // opaque 403 on every protected route, which is a miserable thing to debug.
  requireEnv('DATABASE_URL');
  requireEnv('JWT_SECRET');

  const app = await NestFactory.create(AppModule);

  // Binds TransactionsGateway's Socket.IO server to this same HTTP server
  // (same port, same process) instead of leaving it to Nest's default —
  // explicit here because the CORS_ORIGIN load-order caveat on the gateway
  // itself (see its file) makes "which server is this actually attached to"
  // worth stating rather than assuming.
  app.useWebSocketAdapter(new IoAdapter(app));

  // Without this the browser blocks every request from the dev server, because
  // the frontend runs on a different port. Origins are configurable so a deployed
  // frontend does not require a code change.
  const corsOrigins = (
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties that have no decorator on the DTO...
      whitelist: true,
      // ...and reject the request outright if any were sent.
      forbidNonWhitelisted: true,
      // Turn the plain JSON body into a real DTO instance so validators run.
      transform: true,
      // Implicit conversion is deliberately off: with it enabled, a string
      // "abc" in a numeric field silently becomes NaN instead of being rejected.
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Connect Prisma service to the database
  const prisma = app.get(PrismaService);
  await prisma.$connect();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
