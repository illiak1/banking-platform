import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() req: Request & { user: any }) {
    const userId = req.user.id;
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
}
    });

    if (!user) throw new Error('User not found');

    const totalBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    return {
  email: user.email,
  createdAt: user.createdAt,
  balance: totalBalance.toFixed(2),
  accountId: user.accounts[0]?.id,
};
  }
}