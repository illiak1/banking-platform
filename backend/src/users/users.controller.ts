// backend/src/users/users.controller.ts

import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SearchUserDto } from '../common/dto/search-user.dto';
import type { AuthenticatedRequest } from '../types/express';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  /**
   * Protected route to get the authenticated user's dashboard
   * Requires JWT authentication
   */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() req: AuthenticatedRequest) {
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

    // A plain `throw new Error(...)` here surfaced as 500 Internal Server Error.
    // The token was valid but the user row is gone, which is a 404.
    if (!user) throw new NotFoundException('User not found');

    // Calculate total balance across all user accounts
    const totalBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      email: user.email,
      createdAt: user.createdAt,
      balance: totalBalance.toFixed(2), // Format balance as string with 2 decimals
      accountId: user.accounts[0]?.id, // Return the first account ID, if exists
    };
  }

  /**
   * Lets the transfer form confirm a recipient exists before the caller submits
   * money — catching a typo'd email before the transfer, not after it fails.
   *
   * Deliberately returns only booleans, never the recipient's own data (name,
   * balance, account id, ...): an authenticated user can otherwise use this as
   * an oracle to enumerate which emails are registered, so the response is
   * kept to the minimum needed for the UI to do its job.
   */
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchByEmail(@Query() dto: SearchUserDto, @Req() req: AuthenticatedRequest) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { email: true },
    });

    return {
      exists: !!user,
      isSelf: user?.email === req.user.email,
    };
  }
}
