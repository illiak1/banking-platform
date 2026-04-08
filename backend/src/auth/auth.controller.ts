// backend/src/auth/auth.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
async register(@Body() body: { email: string; password: string }, @Res() res: Response) {
  try {
    const response = await this.authService.register(body.email, body.password);
    res.status(201).json(response);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
}

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res() res: Response) {
    const response = await this.authService.login(body.email, body.password);

    // Возвращаем JSON с отступами, используя res.json
    res.status(201).json(response);  // Просто возвращаем response, NestJS сам сделает форматирование
  }
}