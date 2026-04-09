// backend/src/users/users.controller.ts

import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  /**
   * Protected route to get the authenticated user's dashboard
   * Requires JWT authentication
   * @param req - Express request object, augmented with user info
   */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() req: Request & { user: any }) {
    const userId = req.user.id;

    // Fetch user information along with their accounts from the database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            balance: true,
          },
        },
      },
    });

    if (!user) throw new Error('User not found');

    // Calculate total balance across all user accounts
    const totalBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      email: user.email,
      createdAt: user.createdAt,
      balance: totalBalance.toFixed(2), // Format balance as string with 2 decimals
      accountId: user.accounts[0]?.id,  // Return the first account ID, if exists
    };
  }
}