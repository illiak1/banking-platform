// backend/src/auth/auth.controller.ts

import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user
   * @param body - Contains email and password for registration
   * @param res - Express response object to send HTTP response
   */
  @Post('register')
  async register(
    @Body() body: { email: string; password: string },
    @Res() res: Response
  ) {
    try {
      // Call AuthService to handle registration logic
      const response = await this.authService.register(body.email, body.password);
      res.status(201).json(response); // Respond with created status and data
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message }); // Return error message on failure
    }
  }

  /**
   * Logs in an existing user
   * @param body - Contains email and password for login
   * @param res - Express response object to send HTTP response
   */
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response
  ) {
    // Call AuthService to handle login logic
    const response = await this.authService.login(body.email, body.password);
    res.status(201).json(response); // Respond with success and user data/token
  }
}