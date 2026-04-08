// backend/src/transactions/transactions.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private prisma: PrismaService) {} // inject PrismaService

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserTransactions(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req.user.id;

    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            { fromId: userId },
            { toId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(transactions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to get transactions' });
    }
  }
}