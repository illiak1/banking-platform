// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    // Five attempts per minute per IP. The default storage is in-process, so the
    // limit is per instance — fine for a single-node deployment. Running more
    // than one instance would need a shared store (the Redis service already in
    // docker-compose.yml is the natural home for it).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  // PrismaService is not listed here: PrismaModule is @Global(), so injecting it
  // directly reuses the single client. Re-providing it locally, as this module
  // used to, built a second PrismaClient with its own connection pool.
  providers: [AuthService],
})
export class AuthModule {}
