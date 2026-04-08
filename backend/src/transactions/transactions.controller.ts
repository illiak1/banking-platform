// backend/src/transactions/transactions.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Body, Post } from '@nestjs/common';

@Controller('transactions')
export class TransactionsController {
  constructor(private prisma: PrismaService) {} // inject PrismaService

  @UseGuards(JwtAuthGuard)
@Get()
async getUserTransactions(@Req() req: AuthenticatedRequest, @Res() res: Response) {
  const userId = req.user.id;

  try {
    // ✅ get user's account
    const account = await this.prisma.account.findFirst({
      where: { userId },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // ✅ now filter by account ID
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromId: account.id },
          { toId: account.id },
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

@Post('transfer')
@UseGuards(JwtAuthGuard)
async transfer(
  @Req() req: AuthenticatedRequest,
  @Body() body: { toEmail: string; amount: number }
) {
  const fromUserId = req.user.id;

  const fromAccount = await this.prisma.account.findFirst({
    where: { userId: fromUserId },
  });

  const toUser = await this.prisma.user.findUnique({
    where: { email: body.toEmail },
    include: { accounts: true },
  });

  if (!fromAccount || !toUser || toUser.accounts.length === 0) {
    throw new Error('Invalid accounts');
  }

  const toAccount = toUser.accounts[0];

  if (fromAccount.balance < body.amount) {
    throw new Error('Insufficient funds');
  }

  // transaction (atomic)
  await this.prisma.$transaction([
    this.prisma.account.update({
      where: { id: fromAccount.id },
      data: { balance: { decrement: body.amount } },
    }),
    this.prisma.account.update({
      where: { id: toAccount.id },
      data: { balance: { increment: body.amount } },
    }),
    this.prisma.transaction.create({
      data: {
        amount: body.amount,
        fromId: fromAccount.id,
        toId: toAccount.id,
      },
    }),
  ]);

  return { message: 'Transfer successful' };
}

}

