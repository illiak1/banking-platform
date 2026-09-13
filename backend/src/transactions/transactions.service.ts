import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferDto } from '../common/dto/transfer.dto';
import { TransactionsGateway } from './transactions.gateway';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TransactionsGateway,
  ) {}

  /**
   * Ledger entries where the caller's account is either side of the transfer.
   *
   * Includes the counterparty's email on each row. The old shape (just
   * fromId/toId) made a "filter by recipient" feature impossible on the
   * frontend — there was no email to filter by, only opaque account ids.
   */
  async findForUser(userId: number) {
    const account = await this.prisma.account.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const rows = await this.prisma.transaction.findMany({
      where: { OR: [{ fromId: account.id }, { toId: account.id }] },
      orderBy: { createdAt: 'desc' },
      include: {
        from: { select: { user: { select: { email: true } } } },
        to: { select: { user: { select: { email: true } } } },
      },
    });

    return rows.map((tx) => {
      const direction = tx.fromId === account.id ? 'OUT' : 'IN';
      return {
        id: tx.id,
        amount: tx.amount,
        createdAt: tx.createdAt,
        fromId: tx.fromId,
        toId: tx.toId,
        direction,
        counterpartyEmail: direction === 'OUT' ? tx.to.user.email : tx.from.user.email,
      };
    });
  }

  /**
   * Move money between two accounts atomically.
   *
   * The previous implementation read the sender's balance with `findFirst`,
   * compared it in JavaScript, and only then opened the transaction. That is a
   * time-of-check to time-of-use race: two concurrent requests both read the same
   * balance, both pass the check, and both commit, overdrawing the account.
   *
   * Here the check *is* the write. `updateMany` with `balance: { gte: amount }`
   * compiles to a single `UPDATE ... WHERE id = ? AND balance >= ?` statement, so
   * PostgreSQL evaluates the predicate against the row it is already locking. A
   * concurrent transfer that drains the account first makes this match zero rows,
   * and `count === 0` becomes the insufficient-funds signal. No window exists
   * between deciding and acting.
   *
   * The `check_nonnegative_balance` CHECK constraint added alongside this method
   * is the belt-and-braces backstop: even if this logic is bypassed, the database
   * refuses to store a negative balance.
   *
   * Once the transaction commits, both sides are notified over WebSockets
   * (TransactionsGateway) so an open Dashboard updates without a manual
   * refresh. That emit happens after `$transaction` resolves, deliberately
   * outside the callback — see the comment on the emit itself.
   */
  async transfer(fromUserId: number, dto: TransferDto) {
    const committed = await this.prisma.$transaction(async (tx) => {
      const fromAccount = await tx.account.findFirst({
        where: { userId: fromUserId },
        select: { id: true, user: { select: { email: true } } },
      });

      if (!fromAccount) {
        throw new NotFoundException('Sender account not found');
      }

      const recipient = await tx.user.findUnique({
        where: { email: dto.toEmail },
        select: { id: true, accounts: { select: { id: true }, take: 1 } },
      });

      if (!recipient || recipient.accounts.length === 0) {
        throw new NotFoundException('Recipient account not found');
      }

      const toAccount = recipient.accounts[0];

      // Without this guard a self-transfer nets to zero but still writes a
      // misleading ledger row, and the decrement/increment pair would contend
      // with itself for the same row lock.
      if (toAccount.id === fromAccount.id) {
        throw new BadRequestException('Cannot transfer to your own account');
      }

      // The funds check IS the WHERE clause (not a prior read), so the row lock
      // and the check happen atomically — closes the race described above.
      const debited = await tx.account.updateMany({
        where: { id: fromAccount.id, balance: { gte: dto.amount } },
        data: { balance: { decrement: dto.amount } },
      });

      if (debited.count === 0) {
        // Throwing inside the interactive transaction rolls back everything.
        throw new BadRequestException('Insufficient funds');
      }

      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: dto.amount } },
      });

      const record = await tx.transaction.create({
        data: {
          amount: dto.amount,
          fromId: fromAccount.id,
          toId: toAccount.id,
        },
      });

      return {
        transactionId: record.id,
        createdAt: record.createdAt,
        fromEmail: fromAccount.user.email,
        toUserId: recipient.id,
      };
    });

    // Fire-and-forget on purpose: a client that is offline or slow to ack
    // must not make the HTTP response to the transfer itself hang, and the
    // money has already safely moved regardless of whether anyone is
    // listening.
    this.gateway.notifyTransfer({
      transactionId: committed.transactionId,
      amount: dto.amount,
      createdAt: committed.createdAt,
      fromUserId,
      fromEmail: committed.fromEmail,
      toUserId: committed.toUserId,
      toEmail: dto.toEmail,
    });

    return { message: 'Transfer successful', transactionId: committed.transactionId };
  }
}
