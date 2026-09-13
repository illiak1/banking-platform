// backend/src/auth/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginDto } from '../common/dto/login.dto';
import { RegisterDto } from '../common/dto/register.dto';
import { AuthService } from './auth.service';

/**
 * Both endpoints are rate limited. Login is the obvious target — without a limit
 * an attacker can grind credentials indefinitely — but register is limited too,
 * because each call runs a bcrypt hash and is therefore a cheap way to burn CPU.
 *
 * Responses are returned directly rather than written through an injected `@Res()`
 * object. Using `@Res()` opts out of Nest's response pipeline, which is what made
 * the previous error handling inconsistent; returning plain values lets
 * AllExceptionsFilter shape every failure the same way.
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  /** 200, not Nest's default 201 — logging in does not create a resource. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
