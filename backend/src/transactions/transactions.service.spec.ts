import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferDto } from '../common/dto/transfer.dto';
import { TransactionsGateway } from './transactions.gateway';
import { TransactionsService } from './transactions.service';

function createGatewayMock() {
  return { notifyTransfer: jest.fn() };
}

/**
 * Minimal stand-in for the Prisma transaction client. `$transaction` is wired to
 * invoke the callback with this same object, which is what lets us assert on the
 * exact queries the service issues.
 */
function createPrismaMock() {
  const tx = {
    account: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    transaction: {
      create: jest.fn().mockResolvedValue({ id: 99 }),
      findMany: jest.fn(),
    },
  };

  return {
    tx,
    prisma: {
      ...tx,
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    },
  };
}

function transferDto(overrides: Partial<TransferDto> = {}): TransferDto {
  return Object.assign(new TransferDto(), {
    toEmail: 'recipient@example.com',
    amount: 100,
    ...overrides,
  });
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mock: ReturnType<typeof createPrismaMock>;
  let gateway: ReturnType<typeof createGatewayMock>;

  beforeEach(async () => {
    mock = createPrismaMock();
    gateway = createGatewayMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mock.prisma },
        { provide: TransactionsGateway, useValue: gateway },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
  });

  describe('transfer', () => {
    beforeEach(() => {
      mock.tx.account.findFirst.mockResolvedValue({
        id: 1,
        user: { email: 'sender@example.com' },
      });
      mock.tx.user.findUnique.mockResolvedValue({ id: 20, accounts: [{ id: 2 }] });
      mock.tx.account.updateMany.mockResolvedValue({ count: 1 });
    });

    it('debits, credits and records the ledger entry on success', async () => {
      const result = await service.transfer(10, transferDto({ amount: 250 }));

      expect(mock.tx.account.updateMany).toHaveBeenCalledWith({
        where: { id: 1, balance: { gte: 250 } },
        data: { balance: { decrement: 250 } },
      });
      expect(mock.tx.account.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { balance: { increment: 250 } },
      });
      expect(mock.tx.transaction.create).toHaveBeenCalledWith({
        data: { amount: 250, fromId: 1, toId: 2 },
      });
      expect(result).toEqual({ message: 'Transfer successful', transactionId: 99 });
    });

    it('notifies both sides over the gateway once the transfer commits', async () => {
      mock.tx.transaction.create.mockResolvedValue({
        id: 99,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.transfer(10, transferDto({ amount: 250 }));

      expect(gateway.notifyTransfer).toHaveBeenCalledTimes(1);
      expect(gateway.notifyTransfer).toHaveBeenCalledWith({
        transactionId: 99,
        amount: 250,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        fromUserId: 10,
        fromEmail: 'sender@example.com',
        toUserId: 20,
        toEmail: 'recipient@example.com',
      });
    });

    it('does not notify the gateway when the transfer is rejected', async () => {
      mock.tx.account.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.transfer(10, transferDto())).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(gateway.notifyTransfer).not.toHaveBeenCalled();
    });

    it('guards the debit with a balance predicate rather than a prior read', async () => {
      await service.transfer(10, transferDto({ amount: 75 }));

      // The funds check must live in the WHERE clause, not in a separate read.
      const [call] = mock.tx.account.updateMany.mock.calls;
      expect(call[0].where.balance).toEqual({ gte: 75 });
    });

    it('rejects the transfer when the guarded debit matches no rows', async () => {
      mock.tx.account.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.transfer(10, transferDto())).rejects.toBeInstanceOf(
        BadRequestException,
      );

      // Nothing may be credited or recorded once the debit failed.
      expect(mock.tx.account.update).not.toHaveBeenCalled();
      expect(mock.tx.transaction.create).not.toHaveBeenCalled();
    });

    it('rejects a self-transfer before touching any balance', async () => {
      mock.tx.user.findUnique.mockResolvedValue({ accounts: [{ id: 1 }] });

      await expect(service.transfer(10, transferDto())).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mock.tx.account.updateMany).not.toHaveBeenCalled();
    });

    it('rejects an unknown recipient', async () => {
      mock.tx.user.findUnique.mockResolvedValue(null);

      await expect(service.transfer(10, transferDto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mock.tx.account.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a recipient that exists but has no account', async () => {
      mock.tx.user.findUnique.mockResolvedValue({ accounts: [] });

      await expect(service.transfer(10, transferDto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects when the sender has no account', async () => {
      mock.tx.account.findFirst.mockResolvedValue(null);

      await expect(service.transfer(10, transferDto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('runs every write inside a single transaction', async () => {
      await service.transfer(10, transferDto());
      expect(mock.prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('findForUser', () => {
    it('queries both sides of the ledger for the caller account', async () => {
      mock.prisma.account.findFirst.mockResolvedValue({ id: 7 });
      mock.prisma.transaction.findMany.mockResolvedValue([]);

      await service.findForUser(3);

      expect(mock.prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { OR: [{ fromId: 7 }, { toId: 7 }] },
        orderBy: { createdAt: 'desc' },
        include: {
          from: { select: { user: { select: { email: true } } } },
          to: { select: { user: { select: { email: true } } } },
        },
      });
    });

    it('labels the caller as OUT and attaches the recipient email', async () => {
      mock.prisma.account.findFirst.mockResolvedValue({ id: 7 });
      mock.prisma.transaction.findMany.mockResolvedValue([
        {
          id: 1,
          amount: 50,
          createdAt: new Date('2026-01-01'),
          fromId: 7,
          toId: 9,
          from: { user: { email: 'me@example.com' } },
          to: { user: { email: 'them@example.com' } },
        },
      ]);

      const [result] = await service.findForUser(3);

      expect(result).toMatchObject({
        direction: 'OUT',
        counterpartyEmail: 'them@example.com',
      });
    });

    it('labels the caller as IN and attaches the sender email', async () => {
      mock.prisma.account.findFirst.mockResolvedValue({ id: 7 });
      mock.prisma.transaction.findMany.mockResolvedValue([
        {
          id: 2,
          amount: 50,
          createdAt: new Date('2026-01-01'),
          fromId: 9,
          toId: 7,
          from: { user: { email: 'them@example.com' } },
          to: { user: { email: 'me@example.com' } },
        },
      ]);

      const [result] = await service.findForUser(3);

      expect(result).toMatchObject({
        direction: 'IN',
        counterpartyEmail: 'them@example.com',
      });
    });

    it('throws when the user has no account', async () => {
      mock.prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.findForUser(3)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

/**
 * The test that actually proves the race is fixed. It needs a real PostgreSQL
 * instance, because the guarantee under test is PostgreSQL's row-level locking —
 * a mock cannot demonstrate it.
 *
 * Run with a throwaway database:
 *   docker-compose up -d
 *   cd backend && npx prisma migrate deploy
 *   RUN_DB_TESTS=1 npm test
 *
 * Against the pre-fix implementation this test fails: both transfers succeed and
 * the balance lands at -50. With the conditional update, exactly one succeeds.
 */
const describeWithDatabase = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

describeWithDatabase('TransactionsService concurrency (requires PostgreSQL)', () => {
  // Constructed inside beforeAll, not at describe scope: Jest executes the body
  // of a skipped describe block, so instantiating PrismaClient here would throw
  // on any machine that has not run `prisma generate`.
  let prisma: any;
  let service: TransactionsService;
  let senderId: number;
  let recipientEmail: string;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred on purpose, see the comment above beforeAll
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    // The gateway is irrelevant to what this test proves (row-level locking
    // under concurrency) — a stub that does nothing is enough.
    const gatewayStub = { notifyTransfer: () => {} } as unknown as TransactionsGateway;
    service = new TransactionsService(prisma as unknown as PrismaService, gatewayStub);
  });

  beforeEach(async () => {
    const stamp = Date.now();
    recipientEmail = `recipient-${stamp}@example.test`;

    const sender = await prisma.user.create({
      data: {
        email: `sender-${stamp}@example.test`,
        password: 'not-used-by-this-test',
        accounts: { create: { balance: 100 } },
      },
      include: { accounts: true },
    });

    await prisma.user.create({
      data: {
        email: recipientEmail,
        password: 'not-used-by-this-test',
        accounts: { create: { balance: 0 } },
      },
    });

    senderId = sender.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('never lets concurrent transfers overdraw the account', async () => {
    const dto = Object.assign(new TransferDto(), {
      toEmail: recipientEmail,
      amount: 75,
    });

    // Two 75-unit transfers against a balance of 100. Exactly one must win.
    const results = await Promise.allSettled([
      service.transfer(senderId, dto),
      service.transfer(senderId, dto),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1);

    const account = await prisma.account.findFirst({ where: { userId: senderId } });
    expect(account?.balance).toBe(25);
    expect(account!.balance).toBeGreaterThanOrEqual(0);
  });
});
